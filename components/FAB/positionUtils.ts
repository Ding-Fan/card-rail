/**
 * ============================================================================
 * FAB POSITION UTILITIES
 * ============================================================================
 * 
 * Utilities for positioning the FAB and its menu intelligently
 */

import { Position, MenuPosition } from './types';

// Golden ratio for harmonious positioning
export const GOLDEN_RATIO = 0.618;

// FAB dimensions and constraints
export const FAB_WIDTH = 80; // w-20 = 80px
export const FAB_HEIGHT = 40; // h-10 = 40px
export const PADDING = 20; // Comfort padding from viewport edges

/**
 * Calculate the default golden spiral position on the right side
 */
export const getDefaultPosition = (): Position => {
  if (typeof window === 'undefined') return { x: 0, y: 0 };
  
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  
  return {
    x: viewportWidth - FAB_WIDTH - PADDING, // Right side with padding  
    y: viewportHeight * (1 - GOLDEN_RATIO) // Golden spiral point (38.2% from top)
  };
};

/**
 * Constrain position within viewport bounds with padding
 */
export const constrainPosition = (pos: Position): Position => {
  if (typeof window === 'undefined') return pos;
  
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  
  return {
    x: Math.max(PADDING, Math.min(pos.x, viewportWidth - FAB_WIDTH - PADDING)),
    y: Math.max(PADDING, Math.min(pos.y, viewportHeight - FAB_HEIGHT - PADDING))
  };
};

/**
 * Calculate optimal menu position relative to FAB, considering screen edges
 */
export const calculateMenuPosition = (
  fabPosition: Position, 
  fabSize: { width: number; height: number }
): MenuPosition => {
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
