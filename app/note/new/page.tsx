'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotes } from '../../../lib/useNotes';

// Client component that handles creating a new note and redirecting
export default function NewNotePage() {
  const router = useRouter();
  const { createNote } = useNotes();

  useEffect(() => {
    // Create new note and redirect to its edit page
    const newNoteId = createNote();
    if (newNoteId) {
      router.replace(`/note/${newNoteId}`);
    } else {
      // If creation failed, go back to home
      router.replace('/');
    }
  }, [createNote, router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-500">Creating new note...</div>
    </div>
  );
}
