'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useAtomValue, useSetAtom } from 'jotai';
import { getNoteByIdAtom, initializeNotesAtom, notesLoadingAtom } from '../../../lib/atoms';
import NoteClient from './NoteClient';

interface NotePageWrapperProps {
    noteId: string;
}

export default function NotePageWrapper({ noteId }: NotePageWrapperProps) {
    const getNoteById = useAtomValue(getNoteByIdAtom);
    const isLoading = useAtomValue(notesLoadingAtom);
    const initializeNotes = useSetAtom(initializeNotesAtom);

    // Initialize notes when component mounts
    useEffect(() => {
        initializeNotes();
    }, [initializeNotes]);

    const note = getNoteById(noteId);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    if (!note) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Note not found</h1>
                    <Link
                        href="/"
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                        Go Back
                    </Link>
                </div>
            </div>
        );
    }

    return <NoteClient note={note} noteId={noteId} />;
}
