'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  useDraggable,
  DragEndEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface Position {
  x: number;
  y: number;
}

interface DraggableFABProps {
  onCreateNote?: () => void;
}

// Inner draggable component
const DraggableFABButton: React.FC<{
  position: Position;
  onCreateNote: () => void;
  isDragging: boolean;
}> = ({ position, onCreateNote, isDragging }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
  } = useDraggable({
    id: 'draggable-fab',
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    left: `${position.x}px`,
    top: `${position.y}px`,
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      data-testid="draggable-fab"
      aria-label="Add new note"
      role="button"
      onClick={onCreateNote}
      className={`
        fixed z-50 select-none
        w-14 h-14 
        bg-stone-100 
        border border-stone-300 
        rounded-xl
        shadow-lg
        transition-all duration-200 ease-out
        ${isDragging ? 'scale-110 shadow-xl' : 'scale-100'}
        ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
        flex items-center justify-center
      `}
    >
      {/* Japanese Wall Socket Design - Two black squares */}
      <div className="flex flex-col items-center justify-center gap-1">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-black rounded-sm"></div>
          <div className="w-2 h-2 bg-black rounded-sm"></div>
        </div>
      </div>
    </button>
  );
};

// Main component
export const DraggableFAB: React.FC<DraggableFABProps> = ({ onCreateNote }) => {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);

  // Calculate golden spiral point (φ ≈ 1.618, so 1/φ ≈ 0.618)
  const goldenRatio = 0.618;
  const fabSize = 56; // FAB button size
  const padding = 20; // Comfort padding

  // Default position at golden spiral point on right side
  const getDefaultPosition = (): Position => {
    if (typeof window === 'undefined') return { x: 0, y: 0 };
    
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    return {
      x: viewportWidth - fabSize - padding, // Right side with padding
      y: viewportHeight * (1 - goldenRatio) - fabSize / 2 // Golden spiral point
    };
  };

  // Load position from localStorage or use default
  const [position, setPosition] = useState<Position>(() => {
    if (typeof window === 'undefined') return { x: 0, y: 0 };
    
    const saved = localStorage.getItem('fab-position');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return getDefaultPosition();
      }
    }
    return getDefaultPosition();
  });

  // Save position to localStorage
  const savePosition = (pos: Position) => {
    localStorage.setItem('fab-position', JSON.stringify(pos));
  };

  // Constrain position within viewport with padding
  const constrainPosition = (pos: Position): Position => {
    if (typeof window === 'undefined') return pos;
    
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    return {
      x: Math.max(padding, Math.min(pos.x, viewportWidth - fabSize - padding)),
      y: Math.max(padding, Math.min(pos.y, viewportHeight - fabSize - padding))
    };
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

  // Handle drag start
  const handleDragStart = () => {
    setIsDragging(true);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false);
    
    if (event.delta.x !== 0 || event.delta.y !== 0) {
      // Position was changed, calculate new position and save
      const newPosition = constrainPosition({
        x: position.x + event.delta.x,
        y: position.y + event.delta.y
      });
      
      setPosition(newPosition);
      savePosition(newPosition);
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
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <DraggableFABButton
        position={position}
        onCreateNote={handleCreateNote}
        isDragging={isDragging}
      />
    </DndContext>
  );
};
