import { useState, useEffect } from 'react';
import { Note } from '../lib/types';
import { getAllMockNotes } from '../data/mockNotes';
import { storage } from './storage';

const STORAGE_KEY = 'card-rail-notes';

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load notes from localStorage or fallback to mockNotes
  useEffect(() => {
    const loadNotes = () => {
      try {
        const savedNotes = storage.getNotes();
        if (savedNotes && Object.keys(savedNotes).length > 0) {
          // Only load active (non-archived) notes
          const activeNotes = storage.getActiveNotes();
          setNotes(activeNotes);
        } else {
          // First time load - use mock notes and save to localStorage for local-first behavior
          const mockNotes = getAllMockNotes();
          
          // Convert array to object format for easier access by ID
          const notesObject = mockNotes.reduce((acc, note) => {
            acc[note.id] = note;
            return acc;
          }, {} as Record<string, Note>);
          
          // Save to localStorage immediately for local-first persistence
          storage.setNotes(notesObject);
          
          setNotes(mockNotes);
        }
      } catch (error) {
        console.error('Failed to load notes from localStorage:', error);
        // Fallback to mock notes and save them for local-first behavior
        const mockNotes = getAllMockNotes();
        
        // Convert array to object format and save to localStorage
        const notesObject = mockNotes.reduce((acc, note) => {
          acc[note.id] = note;
          return acc;
        }, {} as Record<string, Note>);
        
        storage.setNotes(notesObject);
        
        setNotes(mockNotes);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes();
  }, []);

  // Listen for storage changes (when notes are updated in other components)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsedNotes = JSON.parse(e.newValue);
          if (typeof parsedNotes === 'object' && !Array.isArray(parsedNotes)) {
            const noteArray = Object.values(parsedNotes) as Note[];
            setNotes(noteArray);
          } else {
            setNotes(parsedNotes);
          }
        } catch (error) {
          console.error('Failed to parse updated notes:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Listen for custom events when notes are updated in the same tab
  useEffect(() => {
    const handleNotesUpdate = () => {
      try {
        const savedNotes = storage.getNotes();
        if (savedNotes && Object.keys(savedNotes).length > 0) {
          const noteArray = Object.values(savedNotes) as Note[];
          setNotes(noteArray);
        }
      } catch (error) {
        console.error('Failed to reload notes:', error);
      }
    };

    window.addEventListener('notes-updated', handleNotesUpdate);
    return () => window.removeEventListener('notes-updated', handleNotesUpdate);
  }, []);

  const refreshNotes = () => {
    try {
      const savedNotes = storage.getNotes();
      if (savedNotes && Object.keys(savedNotes).length > 0) {
        const noteArray = Object.values(savedNotes) as Note[];
        setNotes(noteArray);
      }
    } catch (error) {
      console.error('Failed to refresh notes:', error);
    }
  };

  // Create a new note (without auto-generated content - will be added by UI)
  const createNote = (): string => {
    const now = new Date();
    
    const newNote: Note = {
      id: `note-${Date.now()}`, // Simple ID generation
      title: 'New Note',
      content: '', // Start with empty content
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };

    try {
      // Get existing notes
      const notesObject = storage.getNotes() || {};
      
      // Add new note
      notesObject[newNote.id] = newNote;
      
      // Save to localStorage
      storage.setNotes(notesObject);
      
      // Update state
      const noteArray = Object.values(notesObject) as Note[];
      setNotes(noteArray);
      
      // Dispatch custom event for cross-component updates
      window.dispatchEvent(new CustomEvent('notes-updated'));
      
      return newNote.id;
    } catch (error) {
      console.error('Failed to create note:', error);
      return '';
    }
  };

  // Update an existing note
  const updateNote = (id: string, updates: Partial<Note>) => {
    try {
      const savedNotes = localStorage.getItem(STORAGE_KEY);
      if (!savedNotes) return;
      
      const parsedNotes = JSON.parse(savedNotes);
      let notesObject: Record<string, Note> = {};
      
      if (typeof parsedNotes === 'object' && !Array.isArray(parsedNotes)) {
        notesObject = parsedNotes;
      } else {
        // Convert array to object format
        notesObject = parsedNotes.reduce((acc: Record<string, Note>, note: Note) => {
          acc[note.id] = note;
          return acc;
        }, {});
      }
      
      if (notesObject[id]) {
        notesObject[id] = {
          ...notesObject[id],
          ...updates,
          updated_at: new Date().toISOString()
        };
        
        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notesObject));
        
        // Update state
        const noteArray = Object.values(notesObject) as Note[];
        setNotes(noteArray);
        
        // Dispatch custom event for cross-component updates
        window.dispatchEvent(new CustomEvent('notes-updated'));
      }
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  // Delete a note
  const deleteNote = (id: string) => {
    try {
      const savedNotes = localStorage.getItem(STORAGE_KEY);
      if (!savedNotes) return;
      
      const parsedNotes = JSON.parse(savedNotes);
      let notesObject: Record<string, Note> = {};
      
      if (typeof parsedNotes === 'object' && !Array.isArray(parsedNotes)) {
        notesObject = parsedNotes;
      } else {
        // Convert array to object format
        notesObject = parsedNotes.reduce((acc: Record<string, Note>, note: Note) => {
          acc[note.id] = note;
          return acc;
        }, {});
      }
      
      delete notesObject[id];
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notesObject));
      
      // Update state
      const noteArray = Object.values(notesObject) as Note[];
      setNotes(noteArray);
      
      // Dispatch custom event for cross-component updates
      window.dispatchEvent(new CustomEvent('notes-updated'));
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  // Get child notes for a specific parent
  const getChildNotes = (parentId: string): Note[] => {
    return notes.filter(note => note.parent_id === parentId);
  };

  // Get top-level notes (no parent)
  const getTopLevelNotes = (): Note[] => {
    return notes.filter(note => !note.parent_id);
  };

  // Create a nested note with a parent
  const createNestedNote = (parentId: string, initialContent: string = ''): string => {
    const timestamp = new Date().toISOString();
    const newId = `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newNote: Note = {
      id: newId,
      title: '',
      content: initialContent,
      created_at: timestamp,
      updated_at: timestamp,
      parent_id: parentId
    };

    try {
      const savedNotes = localStorage.getItem(STORAGE_KEY);
      let notesObject: Record<string, Note> = {};
      
      if (savedNotes) {
        const parsedNotes = JSON.parse(savedNotes);
        if (typeof parsedNotes === 'object' && !Array.isArray(parsedNotes)) {
          notesObject = parsedNotes;
        } else {
          // Convert array to object format
          notesObject = parsedNotes.reduce((acc: Record<string, Note>, note: Note) => {
            acc[note.id] = note;
            return acc;
          }, {});
        }
      }
      
      notesObject[newId] = newNote;
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notesObject));
      
      // Update state
      const noteArray = Object.values(notesObject) as Note[];
      setNotes(noteArray);
      
      // Dispatch custom event for cross-component updates
      window.dispatchEvent(new CustomEvent('notes-updated'));
      
      return newId;
    } catch (error) {
      console.error('Failed to create nested note:', error);
      return newId; // Return ID even if save failed
    }
  };

  // Delete a note and all its children recursively
  const deleteNoteWithChildren = (id: string) => {
    try {
      const savedNotes = localStorage.getItem(STORAGE_KEY);
      if (!savedNotes) return;
      
      const parsedNotes = JSON.parse(savedNotes);
      let notesObject: Record<string, Note> = {};
      
      if (typeof parsedNotes === 'object' && !Array.isArray(parsedNotes)) {
        notesObject = parsedNotes;
      } else {
        // Convert array to object format
        notesObject = parsedNotes.reduce((acc: Record<string, Note>, note: Note) => {
          acc[note.id] = note;
          return acc;
        }, {});
      }
      
      // Find all children recursively
      const findAllChildren = (parentId: string): string[] => {
        const directChildren = Object.values(notesObject)
          .filter(note => note.parent_id === parentId)
          .map(note => note.id);
        
        const allChildren = [...directChildren];
        for (const childId of directChildren) {
          allChildren.push(...findAllChildren(childId));
        }
        
        return allChildren;
      };
      
      // Delete the note and all its children
      const toDelete = [id, ...findAllChildren(id)];
      toDelete.forEach(noteId => {
        delete notesObject[noteId];
      });
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notesObject));
      
      // Update state
      const noteArray = Object.values(notesObject) as Note[];
      setNotes(noteArray);
      
      // Dispatch custom event for cross-component updates
      window.dispatchEvent(new CustomEvent('notes-updated'));
    } catch (error) {
      console.error('Failed to delete note with children:', error);
    }
  };

  // Get a note by ID
  const getNoteById = (id: string): Note | undefined => {
    return notes.find(note => note.id === id);
  };

  return {
    notes,
    isLoading,
    refreshNotes,
    createNote,
    updateNote,
    deleteNote,
    getChildNotes,
    getTopLevelNotes,
    createNestedNote,
    deleteNoteWithChildren,
    getNoteById,
  };
}
