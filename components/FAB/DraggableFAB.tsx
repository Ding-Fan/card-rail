'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSetAtom } from 'jotai';
import {
  DndContext,
  DragEndEvent,
  TouchSensor,
  MouseSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { storage } from '../../lib/storage';
import { flipAllCardsToFrontAtom } from '../../lib/atoms';

// Import modular components
import { DraggableFABProps, Position } from './types';
import {
  getDefaultPosition,
  constrainPosition,
  GOLDEN_RATIO
} from './positionUtils';
import { FABButton } from './FABButton';

/**
 * Main DraggableFAB component - orchestrates drag behavior and position management
 */
export const DraggableFAB: React.FC<DraggableFABProps> = ({ onCreateNote }) => {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Jotai actions
  const flipAllCardsToFront = useSetAtom(flipAllCardsToFrontAtom);

  // Configure drag sensors for better touch and mouse support
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5, // Require 5px movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 50, // Very short delay for responsive dragging
        tolerance: 5, // Allow 5px of movement during delay
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Fallback for better browser compatibility
      },
    })
  );

  // Track if component has mounted and position is ready
  const [isPositionReady, setIsPositionReady] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });

  // Card detection is no longer needed as actions are moved to the card itself
  // const hoveredCard = useCardDetection(position, isMenuOpen);

  // Always fix initial position after client-side mount
  useEffect(() => {
    console.log('FAB useEffect running, window available:', typeof window !== 'undefined');

    const savedPosition = storage.getFabPosition();
    console.log('Saved position from storage:', savedPosition);

    let finalPosition: Position;

    if (savedPosition) {
      console.log('Using saved position:', savedPosition);
      finalPosition = constrainPosition(savedPosition);
      console.log('Setting to constrained saved position:', finalPosition);
    } else {
      console.log('No saved position, calculating default');
      finalPosition = getDefaultPosition();
      console.log('Setting to default position:', finalPosition);
      savePosition(finalPosition);
    }

    // Set position and mark as ready in the same batch
    setPosition(finalPosition);
    setIsPositionReady(true);
  }, []); // Run only once after mount

  // Save position to localStorage
  const savePosition = (pos: Position) => {
    storage.setFabPosition(pos);
  };

  // Handle create note action
  const handleCreateNote = () => {
    // Only create note if we're not dragging
    if (!isDragging) {
      if (onCreateNote) {
        onCreateNote();
      } else {
        router.push('/note/new');
      }
    }
  };

  const handleViewArchive = () => {
    router.push('/archive');
  };

  const handleFlipAllToFront = () => {
    flipAllCardsToFront();
  };

  // Temporary debug function for mobile testing
  const handleDoubleClick = () => {
    // Double-click to reset position and show debug info
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const goldenPoint = viewportHeight * (1 - GOLDEN_RATIO);
    const defaultPos = getDefaultPosition();

    // Show current position and expected position
    const currentInfo = `CURRENT FAB:\nx=${position.x}, y=${position.y}`;
    const expectedInfo = `EXPECTED FAB:\nx=${defaultPos.x}, y=${defaultPos.y.toFixed(1)}`;
    const viewportInfo = `VIEWPORT: ${viewportWidth}x${viewportHeight}\nGolden point: ${goldenPoint.toFixed(1)}px from top`;

    // Reset to golden ratio position
    setPosition(defaultPos);
    savePosition(defaultPos);

    alert(`FAB Debug Info!\n\n${currentInfo}\n\n${expectedInfo}\n\n${viewportInfo}\n\n✅ FAB has been reset to golden ratio position!`);
  };

  // Handle drag start
  const handleDragStart = () => {
    setIsDragging(true);
    // Close menu when drag starts to prevent interference
    setIsMenuOpen(false);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false);

    // Only update position if there was actual movement
    if (event.delta.x !== 0 || event.delta.y !== 0) {
      // Calculate the final position by adding the drag delta to the starting position
      const finalPosition = {
        x: position.x + event.delta.x,
        y: position.y + event.delta.y
      };

      // Constrain within viewport and save
      const constrainedPosition = constrainPosition(finalPosition);
      setPosition(constrainedPosition);
      savePosition(constrainedPosition);
    }
  };

  // Adjust position on window resize (constrain to viewport instead of resetting)
  useEffect(() => {
    const handleResize = () => {
      const constrainedPos = constrainPosition(position);

      // If current position is out of bounds, constrain it to viewport
      // instead of resetting to default - preserves user's preferred area
      if (constrainedPos.x !== position.x || constrainedPos.y !== position.y) {
        setPosition(constrainedPos);
        savePosition(constrainedPos);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position]);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Only render FAB when position is ready to prevent flash */}
      {isPositionReady && (
        <FABButton
          position={position}
          onCreateNote={handleCreateNote}
          onViewArchive={handleViewArchive}
          onFlipAllToFront={handleFlipAllToFront}
          isDragging={isDragging}
          onDoubleClick={handleDoubleClick}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
        />
      )}
    </DndContext>
  );
};
