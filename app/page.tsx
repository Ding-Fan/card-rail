'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import { Settings, Archive } from 'lucide-react';
import { Card } from '../components/Card';
import {
  topLevelNotesAtom,
  notesLoadingAtom,
  initializeNotesAtom,
  getChildNotesAtom,
  syncSettingsAtom,
  syncStatusAtom
} from '../lib/atoms';

export default function Home() {
  const router = useRouter();

  // Jotai state management
  const topLevelNotes = useAtomValue(topLevelNotesAtom);
  const isLoading = useAtomValue(notesLoadingAtom);
  const initializeNotes = useSetAtom(initializeNotesAtom);
  const getChildNotes = useAtomValue(getChildNotesAtom);
  const syncSettings = useAtomValue(syncSettingsAtom);
  const syncStatus = useAtomValue(syncStatusAtom);

  const containerRef = useRef<HTMLDivElement>(null);

  // Debug logging
  console.log('Home component render:', {
    isLoading,
    topLevelNotesCount: topLevelNotes.length,
    topLevelNotes: topLevelNotes.map((n) => ({ id: n.id, title: n.title }))
  });

  // Touch/swipe state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  // Initialize notes when component mounts
  useEffect(() => {
    console.log('🚀 Component mounted, calling initializeNotes...');
    initializeNotes().catch(console.error);
  }, [initializeNotes]);

  // Refresh notes when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, refresh notes
        initializeNotes();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [initializeNotes]);

  // Handle scroll to update current card index
  useEffect(() => {
    // Removed scroll indicator functionality
  }, []);

  // Removed handleCardTap - card clicks should do nothing

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
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">Card Rail</h1>
            {syncSettings.enabled && (
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${syncStatus === 'syncing' ? 'bg-blue-500 animate-pulse' :
                    syncStatus === 'error' ? 'bg-red-500' : 'bg-green-500'
                  }`} />
                <span className="text-xs text-gray-500">
                  {syncStatus === 'syncing' ? 'Syncing' :
                    syncStatus === 'error' ? 'Error' : 'Synced'}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/archive')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Archive"
            >
              <Archive className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => router.push('/settings')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

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
        ) : topLevelNotes.length === 0 ? (
          // Empty state
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-gray-500">No notes yet. Create your first note!</div>
          </div>
        ) : (
          // Notes list
          <div>
            {topLevelNotes.map((note) => (
              <div key={note.id} className="p-4 flex-shrink-0">
                <Card
                  note={note}
                  childCount={getChildNotes(note.id).length}
                  showNestedIcon={true}
                  onArchived={() => { }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
