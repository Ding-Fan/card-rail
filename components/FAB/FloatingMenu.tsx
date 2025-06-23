/**
 * ============================================================================
 * FLOATING MENU COMPONENT
 * ============================================================================
 * 
 * iOS-style floating menu for FAB actions with auto-hiding text labels
 */

import React, { useState, useEffect } from 'react';
import * as Portal from '@radix-ui/react-portal';
import { FloatingMenuProps } from './types';

export const FloatingMenu: React.FC<FloatingMenuProps> = ({
    isOpen,
    position,
    onAddNote,
    onViewArchive
}) => {
    const [showLabels, setShowLabels] = useState(false);

    // Auto-hide labels after 1 seconds
    useEffect(() => {
        if (isOpen) {
            setShowLabels(true);
            const timer = setTimeout(() => {
                setShowLabels(false);
            }, 1000);

            return () => clearTimeout(timer);
        } else {
            setShowLabels(false);
        }
    }, [isOpen]);

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
                {/* Icon buttons container */}
                <div className="pointer-events-auto flex flex-col gap-3">
                    {/* Add Note Button */}
                    <div className="flex items-center gap-3">
                        {/* Text label - positioned to the left */}
                        <button
                            onClick={onAddNote}
                            className={`bg-black/80 text-white px-3 py-1 rounded-lg text-sm font-medium transition-all duration-500 hover:bg-black/90 ${showLabels ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
                                }`}
                        >
                            Add Note
                        </button>
                        {/* Icon button */}
                        <button
                            onClick={onAddNote}
                            className="w-12 h-12 bg-white/95 backdrop-blur-md rounded-full shadow-xl border border-gray-200/50 flex items-center justify-center hover:bg-gray-50 transition-colors animate-in fade-in-0 zoom-in-95 duration-200"
                        >
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>

                    {/* View Archive Button */}
                    <div className="flex items-center gap-3">
                        {/* Text label - positioned to the left */}
                        <button
                            onClick={onViewArchive}
                            className={`bg-black/80 text-white px-3 py-1 rounded-lg text-sm font-medium transition-all duration-500 delay-100 hover:bg-black/90 ${showLabels ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
                                }`}
                        >
                            View Archive
                        </button>
                        {/* Icon button */}
                        <button
                            onClick={onViewArchive}
                            className="w-12 h-12 bg-white/95 backdrop-blur-md rounded-full shadow-xl border border-gray-200/50 flex items-center justify-center hover:bg-gray-50 transition-colors animate-in fade-in-0 zoom-in-95 duration-200"
                        >
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </Portal.Root>
    );
};
