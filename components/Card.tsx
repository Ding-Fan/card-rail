'use client';

import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from 'next/navigation';
import { Note } from '../lib/types';
import { useCardHeight, CARD_HEIGHT_RATIOS } from '../lib/cardHeight';
import { storage } from '../lib/storage';
import { ArchiveConfirmBubble } from './ArchiveConfirmBubble';
import { DeleteConfirmBubble } from './DeleteConfirmBubble';

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
  }, [isMenuOpen]);

  // Debug logging for menu state
  useEffect(() => {
    // Menu state logging removed - functionality working as expected
  }, [isMenuOpen]);

  // Removed handleClick - card clicks should do nothing

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card tap event
    setIsMenuOpen(false);
    router.push(`/note/${note.id}?edit=true`);
  };

  const handleArchiveClick = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    setShowArchiveConfirm(true);
  };

  // Calculate archive bubble position safely
  const getArchiveBubblePosition = () => {
    if (!cardRef.current) {
      return { x: 100, y: 100 }; // Fallback position
    }

    const cardRect = cardRef.current.getBoundingClientRect();

    // Simple positioning - place bubble above and to the left of the card
    const x = Math.max(20, cardRect.left - 50);
    const y = Math.max(20, cardRect.top - 100);

    return { x, y };
  };

  const handleArchiveConfirm = () => {
    const success = storage.archiveNote(note.id);
    if (success && onArchived) {
      onArchived();
    }
    setShowArchiveConfirm(false);
  };

  const handleArchiveCancel = () => {
    setShowArchiveConfirm(false);
  };

  const handleDeleteConfirm = () => {
    if (onDelete) {
      onDelete(note.id);
    }
    setShowDeleteConfirm(false);
    setIsMenuOpen(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const handleNestedClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card tap event
    // Navigate to the infinite nesting route instead of the legacy nested route
    router.push(`/note/${note.id}`);
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div
      ref={cardRef}
      data-testid="note-card"
      className={`w-full bg-white rounded-lg shadow-lg p-6 flex flex-col relative overflow-hidden
        transition-all duration-600 ease-out
        ${heightClass}
        ${isAnimated
          ? 'opacity-100 scale-100 translate-y-0'
          : 'opacity-0 scale-95 translate-y-4'
        }`}
    >
      {/* Card Content - Full height with dimming overlay when menu is open */}
      <div
        data-testid="card-content-wrapper"
        className={`h-full relative overflow-hidden transition-opacity duration-300 ${isMenuOpen ? 'opacity-30' : 'opacity-100'
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
          className={`absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'
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
            className={`w-4 h-4 transition-transform duration-300 ${isMenuOpen ? 'rotate-45' : 'rotate-0'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      {/* Integrated Drawer Menu - slides up from inside the card */}
      <div
        data-testid="card-drawer-menu"
        data-menu-open={isMenuOpen}
        className={`absolute bottom-6 left-6 right-6 bg-gray-50/95 backdrop-blur-sm border border-gray-200/50 rounded-lg shadow-sm transform transition-transform duration-300 ease-out z-10 ${isMenuOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
      >
        {isMenuOpen && (
          <div className="px-4 py-3 space-y-0">
            <button
              onClick={handleEditClick}
              className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors rounded-md border-b border-gray-200/50 last:border-b-0"
            >
              <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Note
            </button>
            {isArchiveMode ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
                className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors rounded-md"
                data-testid="delete-note-button"
              >
                <svg className="w-5 h-5 mr-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Note
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleArchiveClick(e);
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  // For desktop, trigger on mousedown to be more responsive
                  handleArchiveClick(e);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // For mobile, use touchend instead of click
                  handleArchiveClick(e);
                }}
                style={{ touchAction: 'manipulation' }}
                className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors rounded-md"
                data-testid="archive-note-button"
              >
                <svg className="w-5 h-5 mr-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Archive Note
              </button>
            )}
          </div>
        )}
      </div>

      {/* Nested Notes Navigation Icon - positioned higher when menu is open */}
      {showNestedIcon && childCount > 0 && (
        <div className={`absolute left-1/2 transform -translate-x-1/2 z-10 transition-all duration-300 ${isMenuOpen ? 'bottom-20' : 'bottom-4'
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

      {/* Archive Confirmation Bubble */}
      <ArchiveConfirmBubble
        isOpen={showArchiveConfirm}
        position={getArchiveBubblePosition()}
        noteTitle={note.title || note.content.split('\n')[0] || 'Untitled Note'}
        onConfirm={handleArchiveConfirm}
        onCancel={handleArchiveCancel}
      />

      {/* Delete Confirmation Bubble */}
      {showDeleteConfirm && (
        <DeleteConfirmBubble
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  );
};
