import React from 'react';
import { Note } from './types';

// Golden spiral height ratios (φ = 1.618...)
export const CARD_HEIGHT_RATIOS = {
  small: 0.236,   // φ³ ≈ 0.236
  medium: 0.382,  // φ² ≈ 0.382  
  large: 0.618,   // φ ≈ 0.618
  full: 1.0       // Full viewport (reserved)
} as const;

export type CardHeight = keyof typeof CARD_HEIGHT_RATIOS;

// Convert ratio to CSS viewport height
export const getCardHeightClass = (height: CardHeight): string => {
  const ratio = CARD_HEIGHT_RATIOS[height];
  return `h-[${Math.round(ratio * 100)}vh]`;
};

// Measure rendered content height and determine appropriate card height
export const measureCardHeight = (note: Note): CardHeight => {
  // Create off-screen container to measure content
  const measurementContainer = document.createElement('div');
  measurementContainer.style.position = 'absolute';
  measurementContainer.style.top = '-9999px';
  measurementContainer.style.left = '-9999px';
  measurementContainer.style.width = 'calc(100vw - 2rem)'; // Account for padding
  measurementContainer.style.maxWidth = '400px'; // Typical mobile width
  measurementContainer.style.padding = '1.5rem'; // Match card padding
  measurementContainer.style.visibility = 'hidden';
  measurementContainer.className = 'prose prose-gray prose-sm max-w-none';
  
  // Add basic markdown rendering (simplified for measurement)
  const processedContent = note.content
    .replace(/^# /gm, '<h1 class="text-xl font-bold mb-3">')
    .replace(/^## /gm, '<h2 class="text-lg font-semibold mb-2">')
    .replace(/^### /gm, '<h3 class="text-base font-medium mb-2">')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(/^- /gm, '<li>')
    .replace(/\n\n/g, '</p><p class="mb-3">')
    .replace(/^/, '<p class="mb-3">')
    .replace(/$/, '</p>');
    
  measurementContainer.innerHTML = processedContent;
  document.body.appendChild(measurementContainer);
  
  const contentHeight = measurementContainer.scrollHeight;
  document.body.removeChild(measurementContainer);
  
  // Get viewport height for ratio calculations
  const viewportHeight = window.innerHeight;
  
  // Calculate thresholds based on golden spiral ratios
  const smallThreshold = viewportHeight * CARD_HEIGHT_RATIOS.small;
  const mediumThreshold = viewportHeight * CARD_HEIGHT_RATIOS.medium;
  const largeThreshold = viewportHeight * CARD_HEIGHT_RATIOS.large;
  
  // Determine appropriate height based on content
  if (contentHeight <= smallThreshold) {
    return 'small';
  } else if (contentHeight <= mediumThreshold) {
    return 'medium';
  } else if (contentHeight <= largeThreshold) {
    return 'large';
  } else {
    // Content exceeds large, use large with fade mask
    return 'large';
  }
};

// Hook for measuring card height (client-side only)
export const useCardHeight = (note: Note): CardHeight => {
  const [height, setHeight] = React.useState<CardHeight>('medium');
  
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const measuredHeight = measureCardHeight(note);
    setHeight(measuredHeight);
  }, [note]);
  
  return height;
};
