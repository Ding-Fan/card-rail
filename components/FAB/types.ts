/**
 * ============================================================================
 * FAB TYPES & INTERFACES
 * ============================================================================
 * 
 * Shared type definitions for the FAB component system
 */

export interface Position {
  x: number;
  y: number;
}

export interface DraggableFABProps {
  onCreateNote?: () => void;
}

export interface CardInfo {
  id: string;
  element: HTMLElement;
  rect: DOMRect;
}

export interface MenuPosition {
  x: number;
  y: number;
  side: 'top' | 'bottom' | 'left' | 'right';
}

export interface FABButtonProps {
  position: Position;
  onCreateNote: () => void;
  onViewArchive: () => void;
  isDragging: boolean;
  onDoubleClick?: () => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
}

export interface FloatingMenuProps {
  isOpen: boolean;
  position: MenuPosition;
  onAddNote: () => void;
  onViewArchive: () => void;
}
