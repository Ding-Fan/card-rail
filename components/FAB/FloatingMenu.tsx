/**
 * ============================================================================
 * FLOATING MENU COMPONENT
 * ============================================================================
 * 
 * iOS-style floating menu for FAB actions
 */

import React from 'react';
import * as Portal from '@radix-ui/react-portal';
import { FloatingMenuProps } from './types';

export const FloatingMenu: React.FC<FloatingMenuProps> = ({
    isOpen,
    position,
    onAddNote,
    onViewArchive
}) => {
    if (!isOpen) return null;

    return (
        <Portal.Root>
            <div
                className="fixed pointer-events-none z-[55]"
                style={{
                    left: position.x,
                    top: position.y,
                }}
            >
                <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-200/50 p-1 min-w-[150px] animate-in fade-in-0 zoom-in-95 duration-200">
                    {/* Add Note - Always available */}
                    <button
                        onClick={onAddNote}
                        className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Note
                    </button>

                    {/* View Archive Button */}
                    <button
                        onClick={onViewArchive}
                        className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        View Archive
                    </button>
                </div>
            </div>
        </Portal.Root>
    );
};
