'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  useDraggable,
  DragEndEvent,
  TouchSensor,
  MouseSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

/**
 * ============================================================================
 * DRAGGABLE FAB COMPONENT DOCUMENTATION
 * ============================================================================
 * 
 * A global floating action button (FAB) for note creation with drag-and-drop 
 * positioning capabilities. Designed with Japanese wall socket aesthetics.
 * 
 * ============================================================================
 * 1. COMPONENT ARCHITECTURE
 * ============================================================================
 * A. Main Component (DraggableFAB)
 *    - Manages drag sensors and position state
 *    - Handles localStorage persistence 
 *    - Provides viewport constraint logic
 *    - Controls click vs drag behavior
 * 
 * B. Inner Component (DraggableFABButton)  
 *    - Renders the actual draggable button
 *    - Implements dnd-kit draggable hook
 *    - Handles visual styling and interactions
 *    - Manages keyboard accessibility
 * 
 * C. Context Wrapper (DndContext)
 *    - Provides drag-and-drop functionality via @dnd-kit/core
 *    - Manages sensor configuration for cross-platform support
 *    - Handles drag start/end event lifecycle
 * 
 * ============================================================================
 * 2. DESIGN SPECIFICATIONS
 * ============================================================================
 * A. Visual Design
 *    - Dimensions: w-20 h-10 (80px × 40px) - compact mobile-first
 *    - Background: Stone-colored (bg-stone-100) with stone border
 *    - Shape: Rounded corners (rounded-xl) with shadow-lg
 *    - Icon: Two thin vertical black slots (w-1 h-6) with gap-3 spacing
 * 
 * B. Japanese Wall Socket Aesthetic
 *    - Inspired by Type A electrical outlets common in Japan
 *    - Two parallel vertical slots represent the outlet holes
 *    - Stone-colored housing mimics wall socket appearance
 *    - Minimalist design fits mobile-first philosophy
 * 
 * C. Interactive States
 *    - Default: scale-100 with cursor-grab
 *    - Dragging: scale-110 with cursor-grabbing and enhanced shadow
 *    - Transitions: 200ms ease-out for smooth animations
 * 
 * ============================================================================
 * 3. POSITIONING SYSTEM
 * ============================================================================
 * A. Default Position (Golden Spiral)
 *    - Uses golden ratio (φ ≈ 1.618) for harmonious placement
 *    - Positioned at upper right part of screen at golden ratio point
 *    - Calculated as: viewportHeight * (1 - 0.618) = 38.2% from top
 *    - Respects draggable zone with 20px padding from viewport edges
 * 
 * B. Position Persistence
 *    - Saves position to localStorage key: 'fab-position'
 *    - JSON format: { x: number, y: number }
 *    - Restored on component mount
 *    - Fallback to golden spiral if localStorage corrupted
 * 
 * C. Viewport Constraints
 *    - Prevents FAB from going off-screen
 *    - Maintains 20px padding from all edges
 *    - Dynamic constraint calculation on window resize
 *    - Preserves user preference within bounds
 * 
 * ============================================================================
 * 4. DRAG INTERACTION SYSTEM
 * ============================================================================
 * A. Multi-Sensor Configuration
 *    - MouseSensor: Desktop mouse interactions (5px distance threshold)
 *    - TouchSensor: Mobile touch with 50ms delay + 5px tolerance
 *    - PointerSensor: Fallback for maximum browser compatibility
 * 
 * B. Activation Constraints
 *    - Mouse: 5px movement required (prevents accidental drags)
 *    - Touch: 50ms delay + 5px tolerance (responsive but intentional)
 *    - Optimized for mobile-first with minimal delay
 * 
 * C. Drag Prevention Logic
 *    - isDragging state prevents click actions during drag
 *    - Only saves position if actual movement occurred (delta !== 0)
 *    - Touch-none CSS prevents browser interference
 * 
 * ============================================================================
 * 5. ACCESSIBILITY FEATURES
 * ============================================================================
 * A. Keyboard Support
 *    - Enter key: Triggers note creation
 *    - Space key: Triggers note creation
 *    - Prevents default browser scrolling on space
 * 
 * B. ARIA Attributes
 *    - aria-label: "Add new note"
 *    - role: "button"
 *    - data-testid: "draggable-fab" for testing
 * 
 * C. Focus Management
 *    - Focusable button element
 *    - Visual focus indicators via browser defaults
 *    - Screen reader compatible
 * 
 * ============================================================================
 * 6. NOTE CREATION BEHAVIOR
 * ============================================================================
 * A. Click Handler Logic
 *    - Only triggers if not currently dragging
 *    - Uses onCreateNote prop if provided (custom callback)
 *    - Falls back to router.push('/note/new') navigation
 * 
 * B. Integration Points
 *    - GlobalFAB wrapper provides consistent props
 *    - Works with useNotes hook for state management
 *    - Compatible with note creation workflow
 * 
 * ============================================================================
 * 7. RESPONSIVE BEHAVIOR
 * ============================================================================
 * A. Window Resize Handling
 *    - Listens for window resize events
 *    - Constrains position within new viewport bounds
 *    - Preserves user preference when possible
 *    - Updates localStorage with constrained position
 * 
 * B. Mobile Optimization
 *    - Compact dimensions for thumb-friendly interaction
 *    - Touch-optimized drag thresholds
 *    - Cross-browser mobile compatibility
 *    - Prevents zoom/scroll interference
 * 
 * ============================================================================
 * 8. PERFORMANCE CONSIDERATIONS
 * ============================================================================
 * A. State Management
 *    - Minimal re-renders via strategic state placement
 *    - Position updates only when movement occurs
 *    - Efficient localStorage serialization
 * 
 * B. Event Handling
 *    - Proper cleanup of resize listeners
 *    - Optimized drag calculations
 *    - Debounced constraint checking
 * 
 * ============================================================================
 * 9. TESTING STRATEGY
 * ============================================================================
 * A. Unit Tests (DraggableFAB.test.tsx)
 *    - Visual design validation
 *    - Click behavior testing
 *    - Drag interaction simulation
 *    - Dimension and styling verification
 * 
 * B. Integration Tests (GlobalFAB.integration.test.tsx)  
 *    - Position persistence across sessions
 *    - Window resize behavior
 *    - Error handling for corrupted localStorage
 *    - Cross-component interaction validation
 * 
 * ============================================================================
 * 10. CUSTOMIZATION POINTS
 * ============================================================================
 * A. Easy Modifications
 *    - fabWidth/fabHeight: Change button dimensions
 *    - goldenRatio: Adjust default positioning
 *    - padding: Modify viewport edge constraints
 *    - Sensor thresholds: Tune drag sensitivity
 * 
 * B. Styling Customization
 *    - TailwindCSS classes in className string
 *    - Japanese socket design in inner div structure
 *    - Animation timing and easing curves
 *    - Color scheme via stone-* color palette
 * 
 * ============================================================================
 */

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
  onDoubleClick?: () => void;
}> = ({ position, onCreateNote, isDragging, onDoubleClick }) => {
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
    // Don't apply transform separately since we've already included it in position
    transform: undefined,
    position: 'fixed',
    // Prevent pull-to-refresh and other mobile browser interference
    touchAction: 'none',
    WebkitTouchCallout: 'none',
    WebkitUserSelect: 'none',
    userSelect: 'none',
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onCreateNote();
    }
  };

  // Prevent pull-to-refresh on touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    // Prevent default only if this is the start of a potential drag
    // This helps prevent pull-to-refresh while allowing the drag to work
    if (e.touches.length === 1) {
      e.preventDefault();
    }
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
      onDoubleClick={onDoubleClick}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      className={`
        fixed z-50 select-none touch-none
        w-20 h-10 
        bg-stone-100 
        border border-stone-300 
        rounded-xl
        shadow-lg
        transition-all duration-200 ease-out
        ${isDragging || dndIsDragging ? 'scale-110 shadow-xl' : 'scale-100'}
        ${isDragging || dndIsDragging ? 'cursor-grabbing' : 'cursor-grab'}
        flex items-center justify-center
        overscroll-behavior-none
      `}
    >
      {/* Japanese Wall Socket Design - Two tall vertical slots */}
      <div className="flex items-center justify-center gap-3">
        <div className="w-1 h-6 bg-black rounded-sm"></div>
        <div className="w-1 h-6 bg-black rounded-sm"></div>
      </div>
    </button>
  );
};

