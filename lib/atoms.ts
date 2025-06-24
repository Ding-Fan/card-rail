'use client';

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { Note, NestingLevel, MAX_NESTING_LEVEL } from './types';
import { storage } from './storage';
import { getAllMockNotes } from '../data/mockNotes';

// Base atoms for storing notes data
export const notesMapAtom = atomWithStorage<Record<string, Note>>('card-rail-notes', {});

// Derived atoms for different note views
export const activeNotesAtom = atom((get) => {
  const notesMap = get(notesMapAtom);
  return Object.values(notesMap).filter(note => !note.isArchived);
});

export const archivedNotesAtom = atom((get) => {
  const notesMap = get(notesMapAtom);
  return Object.values(notesMap).filter(note => note.isArchived);
});

export const topLevelNotesAtom = atom((get) => {
  const activeNotes = get(activeNotesAtom);
  return activeNotes.filter(note => !note.parent_id);
});

// Atom for tracking cards being removed (for fade animation)
export const removingCardsAtom = atom<Set<string>>(new Set<string>());

// Atom for loading state
export const notesLoadingAtom = atom(false);

// Helper atom to get child notes for a parent
export const getChildNotesAtom = atom((get) => (parentId: string) => {
  const activeNotes = get(activeNotesAtom);
  return activeNotes.filter(note => note.parent_id === parentId);
});

// Helper atom to get a note by ID
export const getNoteByIdAtom = atom((get) => (noteId: string) => {
  const notesMap = get(notesMapAtom);
  return notesMap[noteId];
});

// Helper atom to get nesting level of a note
export const getNestingLevelAtom = atom((get) => (noteId: string): NestingLevel => {
  const getNoteById = get(getNoteByIdAtom);
  
  const getPath = (id: string, path: string[] = []): string[] => {
    const note = getNoteById(id);
    if (!note) return path;
    
    const newPath = [id, ...path];
    if (note.parent_id) {
      return getPath(note.parent_id, newPath);
    }
    return newPath;
  };
  
  const path = getPath(noteId);
  return {
    level: path.length - 1, // 0-indexed: root=0, child=1, grandchild=2
    path: path.reverse() // Root to current order
  };
});

// Helper atom to get subnotes count for a note
export const getSubnotesCountAtom = atom((get) => (noteId: string) => {
  const getChildNotes = get(getChildNotesAtom);
  return getChildNotes(noteId).length;
});

// Helper atom to check if a note can have subnotes (not archived, under nesting limit)
export const canCreateSubnoteAtom = atom((get) => (noteId: string) => {
  const getNoteById = get(getNoteByIdAtom);
  const getNestingLevel = get(getNestingLevelAtom);
  
  const note = getNoteById(noteId);
  if (!note || note.isArchived) return false;
  
  const { level } = getNestingLevel(noteId);
  return level < MAX_NESTING_LEVEL - 1; // Allow up to level 2 (0,1,2)
});

// Action atoms for note operations
export const initializeNotesAtom = atom(null, async (get, set) => {
  set(notesLoadingAtom, true);
  
  try {
    const savedNotes = storage.getNotes();
    if (savedNotes && Object.keys(savedNotes).length > 0) {
      set(notesMapAtom, savedNotes);
    } else {
      // First time load - use mock notes
      const mockNotes = getAllMockNotes();
      const notesObject = mockNotes.reduce((acc, note) => {
        acc[note.id] = note;
        return acc;
      }, {} as Record<string, Note>);
      
      storage.setNotes(notesObject);
      set(notesMapAtom, notesObject);
    }
  } catch (error) {
    console.error('Failed to initialize notes:', error);
    // Fallback to mock notes
    const mockNotes = getAllMockNotes();
    const notesObject = mockNotes.reduce((acc, note) => {
      acc[note.id] = note;
      return acc;
    }, {} as Record<string, Note>);
    
    storage.setNotes(notesObject);
    set(notesMapAtom, notesObject);
  } finally {
    set(notesLoadingAtom, false);
  }
});

export const createNoteAtom = atom(null, (_get, set, params?: { parentId?: string; content?: string }) => {
  const now = new Date();
  const newNote: Note = {
    id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: 'New Note',
    content: params?.content || '',
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    parent_id: params?.parentId,
  };

  set(notesMapAtom, (prev) => {
    const updated = { ...prev, [newNote.id]: newNote };
    storage.setNotes(updated);
    return updated;
  });

  return newNote.id;
});

// Specific atom for creating subnotes with content template
export const createSubnoteAtom = atom(null, (get, set, parentId: string) => {
  const canCreateSubnote = get(canCreateSubnoteAtom);
  if (!canCreateSubnote(parentId)) {
    throw new Error('Cannot create subnote: parent is archived or nesting limit reached');
  }
  
  const getNoteById = get(getNoteByIdAtom);
  const getNestingLevel = get(getNestingLevelAtom);
  const parentNote = getNoteById(parentId);
  const { level } = getNestingLevel(parentId);
  
  const timestamp = new Date().toLocaleString();
  const content = `# New Subnote

Created: ${timestamp}
Parent: ${parentNote?.title || 'Unknown'}
Level: ${level + 1}

`;

  // Create the subnote directly
  const now = new Date();
  const newNote: Note = {
    id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: 'New Subnote',
    content,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    parent_id: parentId,
  };

  set(notesMapAtom, (prev) => {
    const updated = { ...prev, [newNote.id]: newNote };
    storage.setNotes(updated);
    return updated;
  });

  return newNote.id;
});

