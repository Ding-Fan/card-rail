'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card } from '../components/Card';
import { getAllMockNotes } from '../data/mockNotes';

export default function Home() {
  const notes = getAllMockNotes();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Touch/swipe state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  // Filter notes based on search query
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    
    return notes.filter(note => 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [notes, searchQuery]);

  // Handle scroll to update current card index
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const cardHeight = container.clientHeight;
      const newIndex = Math.round(scrollTop / cardHeight);
      setCurrentCardIndex(Math.min(newIndex, filteredNotes.length - 1));
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [filteredNotes.length]);

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
        if (currentCardIndex < filteredNotes.length - 1) {
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
      {/* Search Header */}
      <div className={`fixed top-0 left-0 right-0 z-10 bg-white shadow-sm border-b transition-all duration-300 ${
        isSearchFocused || searchQuery ? 'py-4' : 'py-2'
      }`}>
        <div className="max-w-md mx-auto px-4">

          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search notes..."
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Search Results Count */}
          {searchQuery && (
            <div className="mt-2 text-sm text-gray-600 text-center">
              {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''} found
            </div>
          )}
        </div>
      </div>      {/* Scroll Indicator */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-10">
        <div className="flex flex-col space-y-2">
          {filteredNotes.map((_, index) => (
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
        className={`h-screen overflow-y-auto snap-y snap-mandatory transition-all duration-300 ${
          isSearchFocused || searchQuery ? 'pt-28' : 'pt-24'
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {filteredNotes.length === 0 ? (
          <div className="h-screen flex items-center justify-center">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No notes found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search terms.</p>
            </div>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div key={note.id} className="h-screen p-4 snap-start flex-shrink-0">
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
