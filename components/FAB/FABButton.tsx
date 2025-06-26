/**
 * ============================================================================
 * FAB BUTTON COMPONENT
 * ============================================================================
 * 
 * The actual draggable FAB button with Japanese socket design and blinking animation
 */

import React, { useState, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { FABButtonProps } from './types';
import { calculateMenuPosition } from './positionUtils';
import { FloatingMenu } from './FloatingMenu';
import { useFAB } from './FABContext';

export const FABButton: React.FC<FABButtonProps> = ({
    position,
    onCreateNote,
    onViewArchive,
    onFlipAllToFront,
    isDragging,
    onDoubleClick,
    isMenuOpen,
    setIsMenuOpen
}) => {
    const { onCreateSubnote, isInNoteView } = useFAB();
    const [isBlinking, setIsBlinking] = useState(false);

    // Cute random blinking animation
    useEffect(() => {
        const scheduleNextBlink = () => {
            // Random interval between 2-5 seconds
            const interval = 2000 + Math.random() * 3000;

            setTimeout(() => {
                setIsBlinking(true);

                // Blink duration: 150ms
                setTimeout(() => {
                    setIsBlinking(false);
                    scheduleNextBlink(); // Schedule next blink
                }, 150);
            }, interval);
        };

        scheduleNextBlink();
    }, []);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging: dndIsDragging,
    } = useDraggable({
        id: 'draggable-fab',
    });

    // Calculate the actual position including any active transform
    const actualPosition = {
        x: position.x + (transform?.x || 0),
        y: position.y + (transform?.y || 0),
    };

    // Use direct positioning instead of combining position + transform
    const style: React.CSSProperties = {
        left: actualPosition.x,
        top: actualPosition.y,
        transform: undefined,
        position: 'fixed',
        touchAction: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            // Toggle menu if we're not dragging
            if (!isDragging && !dndIsDragging) {
                setIsMenuOpen(!isMenuOpen);
            }
        }
    };

    const handleTouchStart = () => {
        // Don't prevent default to avoid passive event listener issues
        // The touch event will be handled by the drag system
    };

    // Calculate menu position
    const menuPosition = calculateMenuPosition(actualPosition, { width: 80, height: 40 });

    // Handle menu actions
    const handleAddNote = () => {
        setIsMenuOpen(false);
        onCreateNote();
    };

    const handleViewArchive = () => {
        setIsMenuOpen(false);
        onViewArchive();
    };

    const handleFlipAllToFront = () => {
        setIsMenuOpen(false);
        if (onFlipAllToFront) {
            onFlipAllToFront();
        }
    };

    // Tap handler that toggles menu (iOS-style)
    const handleTap = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Only toggle menu if we're not dragging
        if (!isDragging && !dndIsDragging) {
            setIsMenuOpen(!isMenuOpen);
        }
    };

    return (
        <button
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            data-testid="draggable-fab"
            aria-label="Floating action menu"
            aria-expanded={isMenuOpen}
            role="button"
            onClick={handleTap}
            onDoubleClick={onDoubleClick}
            onKeyDown={handleKeyDown}
            onTouchStart={handleTouchStart}
            className={`
          fixed z-50 select-none touch-none
          w-20 h-10 
          bg-stone-100/80 backdrop-blur-sm
          border border-stone-300/60 
          rounded-xl
          shadow-lg
          transition-all duration-200 ease-out
          ${isDragging || dndIsDragging ? 'scale-110 shadow-xl' : 'scale-100'}
          ${isDragging || dndIsDragging ? 'cursor-grabbing' : 'cursor-grab'}
          ${isMenuOpen ? 'ring-2 ring-blue-500/30' : ''}
          flex items-center justify-center
          overscroll-behavior-none
        `}
        >
            {/* Japanese Wall Socket Design - Two tall vertical slots with blinking */}
            <div className="flex items-center justify-center gap-4">
                <div
                    className={`w-1 bg-black rounded-sm transition-all duration-150 ease-out ${isBlinking ? 'h-3' : 'h-6'
                        }`}
                ></div>
                <div
                    className={`w-1 bg-black rounded-sm transition-all duration-150 ease-out ${isBlinking ? 'h-3' : 'h-6'
                        }`}
                ></div>
            </div>

            <FloatingMenu
                isOpen={isMenuOpen}
                position={menuPosition}
                onAddNote={handleAddNote}
                onAddSubnote={onCreateSubnote}
                onViewArchive={handleViewArchive}
                onFlipAllToFront={handleFlipAllToFront}
                isInNoteView={isInNoteView}
            />
        </button>
    );
};