// Helper atom to get all descendant note IDs (recursive)
export const getDescendantIdsAtom = atom((get) => (noteId: string): string[] => {
  const getChildNotes = get(getChildNotesAtom);
  
  const getDescendants = (id: string): string[] => {
    const children = getChildNotes(id);
    const childIds = children.map(child => child.id);
    const grandchildren = children.flatMap(child => getDescendants(child.id));
    return [...childIds, ...grandchildren];
  };
  
  return getDescendants(noteId);
});

export const updateNoteAtom = atom(null, (_get, set, params: { id: string; updates: Partial<Note> }) => {
  const { id, updates } = params;
  
  set(notesMapAtom, (prev) => {
    if (!prev[id]) return prev;
    
    const updatedNote = {
      ...prev[id],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    
    const updated = { ...prev, [id]: updatedNote };
    storage.setNotes(updated);
    return updated;
  });
});

export const archiveNoteAtom = atom(null, async (get, set, noteId: string) => {
  // Add to removing cards for fade animation
  set(removingCardsAtom, (prev: Set<string>) => new Set([...prev, noteId]));
  
  // Wait for animation
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Optimistically update the note to archived
  set(notesMapAtom, (prev) => {
    if (!prev[noteId]) return prev;
    
    const note = prev[noteId];
    const archivedNote: Note = {
      ...note,
      isArchived: true,
      originalParentId: note.parent_id,
      parent_id: undefined,
      updated_at: new Date().toISOString(),
    };
    
    const updated = { ...prev, [noteId]: archivedNote };
    
    // Try to save to storage
    try {
      storage.setNotes(updated);
      return updated;
    } catch (error) {
      console.error('Failed to archive note:', error);
      // On error, keep the original state and remove from removing cards
      set(removingCardsAtom, (prev: Set<string>) => {
        const newSet = new Set(prev);
        newSet.delete(noteId);
        return newSet;
      });
      return prev;
    }
  });
  
  // Remove from removing cards after successful archive
  set(removingCardsAtom, (prev: Set<string>) => {
    const newSet = new Set(prev);
    newSet.delete(noteId);
    return newSet;
  });
});

export const deleteNoteAtom = atom(null, async (get, set, noteId: string) => {
  // Add to removing cards for fade animation
  set(removingCardsAtom, (prev: Set<string>) => new Set([...prev, noteId]));
  
  // Wait for animation
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Optimistically remove the note
  set(notesMapAtom, (prev) => {
    if (!prev[noteId]) return prev;
    
    const updated = { ...prev };
    delete updated[noteId];
    
    // Try to save to storage
    try {
      storage.setNotes(updated);
      return updated;
    } catch (error) {
      console.error('Failed to delete note:', error);
      // On error, keep the original state and remove from removing cards
      set(removingCardsAtom, (prev: Set<string>) => {
        const newSet = new Set(prev);
        newSet.delete(noteId);
        return newSet;
      });
      return prev;
    }
  });
  
  // Remove from removing cards after successful deletion
  set(removingCardsAtom, (prev: Set<string>) => {
    const newSet = new Set(prev);
    newSet.delete(noteId);
    return newSet;
  });
});

// Action atom for refreshing notes (useful for syncing with localStorage changes)
export const refreshNotesAtom = atom(null, (_get, set) => {
  try {
    const savedNotes = storage.getNotes();
    if (savedNotes) {
      set(notesMapAtom, savedNotes);
    }
  } catch (error) {
    console.error('Failed to refresh notes:', error);
  }
});

// Action atom for handling legacy useNotes compatibility
export const deleteNoteWithChildrenAtom = atom(null, async (get, set, noteId: string) => {
  const notesMap = get(notesMapAtom);
  
  // Find all children recursively
  const findAllChildren = (parentId: string): string[] => {
    const directChildren = Object.values(notesMap)
      .filter(note => note.parent_id === parentId)
      .map(note => note.id);
    
    const allChildren = [...directChildren];
    for (const childId of directChildren) {
      allChildren.push(...findAllChildren(childId));
    }
    
    return allChildren;
  };
  
  const toDelete = [noteId, ...findAllChildren(noteId)];
  
  // Add all notes to removing cards for fade animation
  set(removingCardsAtom, (prev: Set<string>) => new Set([...prev, ...toDelete]));
  
  // Wait for animation
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Remove all notes
  set(notesMapAtom, (prev) => {
    const updated = { ...prev };
    toDelete.forEach(id => delete updated[id]);
    
    try {
      storage.setNotes(updated);
      return updated;
    } catch (error) {
      console.error('Failed to delete notes:', error);
      // On error, remove from removing cards
      set(removingCardsAtom, (prev: Set<string>) => {
        const newSet = new Set(prev);
        toDelete.forEach(id => newSet.delete(id));
        return newSet;
      });
      return prev;
    }
  });
  
  // Remove from removing cards after successful deletion
  set(removingCardsAtom, (prev: Set<string>) => {
    const newSet = new Set(prev);
    toDelete.forEach(id => newSet.delete(id));
    return newSet;
  });
});
