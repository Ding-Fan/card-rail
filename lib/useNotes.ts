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

  return {
    notes,
    isLoading,
    refreshNotes,
  };
}
