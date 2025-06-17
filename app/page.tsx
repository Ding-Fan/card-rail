'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../components/Card';
import { getAllMockNotes } from '../data/mockNotes';

export default function Home() {
  const notes = getAllMockNotes();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Touch/swipe state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  // Handle scroll to update current card index
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const cardHeight = container.clientHeight;
      const newIndex = Math.round(scrollTop / cardHeight);
      setCurrentCardIndex(Math.min(newIndex, notes.length - 1));
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [notes.length]);

  // Navigate to specific card
  const scrollToCard = (index: number) => {
    const container = containerRef.current;
    if (!container) return;
    
    const cardHeight = container.clientHeight;
    container.scrollTo({
      top: index * cardHeight,
      behavior: 'smooth'
    });
  };

  const handleCardTap = (noteId: string) => {
    console.log('Card tapped:', noteId);
    // TODO: Navigate to edit page
  };

  // Handle touch events for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setTouchEnd(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchEnd({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = touchStart.y - touchEnd.y;
    const minSwipeDistance = 50;
    
    // Check if this is a vertical swipe (more vertical than horizontal)
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > minSwipeDistance) {
      if (deltaY > 0) {
        // Swipe up - go to next card
        if (currentCardIndex < notes.length - 1) {
          scrollToCard(currentCardIndex + 1);
        }
      } else {
        // Swipe down - go to previous card
        if (currentCardIndex > 0) {
          scrollToCard(currentCardIndex - 1);
        }
      }
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Scroll Indicator */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-10">
        <div className="flex flex-col space-y-2">
          {notes.map((_, index) => (
            <button
              key={`scroll-indicator-${index}`}
              onClick={() => scrollToCard(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentCardIndex 
                  ? 'bg-blue-600 scale-125' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to note ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Content Container - Card View */}
      <div 
        ref={containerRef}
        className="h-screen overflow-y-auto snap-y snap-mandatory"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {notes.map((note) => (
          <div key={note.id} className="h-screen p-4 snap-start flex-shrink-0">
            <Card 
              note={note} 
              onTap={handleCardTap}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
