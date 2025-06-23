'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Note } from '../../lib/types';
import { storage } from '../../lib/storage';
import { Card } from '../../components/Card';

export default function ArchivePage() {
    const router = useRouter();
    const [archivedNotes, setArchivedNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load archived notes
    useEffect(() => {
        const loadArchivedNotes = () => {
            try {
                const archived = storage.getArchivedNotes();
                setArchivedNotes(archived);
            } catch (error) {
                console.error('Failed to load archived notes:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadArchivedNotes();
    }, []);

    // Get parent note title for archived notes
    const getParentInfo = (note: Note): string => {
        if (!note.originalParentId) return '';

        const allNotes = storage.getNotes();
        if (!allNotes) return '';

        const parentNote = allNotes[note.originalParentId];
        if (!parentNote) return '';

        const parentTitle = parentNote.title || parentNote.content.split('\n')[0] || 'Untitled';
        return parentTitle.length > 30 ? parentTitle.substring(0, 30) + '...' : parentTitle;
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Archived Notes</h1>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back
                    </button>
                </div>

                {/* Archive Content */}
                {isLoading ? (
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                        <p className="text-gray-500">Loading archived notes...</p>
                    </div>
                ) : archivedNotes.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                        <div className="max-w-md mx-auto">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No archived notes yet</h3>
                            <p className="text-gray-500">
                                When you archive notes, they&apos;ll appear here for safekeeping.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {archivedNotes.map((note) => {
                            const parentInfo = getParentInfo(note);
                            return (
                                <div key={note.id} className="relative">
                                    {/* Parent info badge */}
                                    {parentInfo && (
                                        <div className="mb-2">
                                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                </svg>
                                                was belonged to &ldquo;{parentInfo}&rdquo;
                                            </span>
                                        </div>
                                    )}

                                    {/* Archived card - no interactions */}
                                    <div className="opacity-75">
                                        <Card
                                            note={note}
                                            childCount={0}
                                            showNestedIcon={false}
                                            disableEntryAnimation={true}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
