'use client';

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { Note, NestingLevel, MAX_NESTING_LEVEL } from './types';
import { storage } from './storage';
import { getAllMockNotes } from '../data/mockNotes';

// Base atoms for storing notes data
// Initialize with mock notes as default value
const getInitialNotes = (): Record<string, Note> => {
  const mockNotes = getAllMockNotes();
  return mockNotes.reduce((acc, note) => {
    acc[note.id] = note;
    return acc;
  }, {} as Record<string, Note>);
};

export const notesMapAtom = atomWithStorage<Record<string, Note>>('card-rail-notes', getInitialNotes());

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
  return activeNotes
    .filter(note => !note.parent_id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); // Newest first
});

// Atom for tracking cards being removed (for fade animation)
export const removingCardsAtom = atom<Set<string>>(new Set<string>());

// Atom for tracking flipped cards state (persistent)
// Use custom serialization for Set storage
export const flippedCardsAtom = atomWithStorage<Set<string>>(
  'card-rail-flipped', 
  new Set<string>(),
  {
    getItem: (key, initialValue) => {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          return new Set(Array.isArray(parsed) ? parsed : []);
        }
      } catch (error) {
        console.warn('Failed to parse flipped cards from storage:', error);
      }
      return initialValue;
    },
    setItem: (key, newValue) => {
      try {
        localStorage.setItem(key, JSON.stringify(Array.from(newValue)));
      } catch (error) {
        console.warn('Failed to save flipped cards to storage:', error);
      }
    },
    removeItem: (key) => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn('Failed to remove flipped cards from storage:', error);
      }
    },
  }
);

// Action atom to flip a card
export const flipCardAtom = atom(
  null,
  (get, set, noteId: string) => {
    const flippedCards = get(flippedCardsAtom);
    const newFlippedCards = new Set(flippedCards);
    
    if (newFlippedCards.has(noteId)) {
      newFlippedCards.delete(noteId);
    } else {
      newFlippedCards.add(noteId);
    }
    
    set(flippedCardsAtom, newFlippedCards);
  }
);

// Action atom to flip all cards to front
export const flipAllCardsToFrontAtom = atom(
  null,
  (get, set) => {
    set(flippedCardsAtom, new Set<string>());
  }
);

// Atom for loading state
export const notesLoadingAtom = atom(false);

// Helper atom to get child notes for a parent
export const getChildNotesAtom = atom((get) => (parentId: string) => {
  const activeNotes = get(activeNotesAtom);
  return activeNotes
    .filter(note => note.parent_id === parentId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); // Newest first
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
// Simplified initialization - atomWithStorage handles the rest
export const initializeNotesAtom = atom(null, async (get, set) => {
  console.log('🔄 Initializing notes...');
  set(notesLoadingAtom, true);
  
  // atomWithStorage will automatically load from localStorage or use default value
  // We just need to trigger any initialization logic here if needed
  const currentNotes = get(notesMapAtom);
  console.log('✅ Notes loaded via atomWithStorage:', Object.keys(currentNotes).length, 'notes');
  
  set(notesLoadingAtom, false);
});

export const createNoteAtom = atom(
  null, 
  (get, set, params?: { parentId?: string; content?: string }) => {
    const now = new Date();
    const newNote: Note = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: 'New Note',
      content: params?.content || '',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      parent_id: params?.parentId,
      isArchived: false,
    };

    // Update the notes map
    const currentNotes = get(notesMapAtom);
    const newNotes = {
      ...currentNotes,
      [newNote.id]: newNote,
    };
    set(notesMapAtom, newNotes);
    
    // The atomWithStorage should handle persistence automatically
    
    return newNote;
  }
);

export const updateNoteAtom = atom(
  null,
  (_get, set, params: { id: string; updates: Partial<Note> }) => {
    const { id, updates } = params;
    
    set(notesMapAtom, (prev) => {
      if (!prev[id]) return prev;
      
      const updatedNote = {
        ...prev[id],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      
      return { ...prev, [id]: updatedNote };
    });
  }
);

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
    
    return { ...prev, [noteId]: archivedNote };
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
    return updated;
    
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
    return updated;
  });
  
  // Remove from removing cards after successful deletion
  set(removingCardsAtom, (prev: Set<string>) => {
    const newSet = new Set(prev);
    toDelete.forEach(id => newSet.delete(id));
    return newSet;
  });
});
