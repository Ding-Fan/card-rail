# Jotai State Management Migration Guide

This document explains the transition from local state management to Jotai atomic state management in Card Rail.

## Overview

Card Rail has been refactored to use **Jotai** for all note state management, providing better performance, cleaner code, and more predictable state updates.

## Key Changes

### Before: Local State + Storage Utilities
```typescript
// Old approach - manual state management
const [notes, setNotes] = useState<Note[]>([]);

useEffect(() => {
  const savedNotes = storage.getNotes();
  setNotes(Object.values(savedNotes));
}, []);

const handleArchive = (noteId: string) => {
  storage.archiveNote(noteId);
  setNotes(storage.getActiveNotes());
};
```

### After: Jotai Atoms
```typescript
// New approach - reactive atoms
const activeNotes = useAtomValue(activeNotesAtom);
const [, archiveNote] = useAtom(archiveNoteAtom);

const handleArchive = (noteId: string) => {
  archiveNote(noteId); // State updates automatically
};
```

## Architecture Benefits

### 1. Automatic Persistence
- **Before**: Manual localStorage calls
- **After**: `atomWithStorage` handles persistence automatically

### 2. Reactive Updates
- **Before**: Manual state synchronization between components
- **After**: All components automatically re-render when relevant atoms change

### 3. Performance Optimization
- **Before**: Entire component tree re-renders on any state change
- **After**: Only components using specific atoms re-render

### 4. Type Safety
- **Before**: Manual type assertions for localStorage data
- **After**: Full TypeScript inference with Jotai atoms

## File Structure Changes

### New Files Added
```
lib/
├── atoms.ts              # All Jotai atoms and state logic
├── JotaiProvider.tsx     # Provider wrapper component
└── storage.ts            # Updated localStorage utilities

test/
└── utils.tsx             # Updated with JotaiProvider wrapper
```

### Modified Files
```
app/
├── layout.tsx            # Added JotaiProvider wrapper
├── page.tsx              # Refactored to use Jotai atoms
└── archive/page.tsx      # Refactored to use Jotai atoms

components/
├── Card.tsx              # Refactored for Jotai integration
└── Card.test.tsx         # Updated tests for new state management
```

## Core Atoms Reference

### Storage Atoms
```typescript
// Base notes storage
export const notesMapAtom = atomWithStorage<Record<string, Note>>('card-rail-notes', {});

// UI state for fade animations
export const removingCardsAtom = atom<Set<string>>(new Set());
```

### Derived Atoms
```typescript
// Active (non-archived) notes
export const activeNotesAtom = atom((get) => {
  const notesMap = get(notesMapAtom);
  return Object.values(notesMap).filter(note => !note.isArchived);
});

// Archived notes
export const archivedNotesAtom = atom((get) => {
  const notesMap = get(notesMapAtom);
  return Object.values(notesMap).filter(note => note.isArchived);
});
```

### Action Atoms
```typescript
// Archive a note
export const archiveNoteAtom = atom(null, (get, set, noteId: string) => {
  const notes = get(notesMapAtom);
  if (notes[noteId]) {
    const updated = {
      ...notes,
      [noteId]: { ...notes[noteId], isArchived: true }
    };
    set(notesMapAtom, updated);
  }
});

// Delete a note permanently
export const deleteNoteAtom = atom(null, (get, set, noteId: string) => {
  const notes = get(notesMapAtom);
  const { [noteId]: deleted, ...remaining } = notes;
  set(notesMapAtom, remaining);
});
```

## Component Integration Patterns

### Reading State
```typescript
import { useAtomValue } from 'jotai';
import { activeNotesAtom } from '../lib/atoms';

function NotesListComponent() {
  const notes = useAtomValue(activeNotesAtom);
  
  return (
    <div>
      {notes.map(note => (
        <Card key={note.id} note={note} />
      ))}
    </div>
  );
}
```

### Updating State
```typescript
import { useAtom } from 'jotai';
import { archiveNoteAtom, deleteNoteAtom } from '../lib/atoms';

function CardComponent({ note }: { note: Note }) {
  const [, archiveNote] = useAtom(archiveNoteAtom);
  const [, deleteNote] = useAtom(deleteNoteAtom);
  
  const handleArchive = () => {
    archiveNote(note.id);
  };
  
  const handleDelete = () => {
    deleteNote(note.id);
  };
  
  return (
    <div>
      <button onClick={handleArchive}>Archive</button>
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
}
```

### Complex State with UI Effects
```typescript
import { useAtom, useAtomValue } from 'jotai';
import { removingCardsAtom, archiveNoteAtom } from '../lib/atoms';

function CardWithAnimation({ note }: { note: Note }) {
  const removingCards = useAtomValue(removingCardsAtom);
  const [, setRemovingCards] = useAtom(removingCardsAtom);
  const [, archiveNote] = useAtom(archiveNoteAtom);
  
  const isRemoving = removingCards.has(note.id);
  
  const handleArchiveWithAnimation = async () => {
    // Start fade animation
    setRemovingCards(prev => new Set([...prev, note.id]));
    
    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Archive the note
    archiveNote(note.id);
    
    // Clean up animation state
    setRemovingCards(prev => {
      const next = new Set(prev);
      next.delete(note.id);
      return next;
    });
  };
  
  return (
    <div className={`transition-opacity ${isRemoving ? 'opacity-0' : 'opacity-100'}`}>
      <button onClick={handleArchiveWithAnimation}>Archive</button>
    </div>
  );
}
```

## Testing Changes

### Test Setup
All tests now require `JotaiProvider` wrapper:

```typescript
// test/utils.tsx
import { render } from '@testing-library/react';
import { JotaiProvider } from '../lib/JotaiProvider';

export const renderWithJotai = (ui: React.ReactElement) => {
  return render(
    <JotaiProvider>
      {ui}
    </JotaiProvider>
  );
};

export * from '@testing-library/react';
export { renderWithJotai as render };
```

### Testing Atoms
```typescript
import { renderHook } from '@testing-library/react';
import { useAtomValue, useAtom } from 'jotai';
import { JotaiProvider } from '../lib/JotaiProvider';
import { activeNotesAtom, archiveNoteAtom } from '../lib/atoms';

test('should archive note and update active notes', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <JotaiProvider>{children}</JotaiProvider>
  );
  
  const { result } = renderHook(() => ({
    activeNotes: useAtomValue(activeNotesAtom),
    archiveNote: useAtom(archiveNoteAtom)[1]
  }), { wrapper });
  
  // Test archiving logic
  act(() => {
    result.current.archiveNote('note-1');
  });
  
  expect(result.current.activeNotes).not.toContain(
    expect.objectContaining({ id: 'note-1' })
  );
});
```

## Migration Benefits Summary

1. **🔄 Automatic Reactivity**: No more manual state synchronization
2. **💾 Seamless Persistence**: Built-in localStorage integration
3. **⚡ Better Performance**: Granular re-rendering based on atom usage
4. **🧪 Easier Testing**: Atomic state is easier to mock and test
5. **🔒 Type Safety**: Full TypeScript support with inferred types
6. **📱 Predictable Updates**: State changes are atomic and consistent
7. **🎨 Animation Integration**: Clean separation of UI state and business logic

## Next Steps

The Jotai architecture provides a solid foundation for future features:

- **Real-time Collaboration**: Easy to extend with remote sync atoms
- **Undo/Redo**: State history can be tracked at the atom level
- **Optimistic Updates**: Network operations can be handled transparently
- **Advanced Caching**: Atom-level caching strategies
- **State Debugging**: Jotai DevTools integration for development

This migration sets Card Rail up for scalable, maintainable state management as the application grows.
