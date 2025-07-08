'use client';

import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from 'next/navigation';
import { useAtomValue, useSetAtom } from 'jotai';
import { animate } from 'animejs';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Note } from '../../lib/types';
import { archiveNoteAtom, deleteNoteAtom, removingCardsAtom, flippedCardsAtom, flipCardAtom } from '../../lib/atoms';
import { CardDrawer } from './CardDrawer';
import { CardBackPanel } from './CardBackPanel';

// Extend dayjs with relativeTime plugin
dayjs.extend(relativeTime);

interface CardProps {
  note: Note;
  childCount?: number; // Number of child notes
  disableEntryAnimation?: boolean; // Disable the default entry animation
  onArchived?: () => void; // Callback when note is archived
  isArchiveMode?: boolean; // Whether the card is displayed in archive mode
  onDelete?: (noteId: string) => void; // Callback when note is deleted permanently
  showNestedIcon?: boolean; // Whether to show the nested notes button
}

export const Card: React.FC<CardProps> = ({ note, childCount = 0, disableEntryAnimation = false, onArchived, isArchiveMode = false, onDelete, showNestedIcon = false }) => {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isAnimated, setIsAnimated] = React.useState(disableEntryAnimation);

  // Utility function to format the last edit time using Day.js
  const formatLastEditTime = (updatedAt: string) => {
    const lastEdit = dayjs(updatedAt);
    const now = dayjs();
    const diffMinutes = now.diff(lastEdit, 'minute');
    const diffDays = now.diff(lastEdit, 'day');

    // Use Day.js fromNow() for readable relative time
    if (diffMinutes < 1) {
      return 'now';
    } else if (diffDays < 7) {
      return lastEdit.fromNow();
    } else {
      return lastEdit.format('YYYY-MM-DD');
    }
  };

  // Jotai state management
  const removingCards = useAtomValue(removingCardsAtom);
  const flippedCards = useAtomValue(flippedCardsAtom);
  const flipCard = useSetAtom(flipCardAtom);
  const archiveNote = useSetAtom(archiveNoteAtom);
  const deleteNote = useSetAtom(deleteNoteAtom);

  // Check if this card is being removed for fade animation
  const isBeingRemoved = removingCards.has(note.id);

  // Check if this card is flipped
  const isFlipped = flippedCards.has(note.id);

  // Flip gesture state
  const [isGesturing, setIsGesturing] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);

  // Unified drawer state management
  type DrawerState = 'closed' | 'menu' | 'archive-confirm' | 'delete-confirm';
  const [drawerState, setDrawerState] = useState<DrawerState>('closed');

  // Calculate viewport height class based on measured content
  const heightClass = React.useMemo(() => {
    // Use fixed height instead of dynamic class to avoid CSS generation issues
    return `min-h-[400px] max-h-[80vh]`; // Fixed height for testing
  }, []);

  // Entry animation on mount using CSS transitions
  useEffect(() => {
    if (disableEntryAnimation) {
      setIsAnimated(true);
      return;
    }

    // Trigger animation after a small delay
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, Math.random() * 200); // Stagger animation for multiple cards

    return () => clearTimeout(timer);
  }, [disableEntryAnimation]);

  // Remove click outside functionality - menu should only be controlled by button
  useEffect(() => {
    // Menu should only be controlled by the 3-dot button, not by clicking outside
    return () => {
      // No cleanup needed
    };
  }, [drawerState]);

  // Debug logging for menu state
  useEffect(() => {
    // Menu state logging removed - functionality working as expected
  }, [drawerState]);

  // Apply flip transform to card
  useEffect(() => {
    if (!frontRef.current || !backRef.current) return;

    const rotationY = isFlipped ? 180 : 0;
    const duration = isGesturing ? 0 : 300;

    animate(frontRef.current, {
      rotateY: rotationY,
      duration,
      ease: 'outQuart',
    });

    animate(backRef.current, {
      rotateY: rotationY + 180,
      duration,
      ease: 'outQuart',
    });
  }, [isFlipped, isGesturing]);

  // Touch gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    // Don't interfere with menu interactions
    if (drawerState !== 'closed') return;

    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || drawerState !== 'closed') return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;

    // Check if this is a horizontal swipe (not vertical scroll)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      e.preventDefault(); // Prevent scrolling when swiping horizontally

      setIsGesturing(true);

      // Calculate flip progress (0 to 1)
      const cardWidth = cardRef.current?.offsetWidth || 300;
      const progress = Math.abs(deltaX) / (cardWidth * 0.5); // 50% of card width for full flip
      const clampedProgress = Math.min(Math.max(progress, 0), 1);

      // Apply real-time rotation
      if (frontRef.current && backRef.current) {
        const currentRotation = isFlipped ? 180 : 0;
        const targetRotation = deltaX > 0 ? 180 : -180;
        const rotation = currentRotation + (targetRotation - currentRotation) * clampedProgress;

        frontRef.current.style.transform = `rotateY(${rotation}deg)`;
        backRef.current.style.transform = `rotateY(${rotation + 180}deg)`;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !isGesturing) {
      setTouchStart(null);
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const cardWidth = cardRef.current?.offsetWidth || 300;
    const progress = Math.abs(deltaX) / (cardWidth * 0.5);

    // Flip if progress > 30% or if it was a fast swipe
    const timeDelta = Date.now() - touchStart.time;
    const velocity = Math.abs(deltaX) / timeDelta;
    const shouldFlip = progress > 0.3 || velocity > 0.5;

    if (shouldFlip) {
      flipCard(note.id);
    }

    // Reset gesture state
    setIsGesturing(false);
    setTouchStart(null);
  };

  // Removed handleClick - card clicks should do nothing

  // Navigation handlers
  const handleEditNote = (e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent card tap event
    setDrawerState('closed'); // Close drawer when navigating
    router.push(`/note/${note.id}?edit=true`);
  };

  const handleViewSubnotes = (e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent card tap event
    setDrawerState('closed'); // Close drawer when navigating
    router.push(`/note/${note.id}`);
  };

  const handleArchiveClick = () => {
    setDrawerState('archive-confirm');
  };

  const handleDeleteClick = () => {
    setDrawerState('delete-confirm');
  };

  const handleArchiveConfirm = async () => {
    setDrawerState('closed');
    await archiveNote(note.id);
    if (onArchived) {
      onArchived();
    }
  };

  const handleArchiveCancel = () => {
    setDrawerState('menu');
  };

  const handleDeleteConfirm = async () => {
    setDrawerState('closed');

    if (isArchiveMode) {
      // In archive mode, permanently delete the note
      if (onDelete) {
        onDelete(note.id);
      }
      await deleteNote(note.id);
    } else {
      // In normal mode, archive the note
      await archiveNote(note.id);
      if (onArchived) {
        onArchived();
      }
    }
  };

  const handleDeleteCancel = () => {
    setDrawerState('menu');
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDrawerState(drawerState === 'closed' ? 'menu' : 'closed');
  };

  // Computed values for UI state
  const isDrawerOpen = drawerState !== 'closed';

  return (
    <div
      ref={cardRef}
      data-testid="note-card"
      className={`w-full rounded-lg shadow-lg relative overflow-hidden
        transition-all duration-600 ease-out
        ${heightClass}
        ${isAnimated && !isBeingRemoved
          ? 'opacity-100 scale-100 translate-y-0'
          : isBeingRemoved
            ? 'opacity-0 scale-95 translate-y-4 pointer-events-none'
            : 'opacity-0 scale-95 translate-y-4'
        }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Card Front Side */}
      <div
        ref={frontRef}
        className="absolute inset-0 bg-white p-6 flex flex-col"
        style={{
          backfaceVisibility: 'hidden',
          transformStyle: 'preserve-3d',
        }}
        data-testid="card-front"
      >
        {/* Card Content - Full height with dimming overlay when menu is open */}
        <div
          data-testid="card-content-wrapper"
          className={`h-full relative overflow-hidden transition-opacity duration-300 ${isDrawerOpen ? 'opacity-30' : 'opacity-100'
            }`}
        >
          <div
            data-testid="card-content"
            className="h-full overflow-hidden"
          >
            <div className="prose prose-gray prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Customize markdown rendering for mobile
                  h1: ({ children }) => (
                    <h1 className="text-xl font-bold mb-3 text-gray-900">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-lg font-semibold mb-2 text-gray-800">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base font-medium mb-2 text-gray-700">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="mb-3 text-gray-700 leading-relaxed">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-3 pl-4 space-y-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-3 pl-4 space-y-1">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-gray-700">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-gray-900">{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-gray-800">{children}</em>
                  ),
                }}
              >
                {note.content}
              </ReactMarkdown>
            </div>
          </div>

          {/* Fade mask for overflow indication - adjusted when menu is open */}
          <div
            data-testid="fade-mask"
            className={`absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none transition-opacity duration-300 ${isDrawerOpen ? 'opacity-0' : 'opacity-100'
              }`}
          />
        </div>

        {/* Bottom Left Corner - Subnotes and Edit Time */}
        <div className="absolute bottom-4 left-4 z-20 flex flex-col items-start space-y-1">
          {/* Subnotes Indicator - clickable */}
          {childCount > 0 && showNestedIcon && (
            <div data-testid="subnotes-indicator">
              <button
                onClick={handleEditNote}
                data-testid="nested-notes-button"
                aria-label={`View nested notes (${childCount} child notes)`}
                className="flex items-center px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded-full shadow-sm border border-green-200 transition-colors duration-200"
              >
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                {childCount > 9 ? '9+' : childCount}
              </button>
            </div>
          )}
          {/* Subnotes Indicator (non-clickable) */}
          {childCount > 0 && !showNestedIcon && (
            <div data-testid="subnotes-indicator">
              <div className="flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full shadow-sm border border-green-200">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                {childCount}
              </div>
            </div>
          )}
          {/* Last Edit Time */}
          <div className="text-xs text-gray-400 font-mono">
            {formatLastEditTime(note.updated_at)}
          </div>
        </div>

        {/* 3-Dot Menu Button - positioned above the drawer with higher z-index */}
        <div className="absolute bottom-4 right-4 z-30" ref={menuRef}>
          {/* Sync Status Indicator */}
          {note.syncStatus && (
            <div className="absolute -top-2 -left-2 z-10">
              <div className={`w-3 h-3 rounded-full ${note.syncStatus === 'offline' ? 'bg-gray-400' :
                note.syncStatus === 'synced' ? 'bg-green-500' :
                  note.syncStatus === 'conflict' ? 'bg-orange-500' :
                    'bg-blue-500 animate-pulse'
                }`} title={
                  note.syncStatus === 'offline' ? 'Offline note' :
                    note.syncStatus === 'synced' ? 'Synced' :
                      note.syncStatus === 'conflict' ? 'Has conflict' :
                        'Syncing...'
                } />
            </div>
          )}

          <button
            data-testid="card-menu-button"
            onClick={toggleMenu}
            aria-label="Card options"
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200/80 text-gray-600 rounded-full shadow-sm transition-all duration-300 flex items-center justify-center backdrop-blur-sm"
          >
            <svg
              className={`w-4 h-4 transition-transform duration-300 ${isDrawerOpen ? 'rotate-45' : 'rotate-0'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>

        {/* Unified Drawer - slides up from inside the card */}
        <CardDrawer
          drawerState={drawerState}
          isArchiveMode={isArchiveMode}
          subnoteCount={childCount}
          onEditNoteClick={handleEditNote}
          onViewSubnotesClick={childCount > 0 ? handleViewSubnotes : undefined}
          onArchiveClick={handleArchiveClick}
          onDeleteClick={handleDeleteClick}
          onArchiveConfirm={handleArchiveConfirm}
          onArchiveCancel={handleArchiveCancel}
          onDeleteConfirm={handleDeleteConfirm}
          onDeleteCancel={handleDeleteCancel}
        />
      </div>

      {/* Card Back Side */}
      <div
        ref={backRef}
        className="absolute inset-0"
        style={{
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          transformStyle: 'preserve-3d',
        }}
        data-testid="card-back"
      >
        <CardBackPanel
          parentNoteId={note.id}
          onEnterNote={handleEditNote}
          onArchive={handleArchiveConfirm}
          onDelete={handleDeleteConfirm}
          isArchiveMode={isArchiveMode}
        />
      </div>
    </div>
  );
};