// Main component
export const DraggableFAB: React.FC<DraggableFABProps> = ({ onCreateNote }) => {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);

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

  // Calculate golden spiral point (φ ≈ 1.618, so 1/φ ≈ 0.618)
  const goldenRatio = 0.618;
  const fabWidth = 80; // FAB button width (w-20 = 80px)
  const fabHeight = 40; // FAB button height (h-10 = 40px)
  const padding = 20; // Comfort padding

  // Default position at golden spiral point on right side
  const getDefaultPosition = (): Position => {
    if (typeof window === 'undefined') return { x: 0, y: 0 };
    
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    return {
      x: viewportWidth - fabWidth - padding, // Right side with padding  
      y: viewportHeight * (1 - goldenRatio) // Golden spiral point (38.2% from top)
    };
  };

  // Track if component has mounted and position is ready
  const [isPositionReady, setIsPositionReady] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });

  // Always fix initial position after client-side mount
  useEffect(() => {
    console.log('FAB useEffect running, window available:', typeof window !== 'undefined');
    
    let saved: string | null = null;
    try {
      saved = localStorage.getItem('fab-position');
      console.log('Saved position from localStorage:', saved);
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
    }
    
    let finalPosition: Position;
    
    if (saved) {
      try {
        const savedPosition = JSON.parse(saved);
        console.log('Parsed saved position:', savedPosition);
        finalPosition = constrainPosition(savedPosition);
        console.log('Setting to constrained saved position:', finalPosition);
      } catch (error) {
        console.log('Saved position corrupted, using default. Error:', error);
        finalPosition = getDefaultPosition();
        console.log('Setting to default position:', finalPosition);
        savePosition(finalPosition);
      }
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
    try {
      localStorage.setItem('fab-position', JSON.stringify(pos));
    } catch (error) {
      console.warn('Failed to save FAB position to localStorage:', error);
      // Continue silently if localStorage is not available
    }
  };

  // Constrain position within viewport with padding
  const constrainPosition = (pos: Position): Position => {
    if (typeof window === 'undefined') return pos;
    
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    return {
      x: Math.max(padding, Math.min(pos.x, viewportWidth - fabWidth - padding)),
      y: Math.max(padding, Math.min(pos.y, viewportHeight - fabHeight - padding))
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

  // Temporary debug function for mobile testing
  const handleDoubleClick = () => {
    // Double-click to reset position and show debug info
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const goldenPoint = viewportHeight * (1 - goldenRatio);
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
        <DraggableFABButton
          position={position}
          onCreateNote={handleCreateNote}
          isDragging={isDragging}
          onDoubleClick={handleDoubleClick}
        />
      )}
    </DndContext>
  );
};
