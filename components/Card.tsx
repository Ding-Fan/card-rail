'use client';

import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from 'next/navigation';
import { useAtomValue, useSetAtom } from 'jotai';
import { Note } from '../lib/types';
import { useCardHeight, CARD_HEIGHT_RATIOS } from '../lib/cardHeight';
import { archiveNoteAtom, deleteNoteAtom, removingCardsAtom } from '../lib/atoms';
import { CardDrawer } from './CardDrawer';

interface CardProps {
  note: Note;
  childCount?: number; // Number of child notes
  showNestedIcon?: boolean; // Whether to show the nested notes icon
  disableEntryAnimation?: boolean; // Disable the default entry animation
  onArchived?: () => void; // Callback when note is archived
  isArchiveMode?: boolean; // Whether the card is displayed in archive mode
  onDelete?: (noteId: string) => void; // Callback when note is deleted permanently
}

export const Card: React.FC<CardProps> = ({ note, childCount = 0, showNestedIcon = true, disableEntryAnimation = false, onArchived, isArchiveMode = false, onDelete }) => {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isAnimated, setIsAnimated] = React.useState(disableEntryAnimation);

  // Jotai state management
  const removingCards = useAtomValue(removingCardsAtom);
  const archiveNote = useSetAtom(archiveNoteAtom);
  const deleteNote = useSetAtom(deleteNoteAtom);

  // Check if this card is being removed for fade animation
  const isBeingRemoved = removingCards.has(note.id);

  // Unified drawer state management
  type DrawerState = 'closed' | 'menu' | 'archive-confirm' | 'delete-confirm';
  const [drawerState, setDrawerState] = useState<DrawerState>('closed');

  const cardHeight = useCardHeight(note);

  // Calculate viewport height class based on measured content
  const heightClass = React.useMemo(() => {
    const ratio = CARD_HEIGHT_RATIOS[cardHeight];
    return `h-[${Math.round(ratio * 100)}vh]`;
  }, [cardHeight]);

  // Entry animation on mount using CSS transitions
  useEffect(() => {
    if (disableEntryAnimation) return;

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

  // Removed handleClick - card clicks should do nothing

  const handleEditClick = () => {
    setDrawerState('closed');
    router.push(`/note/${note.id}?edit=true`);
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

  const handleNestedClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card tap event
    // Navigate to the infinite nesting route instead of the legacy nested route
    router.push(`/note/${note.id}`);
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
      className={`w-full bg-white rounded-lg shadow-lg p-6 flex flex-col relative overflow-hidden
        transition-all duration-600 ease-out
        ${heightClass}
        ${isAnimated && !isBeingRemoved
          ? 'opacity-100 scale-100 translate-y-0'
          : isBeingRemoved
            ? 'opacity-0 scale-95 translate-y-4 pointer-events-none'
            : 'opacity-0 scale-95 translate-y-4'
        }`}
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

      {/* 3-Dot Menu Button - positioned above the drawer with higher z-index */}
      <div className="absolute bottom-4 right-4 z-30" ref={menuRef}>
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
        onEditClick={handleEditClick}
        onArchiveClick={handleArchiveClick}
        onDeleteClick={handleDeleteClick}
        onArchiveConfirm={handleArchiveConfirm}
        onArchiveCancel={handleArchiveCancel}
        onDeleteConfirm={handleDeleteConfirm}
        onDeleteCancel={handleDeleteCancel}
      />

      {/* Nested Notes Navigation Icon - positioned higher when menu is open */}
      {showNestedIcon && childCount > 0 && (
        <div className={`absolute left-1/2 transform -translate-x-1/2 z-10 transition-all duration-300 ${isDrawerOpen ? 'bottom-20' : 'bottom-4'
          }`}>
          <button
            data-testid="nested-notes-button"
            onClick={handleNestedClick}
            aria-label={`View nested notes (${childCount} child notes)`}
            role="button"
            className="w-8 h-8 bg-blue-500 text-white rounded-full shadow-md hover:bg-blue-600 transition-all rotate-90 duration-200 flex items-center justify-center group"
          >
            <svg
              data-testid="nested-icon"
              className="w-4 h-4 transition-transform duration-200 group-hover:scale-110"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {childCount > 9 ? '9+' : childCount}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
