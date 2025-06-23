'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '../../../components/Card';
import { useNotes } from '../../../lib/useNotes';
import { useFAB } from '../../../components/FAB/FABContext';
import { Note } from '../../../lib/types';

interface NoteViewClientProps {
  notePath: string[];
}

export const NoteViewClient: React.FC<NoteViewClientProps> = ({ notePath }) => {
  const router = useRouter();
  const { notes, isLoading, getChildNotes, createNestedNote, getNoteById } = useNotes();
  const { setCreateNoteHandler } = useFAB();
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [breadcrumbNotes, setBreadcrumbNotes] = useState<Note[]>([]);
  const [childNotes, setChildNotes] = useState<Note[]>([]);

  // Get the current note ID (last in path)
  const currentNoteId = notePath[notePath.length - 1];

  // Determine if we're at root level or nested
  const isRootLevel = notePath.length === 1;
  const nestingLevel = notePath.length - 1;

  useEffect(() => {
    if (!isLoading && notePath.length > 0) {
      // Get current note
      const note = getNoteById(currentNoteId);
      setCurrentNote(note || null);

      // Build breadcrumb trail
      const breadcrumbs: Note[] = [];
      for (let i = 0; i < notePath.length; i++) {
        const noteId = notePath[i];
        const note = getNoteById(noteId);
        if (note) {
          breadcrumbs.push(note);
        }
      }
      setBreadcrumbNotes(breadcrumbs);

      // Get child notes for current note
      if (note) {
        const children = getChildNotes(note.id);
        setChildNotes(children);
      }
    }
  }, [notePath, notes, isLoading, currentNoteId, getNoteById, getChildNotes]);

  const handleCreateNestedNote = () => {
    const timestamp = new Date().toLocaleString();
    const newNoteId = createNestedNote(currentNoteId, `# New Note\n\nCreated: ${timestamp}\n\nParent: ${currentNote?.title || 'Unknown'}\nNesting Level: ${nestingLevel + 1}\n\n`);

    // Navigate to the new nested note
    const newPath = [...notePath, newNoteId];
    router.push(`/note/${newPath.join('/')}`);
  };

  // Register the create note handler with the global FAB
  useEffect(() => {
    setCreateNoteHandler(handleCreateNestedNote);

    // Cleanup: reset to default behavior when leaving this page
    return () => setCreateNoteHandler(undefined);
  }, [setCreateNoteHandler, currentNoteId, currentNote?.title, nestingLevel, notePath, createNestedNote, router]);

  const handleEditCurrentNote = () => {
    // Navigate to edit mode using existing edit route
    router.push(`/note/${currentNoteId}`);
  };

  // Removed handleCardTap - card clicks should do nothing

  const handleBreadcrumbClick = (index: number) => {
    // Navigate to a specific level in the hierarchy
    const newPath = notePath.slice(0, index + 1);
    router.push(`/note/${newPath.join('/')}`);
  };

  const handleBackClick = () => {
    if (notePath.length === 1) {
      // At root level, go to home
      router.push('/');
    } else {
      // Go up one level
      const parentPath = notePath.slice(0, -1);
      router.push(`/note/${parentPath.join('/')}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!currentNote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-700 mb-4">Note not found</h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Breadcrumb Navigation */}
      {!isRootLevel && (
        <div className="sticky top-0 z-30 bg-white shadow-sm border-b">
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => router.push('/')}
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                Home
              </button>
              {breadcrumbNotes.map((note, index) => (
                <React.Fragment key={note.id}>
                  <span className="text-gray-400">/</span>
                  <button
                    onClick={() => handleBreadcrumbClick(index)}
                    className={`transition-colors truncate max-w-32 ${index === breadcrumbNotes.length - 1
                        ? 'text-gray-900 font-medium'
                        : 'text-blue-600 hover:text-blue-800'
                      }`}
                  >
                    {note.title || `Note ${index + 1}`}
                  </button>
                </React.Fragment>
              ))}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-gray-500">Level {nestingLevel}</span>
                <button
                  onClick={handleEditCurrentNote}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Note Display */}
      <div className="p-4 pb-2">
        <div className="mb-6">
          {!isRootLevel && (
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={handleBackClick}
                className="text-blue-600 hover:text-blue-800 transition-colors text-sm"
              >
                ← Back
              </button>
              <span className="text-sm text-gray-500">
                {childNotes.length} {childNotes.length === 1 ? 'child note' : 'child notes'}
              </span>
            </div>
          )}

          <div
            className={`transition-all duration-300 ${isRootLevel
                ? 'scale-100'
                : 'scale-95 opacity-90 hover:scale-100 hover:opacity-100'
              }`}
            style={!isRootLevel ? {
              transformStyle: 'preserve-3d',
              transform: `perspective(1000px) rotateX(${Math.min(nestingLevel * 2, 10)}deg)`
            } : {}}
          >
            <Card
              note={currentNote}
              showNestedIcon={false}
              disableEntryAnimation={!isRootLevel}
            />
          </div>
        </div>
      </div>

      {/* Child Notes */}
      <div className="px-4 pb-20">
        {childNotes.length > 0 ? (
          <>
            <h2 className="text-sm font-medium text-gray-600 mb-4">
              Child Notes ({childNotes.length})
            </h2>
            <div className="space-y-4">
              {childNotes.map((note) => (
                <Card
                  key={note.id}
                  note={note}
                  childCount={getChildNotes(note.id).length}
                  showNestedIcon={true}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              No child notes yet
            </h3>
            <p className="text-gray-500 mb-6">
              Create a nested note to extend this hierarchy
            </p>
            <button
              onClick={handleCreateNestedNote}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Create Child Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
