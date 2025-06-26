'use client';

import React, { useRef, useEffect } from 'react';
import * as anime from 'animejs';

type DrawerState = 'closed' | 'menu' | 'archive-confirm' | 'delete-confirm';

interface CardDrawerProps {
    drawerState: DrawerState;
    isArchiveMode?: boolean;
    subnoteCount?: number;
    onOpenNoteClick: () => void;
    onArchiveClick: () => void;
    onDeleteClick: () => void;
    onArchiveConfirm: () => void;
    onArchiveCancel: () => void;
    onDeleteConfirm: () => void;
    onDeleteCancel: () => void;
}

export const CardDrawer: React.FC<CardDrawerProps> = ({
    drawerState,
    isArchiveMode = false,
    subnoteCount = 0,
    onOpenNoteClick,
    onArchiveClick,
    onDeleteClick,
    onArchiveConfirm,
    onArchiveCancel,
    onDeleteConfirm,
    onDeleteCancel,
}) => {
    const drawerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const isDrawerOpen = drawerState !== 'closed';
    const isMenuVisible = drawerState === 'menu';

    // Animate height when content changes
    useEffect(() => {
        if (!drawerRef.current || !contentRef.current || !isDrawerOpen) return;

        // Get the natural height of the current content
        const contentHeight = contentRef.current.scrollHeight;

        // Animate to the new height
        anime.animate(drawerRef.current, {
            height: contentHeight,
            duration: 250,
            ease: 'outQuart',
        });
    }, [drawerState, isDrawerOpen, isArchiveMode]);

    // Set initial height when drawer opens
    useEffect(() => {
        if (!drawerRef.current || !contentRef.current) return;

        if (isDrawerOpen) {
            // Set initial height without animation when opening
            const contentHeight = contentRef.current.scrollHeight;
            drawerRef.current.style.height = `${contentHeight}px`;
        }
    }, [isDrawerOpen]);

    return (
        <div
            ref={drawerRef}
            data-testid="card-drawer-menu"
            data-menu-open={isDrawerOpen}
            className={`absolute bottom-0 left-6 right-6 bg-gray-50/95 backdrop-blur-sm border border-gray-200/50 rounded-t-xl shadow-sm transform transition-transform duration-300 ease-out z-10 overflow-hidden ${isDrawerOpen ? 'translate-y-0' : 'translate-y-full'
                }`}
            style={{ height: 'auto' }}
        >
            <div ref={contentRef}>
                {/* Menu Content */}
                {isMenuVisible && (
                    <div className="px-4 py-3 space-y-0">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onOpenNoteClick();
                            }}
                            data-testid="enter-note-button"
                            className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors rounded-md border-b border-gray-200/50 last:border-b-0"
                        >
                            <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Enter Note
                        </button>

                        {isArchiveMode ? (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onDeleteClick();
                                }}
                                className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors rounded-md"
                                data-testid="delete-button"
                            >
                                <svg className="w-5 h-5 mr-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete Note
                            </button>
                        ) : (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onArchiveClick();
                                }}
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                    // For desktop, trigger on mousedown to be more responsive
                                    onArchiveClick();
                                }}
                                onTouchEnd={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    // For mobile, use touchend instead of click
                                    onArchiveClick();
                                }}
                                style={{ touchAction: 'manipulation' }}
                                className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors rounded-md"
                                data-testid="archive-button"
                            >
                                <svg className="w-5 h-5 mr-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                                Archive Note
                            </button>
                        )}
                    </div>
                )}

                {/* Archive Confirmation Content */}
                {drawerState === 'archive-confirm' && (
                    <div className="px-4 py-4 text-center">
                        <h3 className="text-lg font-semibold text-orange-900 mb-2">Archive Note</h3>
                        <p className="text-sm text-orange-700 mb-4">
                            Are you sure you want to archive this note?
                            {subnoteCount > 0 && (
                                <span className="block mt-1 font-medium">
                                    This will also archive {subnoteCount} subnote{subnoteCount !== 1 ? 's' : ''}.
                                </span>
                            )}
                        </p>
                        <div className="flex space-x-3 justify-center">
                            <button
                                onClick={onArchiveCancel}
                                data-testid="archive-cancel-button"
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onArchiveConfirm}
                                data-testid="archive-confirm-button"
                                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-orange-600 rounded-md hover:bg-orange-700 transition-colors"
                            >
                                Archive
                            </button>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Content */}
                {drawerState === 'delete-confirm' && (
                    <div className="px-4 py-4 text-center">
                        <h3 className="text-lg font-semibold text-red-900 mb-2">Delete Note</h3>
                        <p className="text-sm text-red-700 mb-4">
                            Are you sure you want to permanently delete this note? This action cannot be undone.
                            {subnoteCount > 0 && (
                                <span className="block mt-1 font-medium">
                                    This will also delete {subnoteCount} subnote{subnoteCount !== 1 ? 's' : ''}.
                                </span>
                            )}
                        </p>
                        <div className="flex space-x-3 justify-center">
                            <button
                                onClick={onDeleteCancel}
                                data-testid="delete-cancel-button"
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onDeleteConfirm}
                                data-testid="delete-confirm-button"
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-md hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
