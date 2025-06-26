'use client';

import React, { useMemo } from 'react';
import { useAtomValue, atom } from 'jotai';
import { getChildNotesAtom } from '../lib/atoms';

interface CardBackPanelProps {
    parentNoteId: string;
    onEnterNote: () => void;
    onArchive: () => void;
    onDelete: () => void;
    isArchiveMode?: boolean;
}

export const CardBackPanel: React.FC<CardBackPanelProps> = ({
    parentNoteId,
    onEnterNote,
    onArchive,
    onDelete,
    isArchiveMode = false,
}) => {
    // Create a derived atom for this specific parent's subnotes
    const subnotesSelectorAtom = useMemo(
        () => atom((get) => get(getChildNotesAtom)(parentNoteId)),
        [parentNoteId]
    );
    const subnotes = useAtomValue(subnotesSelectorAtom);

    // Truncate content to first 2 lines (approximately 120 characters)
    const truncateContent = (content: string) => {
        const maxLength = 120;
        if (content.length <= maxLength) return content;

        // Find the last space before maxLength to avoid cutting words
        const truncated = content.substring(0, maxLength);
        const lastSpace = truncated.lastIndexOf(' ');
        return truncated.substring(0, lastSpace > 0 ? lastSpace : maxLength) + '...';
    };

    return (
        <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex flex-col relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                    Subnotes ({subnotes.length})
                </h3>
                <div className="flex items-center space-x-1">
                    {/* 3-Dot Menu Button */}
                    <div className="relative group">
                        <button
                            data-testid="card-back-menu-button"
                            className="w-8 h-8 bg-white hover:bg-gray-100 text-gray-600 rounded-full shadow-sm transition-all duration-200 flex items-center justify-center"
                            onClick={(e) => {
                                e.stopPropagation();
                                // Toggle a simple dropdown menu
                                const menu = e.currentTarget.nextElementSibling as HTMLElement;
                                if (menu) {
                                    menu.classList.toggle('hidden');
                                }
                            }}
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                        </button>

                        {/* Dropdown Menu */}
                        <div className="hidden absolute top-10 right-0 bg-white rounded-lg shadow-lg border z-50 min-w-40">
                            <div className="py-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEnterNote();
                                    }}
                                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                    data-testid="card-back-enter-note"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    Enter Note
                                </button>

                                {isArchiveMode ? (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete();
                                        }}
                                        className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                                        data-testid="card-back-delete"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete Note
                                    </button>
                                ) : (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onArchive();
                                        }}
                                        className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                                        data-testid="card-back-archive"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                        </svg>
                                        Archive Note
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subnotes List */}
            <div className="flex-1 overflow-y-auto space-y-3">
                {subnotes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm">No subnotes yet</p>
                    </div>
                ) : (
                    subnotes.map((subnote) => (
                        <div
                            key={subnote.id}
                            className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                            data-testid={`subnote-${subnote.id}`}
                        >
                            <div className="text-sm text-gray-700 leading-relaxed">
                                {truncateContent(subnote.content)}
                            </div>
                            {subnote.created_at && (
                                <div className="text-xs text-gray-400 mt-2">
                                    {new Date(subnote.created_at).toLocaleDateString()}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Footer hint */}
            <div className="mt-4 text-center">
                <p className="text-xs text-gray-400">
                    Swipe to flip back
                </p>
            </div>
        </div>
    );
};
