'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAtomValue, atom } from 'jotai';
import * as anime from 'animejs';
import { Card } from './Card';
import { getChildNotesAtom } from '../lib/atoms';

interface SubnotesPanelProps {
    parentNoteId: string;
    isVisible: boolean;
    onVisibilityChange: (visible: boolean) => void;
}

export const SubnotesPanel: React.FC<SubnotesPanelProps> = ({
    parentNoteId,
    isVisible,
    onVisibilityChange,
}) => {
    // Create a derived atom for this specific parent's subnotes
    const subnotesSelectorAtom = useMemo(
        () => atom((get) => get(getChildNotesAtom)(parentNoteId)),
        [parentNoteId]
    );
    const subnotes = useAtomValue(subnotesSelectorAtom);
    const panelRef = useRef<HTMLDivElement>(null);
    const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Animate panel in/out
    useEffect(() => {
        if (!panelRef.current) return;

        const targetX = isVisible ? 0 : 'calc(100% - 10px)';

        anime.animate(panelRef.current, {
            translateX: targetX,
            duration: 300,
            ease: 'outQuart',
        });
    }, [isVisible]);

    // Handle touch gestures for swipe
    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        setTouchStart({ x: touch.clientX, y: touch.clientY });
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!touchStart || !isDragging) return;

        const touch = e.touches[0];
        const deltaX = touchStart.x - touch.clientX;
        const deltaY = Math.abs(touchStart.y - touch.clientY);

        // Only handle horizontal swipes
        if (deltaY > 50) {
            setIsDragging(false);
            return;
        }

        // Swipe left to show, right to hide
        if (Math.abs(deltaX) > 50) {
            if (deltaX > 0 && !isVisible) {
                // Swiping left, show panel
                onVisibilityChange(true);
            } else if (deltaX < 0 && isVisible) {
                // Swiping right, hide panel
                onVisibilityChange(false);
            }
            setIsDragging(false);
        }
    };

    const handleTouchEnd = () => {
        setTouchStart(null);
        setIsDragging(false);
    };

    // Handle edge tap to show panel
    const handleEdgeClick = () => {
        if (!isVisible) {
            onVisibilityChange(true);
        }
    };

    if (subnotes.length === 0) {
        return null; // Don't render if no subnotes
    }

    return (
        <>
            {/* Touch overlay for detecting swipes when panel is hidden */}
            {!isVisible && (
                <div
                    className="fixed top-0 right-0 w-6 h-full z-20"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                />
            )}

            {/* Subnotes Panel */}
            <div
                ref={panelRef}
                className="fixed top-0 right-0 w-full h-full bg-white shadow-xl z-30 flex"
                style={{
                    transform: isVisible ? 'translateX(0)' : 'translateX(calc(100% - 10px))',
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Visible edge when panel is hidden */}
                <div
                    className={`w-3 bg-gray-100 border-l border-gray-200 flex-shrink-0 cursor-pointer ${!isVisible ? 'shadow-md' : ''
                        }`}
                    onClick={handleEdgeClick}
                >
                    {/* Visual indicator */}
                    <div className="h-full w-full flex items-center justify-center">
                        <div className="w-1 h-8 bg-gray-300 rounded-full" />
                    </div>
                </div>

                {/* Panel content */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Subnotes ({subnotes.length})
                            </h3>
                            <button
                                onClick={() => onVisibilityChange(false)}
                                className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Subnotes list */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {subnotes.map((subnote) => (
                            <div key={subnote.id} className="transform scale-75 origin-top">
                                <Card
                                    note={subnote}
                                    disableEntryAnimation={true}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};
