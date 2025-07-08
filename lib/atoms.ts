'use client';

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { Note, NestingLevel, MAX_NESTING_LEVEL, SyncSettings, User } from './types';
import { storage } from './storage';
import { syncService } from './syncService';
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

// Atom for tracking flipped cards (for card flip animation)
export const flippedCardsAtom = atom<Set<string>>(new Set<string>());

// Sync-related atoms
export const syncSettingsAtom = atomWithStorage<SyncSettings>('card-rail-sync-settings', {
  enabled: false,
  autoSync: true,
  syncInterval: 30000, // 30 seconds
});

export const currentUserAtom = atom<User | null>((get) => {
  const syncSettings = get(syncSettingsAtom);
  return syncSettings.user || null;
});

export const syncStatusAtom = atom<'idle' | 'syncing' | 'error'>('idle');

export const lastSyncTimeAtom = atomWithStorage<number | null>('card-rail-last-sync', null);

export const conflictNotesAtom = atom<Note[]>([]);

// Derived atom for notes with sync status
export const notesWithSyncStatusAtom = atom((get) => {
  const notesMap = get(notesMapAtom);
  const syncSettings = get(syncSettingsAtom);

  // If sync is not enabled, mark all notes as offline
  if (!syncSettings.enabled) {
    return Object.values(notesMap).map(note => ({
      ...note,
      syncStatus: 'offline' as const
    }));
  }

  return Object.values(notesMap);
});

// Derived atom for offline notes only
export const offlineNotesAtom = atom((get) => {
  const notesWithStatus = get(notesWithSyncStatusAtom);
  return notesWithStatus.filter(note => note.syncStatus === 'offline');
});

// Derived atom for synced notes only
export const syncedNotesAtom = atom((get) => {
  const notesWithStatus = get(notesWithSyncStatusAtom);
  return notesWithStatus.filter(note => note.syncStatus === 'synced');
});

