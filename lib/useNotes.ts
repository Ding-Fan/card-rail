import { useState, useEffect } from 'react';
import { Note } from '../lib/types';
import { getAllMockNotes } from '../data/mockNotes';

const STORAGE_KEY = 'card-rail-notes';

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load notes from localStorage or fallback to mockNotes
  useEffect(() => {
    const loadNotes = () => {
      try {
        const savedNotes = localStorage.getItem(STORAGE_KEY);
        if (savedNotes) {
          const parsedNotes = JSON.parse(savedNotes);
          // Convert object format to array format
          if (typeof parsedNotes === 'object' && !Array.isArray(parsedNotes)) {
            const noteArray = Object.values(parsedNotes) as Note[];
            setNotes(noteArray);
          } else {
            setNotes(parsedNotes);
          }
        } else {
          // First time load - use mock notes and save to localStorage for local-first behavior
          const mockNotes = getAllMockNotes();
          
          // Convert array to object format for easier access by ID
          const notesObject = mockNotes.reduce((acc, note) => {
            acc[note.id] = note;
            return acc;
          }, {} as Record<string, Note>);
          
          // Save to localStorage immediately for local-first persistence
          localStorage.setItem(STORAGE_KEY, JSON.stringify(notesObject));
          
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
        
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(notesObject));
        } catch (saveError) {
          console.error('Failed to save fallback notes to localStorage:', saveError);
        }
        
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
        const savedNotes = localStorage.getItem(STORAGE_KEY);
        if (savedNotes) {
          const parsedNotes = JSON.parse(savedNotes);
          if (typeof parsedNotes === 'object' && !Array.isArray(parsedNotes)) {
            const noteArray = Object.values(parsedNotes) as Note[];
            setNotes(noteArray);
          } else {
            setNotes(parsedNotes);
          }
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
      const savedNotes = localStorage.getItem(STORAGE_KEY);
      if (savedNotes) {
        const parsedNotes = JSON.parse(savedNotes);
        if (typeof parsedNotes === 'object' && !Array.isArray(parsedNotes)) {
          const noteArray = Object.values(parsedNotes) as Note[];
          setNotes(noteArray);
        } else {
          setNotes(parsedNotes);
        }
      }
    } catch (error) {
      console.error('Failed to refresh notes:', error);
    }
  };

  // Create a new note with auto-generated timestamp title
  const createNote = (): string => {
    const now = new Date();
    const timestamp = now.toLocaleString(); // e.g., "6/19/2025, 10:30:00 AM"
    
    const newNote: Note = {
      id: `note-${Date.now()}`, // Simple ID generation
      title: timestamp,
      content: `# ${timestamp}\n\n`, // Auto-generated header
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };

    try {
      // Get existing notes
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
      
      // Add new note
      notesObject[newNote.id] = newNote;
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notesObject));
      
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

  // Check if note has content beyond auto-generated header
  const hasUserContent = (note: Note): boolean => {
    const timestamp = note.title;
    const expectedHeader = `# ${timestamp}\n\n`;
    
    // If content is exactly the auto-generated header, no user content
    if (note.content === expectedHeader) {
      return false;
    }
    
    // If content starts with the header but has more, user added content
    if (note.content.startsWith(expectedHeader)) {
      const userContent = note.content.slice(expectedHeader.length).trim();
      return userContent.length > 0;
    }
    
    // Content doesn't match expected pattern, assume user content exists
    return true;
  };

  return {
    notes,
    isLoading,
    refreshNotes,
    createNote,
    updateNote,
    deleteNote,
    hasUserContent,
  };
}
