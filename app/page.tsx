'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../components/Card';
import { useNotes } from '../lib/useNotes';

export default function Home() {
  const { notes, isLoading, refreshNotes } = useNotes();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Touch/swipe state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  // Refresh notes when component mounts or becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, refresh notes
        refreshNotes();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshNotes]);

  // Handle scroll to update current card index
  useEffect(() => {
    // Removed scroll indicator functionality
  }, []);

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
      // Simple scroll behavior without specific card navigation
      const container = containerRef.current;
      if (container) {
        if (deltaY > 0) {
          // Swipe up - scroll down
          container.scrollBy({ top: window.innerHeight * 0.5, behavior: 'smooth' });
        } else {
          // Swipe down - scroll up  
          container.scrollBy({ top: -window.innerHeight * 0.5, behavior: 'smooth' });
        }
      }
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Content Container - Card Stream */}
      <div 
        ref={containerRef}
        className="min-h-screen overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {isLoading ? (
          // Loading state
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-gray-500">Loading notes...</div>
          </div>
        ) : notes.length === 0 ? (
          // Empty state
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-gray-500">No notes yet. Create your first note!</div>
          </div>
        ) : (
          // Notes list
          notes.map((note) => (
            <div key={note.id} className="p-4 flex-shrink-0">
              <Card 
                note={note} 
                onTap={handleCardTap}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
