/**
 * ============================================================================
 * CARD DETECTION HOOK
 * ============================================================================
 * 
 * Hook for detecting which card the FAB is hovering over and applying visual effects
 */

import { useState, useEffect } from 'react';
import { Position, CardInfo } from './types';

/**
 * Hook for detecting which card the FAB is over and applying lift effects
 */
export const useCardDetection = (fabPosition: Position, isMenuOpen: boolean) => {
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
