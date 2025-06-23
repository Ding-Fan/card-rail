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
 * Calculate the default position at top-right corner
 */
export const getDefaultPosition = (): Position => {
  if (typeof window === 'undefined') return { x: 0, y: 0 };
  
  const viewportWidth = window.innerWidth;
  
  return {
    x: viewportWidth - FAB_WIDTH - PADDING, // Right side with padding  
    y: PADDING // Top with padding
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
  const menuHeight = 100; // More accurate height for 2 items
  const gap = 8; // Smaller gap to prevent overlap
  
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  };
  
  const fabCenter = {
    x: fabPosition.x + fabSize.width / 2,
    y: fabPosition.y + fabSize.height / 2
  };
  
  // Try positions in order of preference: bottom, left, right, top
  const positions = [
    // Bottom (preferred for top-right FAB) - ensure it's below the FAB
    {
      x: Math.max(10, Math.min(fabCenter.x - menuWidth / 2, viewport.width - menuWidth - 10)),
      y: fabPosition.y + fabSize.height + gap,
      side: 'bottom' as const
    },
    // Left side (good for top-right FAB)
    {
      x: fabPosition.x - menuWidth - gap,
      y: Math.max(10, Math.min(fabPosition.y, viewport.height - menuHeight - 10)),
      side: 'left' as const
    },
    // Right side (fallback)
    {
      x: fabPosition.x + fabSize.width + gap,
      y: Math.max(10, Math.min(fabCenter.y - menuHeight / 2, viewport.height - menuHeight - 10)),
      side: 'right' as const
    },
    // Top (last resort)
    {
      x: Math.max(10, Math.min(fabCenter.x - menuWidth / 2, viewport.width - menuWidth - 10)),
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
  
  // Fallback: position to the left of FAB, constrained to viewport
  return {
    x: Math.max(10, Math.min(fabPosition.x - menuWidth - gap, viewport.width - menuWidth - 10)),
    y: Math.max(10, Math.min(fabPosition.y, viewport.height - menuHeight - 10)),
    side: 'left'
  };
};
