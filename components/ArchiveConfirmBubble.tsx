/**
 * ============================================================================
 * ARCHIVE CONFIRMATION BUBBLE
 * ============================================================================
 * 
 * A confirmation bubble that appears from a specific position to confirm archive actions
 */

import React, { useEffect } from 'react';
import * as Portal from '@radix-ui/react-portal';

interface ArchiveConfirmBubbleProps {
    isOpen: boolean;
    position: { x: number; y: number };
    noteTitle: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ArchiveConfirmBubble: React.FC<ArchiveConfirmBubbleProps> = ({
    isOpen,
    position,
    noteTitle,
    onConfirm,
    onCancel
}) => {
    // Auto-close after 10 seconds if no action
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onCancel();
            }, 10000);

            return () => clearTimeout(timer);
        }
    }, [isOpen, onCancel]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onCancel();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onCancel]);

    if (!isOpen) {
        console.log('ArchiveConfirmBubble: isOpen is false, returning null');
        return null;
    }

    console.log('ArchiveConfirmBubble: Rendering bubble at position:', position);

    // Get first sentence or title for display
    const displayText = noteTitle.length > 40
        ? noteTitle.substring(0, 40) + '...'
        : noteTitle;

    return (
        <Portal.Root>
            <div
                className="fixed pointer-events-none z-[60]"
                style={{
                    left: position.x,
                    top: position.y,
                }}
            >
                <div className="pointer-events-auto bg-gray-900/95 backdrop-blur-md text-white rounded-xl shadow-xl border border-gray-700/50 p-4 max-w-[300px] animate-in fade-in-0 zoom-in-95 duration-200">
                    {/* Message */}
                    <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Archive Note?</p>
                        <p className="text-xs text-gray-300">
                            Be sure to archive &ldquo;<span className="font-medium">{displayText}</span>&rdquo;?
                        </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-3 py-2 text-xs font-medium text-gray-300 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-3 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        >
                            Archive
                        </button>
                    </div>

                    {/* Arrow pointing to source */}
                    <div className="absolute -bottom-2 left-6 w-4 h-4 bg-gray-900/95 border-r border-b border-gray-700/50 transform rotate-45"></div>
                </div>
            </div>
        </Portal.Root>
    );
};