// Derived atom for notes with conflicts
export const conflictNotesOnlyAtom = atom((get) => {
  const notesWithStatus = get(notesWithSyncStatusAtom);
  return notesWithStatus.filter(note => note.syncStatus === 'conflict');
});

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
    const syncSettings = get(syncSettingsAtom);
    const now = new Date();

    const newNote: Note = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: 'New Note',
      content: params?.content || '',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      parent_id: params?.parentId,
      isArchived: false,
      syncStatus: syncSettings.enabled ? 'offline' : undefined,
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
  (get, set, params: { id: string; updates: Partial<Note> }) => {
    const { id, updates } = params;
    const syncSettings = get(syncSettingsAtom);

    set(notesMapAtom, (prev) => {
      if (!prev[id]) return prev;

      const updatedNote = {
        ...prev[id],
        ...updates,
        updated_at: new Date().toISOString(),
        // Mark as offline if sync is enabled and note was previously synced
        syncStatus: syncSettings.enabled && prev[id].syncStatus === 'synced' ? 'offline' : prev[id].syncStatus,
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

  // Archive the note in storage
  storage.archiveNote(noteId);

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

  // Delete the note from storage
  storage.deleteNote(noteId);

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

// Sync action atoms
export const enableSyncAtom = atom(
  null,
  (get, set, user: User) => {
    set(syncSettingsAtom, (prev) => ({
      ...prev,
      enabled: true,
      user
    }));
  }
);

export const disableSyncAtom = atom(
  null,
  (get, set) => {
    set(syncSettingsAtom, (prev) => ({
      ...prev,
      enabled: false,
      user: undefined
    }));
  }
);

export const updateSyncSettingsAtom = atom(
  null,
  (get, set, updates: Partial<SyncSettings>) => {
    set(syncSettingsAtom, (prev) => ({
      ...prev,
      ...updates
    }));
  }
);

export const markNoteAsSyncedAtom = atom(
  null,
  (get, set, noteId: string) => {
    set(notesMapAtom, (prev) => {
      if (!prev[noteId]) return prev;

      const updatedNote = {
        ...prev[noteId],
        syncStatus: 'synced' as const,
        lastSyncedAt: new Date().toISOString()
      };

      return { ...prev, [noteId]: updatedNote };
    });
  }
);

export const markNoteAsOfflineAtom = atom(
  null,
  (get, set, noteId: string) => {
    set(notesMapAtom, (prev) => {
      if (!prev[noteId]) return prev;

      const updatedNote = {
        ...prev[noteId],
        syncStatus: 'offline' as const
      };

      return { ...prev, [noteId]: updatedNote };
    });
  }
);

export const addConflictNoteAtom = atom(
  null,
  (get, set, note: Note) => {
    // Add conflict note to the map
    set(notesMapAtom, (prev) => ({
      ...prev,
      [note.id]: note
    }));

    // Add to conflicts list
    set(conflictNotesAtom, (prev) => [...prev, note]);
  }
);

export const resolveConflictAtom = atom(
  null,
  (get, set, noteId: string, useLocal: boolean) => {
    const notesMap = get(notesMapAtom);
    const note = notesMap[noteId];

    if (!note || !note.conflictData) return;

    const resolvedNote = useLocal ? note : note.conflictData;
    resolvedNote.syncStatus = 'synced';
    resolvedNote.lastSyncedAt = new Date().toISOString();
    resolvedNote.conflictData = undefined;

    set(notesMapAtom, (prev) => ({
      ...prev,
      [noteId]: resolvedNote
    }));

    // Remove from conflicts list
    set(conflictNotesAtom, (prev) => prev.filter(n => n.id !== noteId));
  }
);

// Main sync atom that orchestrates the sync process
export const syncNotesAtom = atom(
  null,
  async (get, set) => {
    const syncSettings = get(syncSettingsAtom);
    const currentUser = get(currentUserAtom);

    if (!syncSettings.enabled || !currentUser) {
      return { success: false, conflicts: [] };
    }

    set(syncStatusAtom, 'syncing');

    try {
      const notesMap = get(notesMapAtom);
      const allNotes = Object.values(notesMap);

      // Get offline notes that need to be uploaded
      const offlineNotes = allNotes.filter(note =>
        note.syncStatus === 'offline' || !note.syncStatus
      );

      // Upload offline notes
      const { success: uploadedNotes, conflicts } = await syncService.uploadNotes(
        offlineNotes,
        currentUser.id
      );

      // Update successfully uploaded notes
      uploadedNotes.forEach((note: Note) => {
        set(notesMapAtom, (prev) => ({
          ...prev,
          [note.id]: note
        }));
      });

      // Add conflicts to the conflict notes
      conflicts.forEach((note: Note) => {
        set(notesMapAtom, (prev) => ({
          ...prev,
          [note.id]: note
        }));
      });

      set(conflictNotesAtom, conflicts);

      // Download any new notes from server
      const serverNotes = await syncService.downloadNotes(currentUser.id);

      // Merge server notes (avoiding conflicts)
      serverNotes.forEach((serverNote: Note) => {
        const existingNote = notesMap[serverNote.id];
        if (!existingNote) {
          // New note from server
          set(notesMapAtom, (prev) => ({
            ...prev,
            [serverNote.id]: serverNote
          }));
        }
      });

      set(syncStatusAtom, 'idle');

      // Update sync settings with last sync time
      set(syncSettingsAtom, (prev) => ({
        ...prev,
        lastSyncAt: new Date().toISOString()
      }));

      return { success: true, conflicts };

    } catch (error) {
      console.error('Sync failed:', error);
      set(syncStatusAtom, 'error');
      return { success: false, conflicts: [] };
    }
  }
);

// Auto-sync initialization atom
export const initializeSyncAtom = atom(
  null,
  async (get, set) => {
    const syncSettings = get(syncSettingsAtom);
    const currentUser = get(currentUserAtom);

    console.log('initializeSyncAtom called:', { syncSettings, currentUser });

    if (syncSettings.enabled && currentUser) {
      try {
        console.log('Initializing sync service...');
        // Create proper settings object with user
        const settingsWithUser = {
          ...syncSettings,
          user: currentUser
        };
        await syncService.initialize(settingsWithUser);

        // Perform initial sync
        console.log('Performing initial sync...');
        await set(syncNotesAtom);
        console.log('Initial sync completed');
      } catch (error) {
        console.error('Failed to initialize sync:', error);
      }
    } else {
      console.log('Sync not enabled or no current user:', { enabled: syncSettings.enabled, hasUser: !!currentUser });
    }
  }
);
