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
import * as Portal from '@radix-ui/react-portal';
import { storage } from '../lib/storage';

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

interface CardInfo {
  id: string;
  element: HTMLElement;
  rect: DOMRect;
}

interface MenuPosition {
  x: number;
  y: number;
  side: 'top' | 'bottom' | 'left' | 'right';
}

// Calculate optimal menu position relative to FAB, considering screen edges
const calculateMenuPosition = (fabPosition: Position, fabSize: { width: number; height: number }): MenuPosition => {
  const menuWidth = 160;
  const menuHeight = 120; // Approximate height for 3 items
  const gap = 12; // Gap between FAB and menu
  
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  };
  
  const fabCenter = {
    x: fabPosition.x + fabSize.width / 2,
    y: fabPosition.y + fabSize.height / 2
  };
  
  // Try positions in order of preference: right, left, bottom, top
  const positions = [
    // Right side
    {
      x: fabPosition.x + fabSize.width + gap,
      y: fabCenter.y - menuHeight / 2,
      side: 'right' as const
    },
    // Left side
    {
      x: fabPosition.x - menuWidth - gap,
      y: fabCenter.y - menuHeight / 2,
      side: 'left' as const
    },
    // Bottom
    {
      x: fabCenter.x - menuWidth / 2,
      y: fabPosition.y + fabSize.height + gap,
      side: 'bottom' as const
    },
    // Top
    {
      x: fabCenter.x - menuWidth / 2,
      y: fabPosition.y - menuHeight - gap,
      side: 'top' as const
    }
  ];
  
  // Find first position that fits in viewport
  for (const pos of positions) {
    if (
      pos.x >= 10 && 
      pos.x + menuWidth <= viewport.width - 10 &&
      pos.y >= 10 && 
      pos.y + menuHeight <= viewport.height - 10
    ) {
      return pos;
    }
  }
  
  // Fallback: right side, constrained to viewport
  return {
    x: Math.max(10, Math.min(fabPosition.x + fabSize.width + gap, viewport.width - menuWidth - 10)),
    y: Math.max(10, Math.min(fabCenter.y - menuHeight / 2, viewport.height - menuHeight - 10)),
    side: 'right'
  };
};

// Hook for detecting which card the FAB is over
const useCardDetection = (fabPosition: Position, isMenuOpen: boolean) => {
  const [hoveredCard, setHoveredCard] = useState<CardInfo | null>(null);

  useEffect(() => {
    if (isMenuOpen) return; // Don't update during menu interaction

    const detectCard = () => {
      // Find all card elements
      const cardElements = document.querySelectorAll('[data-testid="note-card"]') as NodeListOf<HTMLElement>;
      
      // FAB center point (accounting for FAB size)
      const fabCenterX = fabPosition.x + 40; // Half of FAB width (80px)
      const fabCenterY = fabPosition.y + 20; // Half of FAB height (40px)

      let foundCard: CardInfo | null = null;

      cardElements.forEach((card) => {
        const rect = card.getBoundingClientRect();
        
        // Check if FAB center is within card bounds
        if (
          fabCenterX >= rect.left &&
          fabCenterX <= rect.right &&
          fabCenterY >= rect.top &&
          fabCenterY <= rect.bottom
        ) {
          // Try to get note ID from various possible attributes
          const noteId = card.getAttribute('data-note-id') || 
                        card.closest('[data-note-id]')?.getAttribute('data-note-id') ||
                        'unknown';
          
          foundCard = {
            id: noteId,
            element: card,
            rect
          };
        }
      });

      setHoveredCard(foundCard);
    };

    // Detect immediately
    detectCard();

    // Also detect on scroll in case cards move
    const handleScroll = () => detectCard();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [fabPosition.x, fabPosition.y, isMenuOpen]);

  // Apply card lift effect
  useEffect(() => {
    if (hoveredCard) {
      hoveredCard.element.style.boxShadow = '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)';
      hoveredCard.element.style.transform = 'translateY(-2px)';
      hoveredCard.element.style.transition = 'all 0.2s ease-out';
    }

    return () => {
      if (hoveredCard) {
        hoveredCard.element.style.boxShadow = '';
        hoveredCard.element.style.transform = '';
        hoveredCard.element.style.transition = '';
      }
    };
  }, [hoveredCard]);

  return hoveredCard;
};

// iOS-style floating menu component
const FloatingMenu: React.FC<{
  isOpen: boolean;
  position: MenuPosition;
  hoveredCard: CardInfo | null;
  onAddNote: () => void;
  onViewNote: () => void;
  onArchiveCard: () => void;
}> = ({ isOpen, position, hoveredCard, onAddNote, onViewNote, onArchiveCard }) => {
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
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 p-2 min-w-[160px] animate-in fade-in-0 zoom-in-95 duration-200">
          {/* Add Note - Always available */}
          <button
            onClick={onAddNote}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-900 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Note
          </button>

          {/* Card-specific actions - Only when hovering over a card */}
          {hoveredCard && hoveredCard.id !== 'unknown' && (
            <>
              <button
                onClick={onViewNote}
                className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-900 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Note
              </button>

              <button
                onClick={onArchiveCard}
                className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Archive Card
              </button>
            </>
          )}
        </div>
      </div>
    </Portal.Root>
  );
};

// Inner draggable component
const DraggableFABButton: React.FC<{
  position: Position;
  onCreateNote: () => void;
  isDragging: boolean;
  onDoubleClick?: () => void;
  hoveredCard: CardInfo | null;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
}> = ({ position, onCreateNote, isDragging, onDoubleClick, hoveredCard, isMenuOpen, setIsMenuOpen }) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const router = useRouter();

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

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      e.preventDefault();
    }
  };

  // Calculate menu position
  const menuPosition = calculateMenuPosition(actualPosition, { width: 80, height: 40 });

  // Handle menu actions
  const handleAddNote = () => {
    setIsMenuOpen(false);
    onCreateNote();
  };

  const handleViewNote = () => {
    setIsMenuOpen(false);
    if (hoveredCard && hoveredCard.id !== 'unknown') {
      router.push(`/note/${hoveredCard.id}`);
    }
  };

  const handleArchiveCard = () => {
    setIsMenuOpen(false);
    // TODO: Implement archive functionality
    console.log('Archive card:', hoveredCard?.id);
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
    <>
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
            className={`w-1 bg-black rounded-sm transition-all duration-150 ease-out ${
              isBlinking ? 'h-3' : 'h-6'
            }`}
          ></div>
          <div 
            className={`w-1 bg-black rounded-sm transition-all duration-150 ease-out ${
              isBlinking ? 'h-3' : 'h-6'
            }`}
          ></div>
        </div>
      </button>

      {/* Floating Menu - Non-blocking, iOS-style */}
      <FloatingMenu
        isOpen={isMenuOpen}
        position={menuPosition}
        hoveredCard={hoveredCard}
        onAddNote={handleAddNote}
        onViewNote={handleViewNote}
                onArchiveCard={handleArchiveCard}
      />
    </>
  );
};

// Main component
export const DraggableFAB: React.FC<DraggableFABProps> = ({ onCreateNote }) => {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  // Use card detection hook
  const hoveredCard = useCardDetection(position, isMenuOpen);

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
        <DraggableFABButton
          position={position}
          onCreateNote={handleCreateNote}
          isDragging={isDragging}
          onDoubleClick={handleDoubleClick}
          hoveredCard={hoveredCard}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
        />
      )}
    </DndContext>
  );
};
