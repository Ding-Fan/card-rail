'use client';

import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from 'next/navigation';
import { Note } from '../lib/types';
import { useCardHeight, CARD_HEIGHT_RATIOS } from '../lib/cardHeight';

interface CardProps {
  note: Note;
  childCount?: number; // Number of child notes
  showNestedIcon?: boolean; // Whether to show the nested notes icon
  disableEntryAnimation?: boolean; // Disable the default entry animation
}

export const Card: React.FC<CardProps> = ({ note, childCount = 0, showNestedIcon = true, disableEntryAnimation = false }) => {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isAnimated, setIsAnimated] = React.useState(disableEntryAnimation);
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

  // Removed handleClick - card clicks should do nothing

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card tap event
    router.push(`/note/${note.id}?edit=true`);
  };

  const handleNestedClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card tap event
    // Navigate to the infinite nesting route instead of the legacy nested route
    router.push(`/note/${note.id}`);
  };

  return (
    <div
      ref={cardRef}
      data-testid="note-card"
      className={`w-full bg-white rounded-lg shadow-lg p-6 flex flex-col relative
        transition-all duration-600 ease-out
        ${heightClass}
        ${isAnimated 
          ? 'opacity-100 scale-100 translate-y-0' 
          : 'opacity-0 scale-95 translate-y-4'
        }`}
    >
      {/* Fixed Card Header */}
      <div data-testid="card-header" className="absolute top-4 right-4 z-10">
        {/* Edit Button */}
        <button
          data-testid="edit-button"
          onClick={handleEditClick}
          aria-label="Edit note"
          role="button"
          className="w-7 h-7 bg-gray-400 text-white rounded-full shadow-sm transition-colors flex items-center justify-center"
        >
          <svg
            data-testid="edit-icon"
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
      </div>

      {/* Card Content - Full height */}
      <div 
        data-testid="card-content-wrapper"
        className="h-full relative overflow-hidden"
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
        
        {/* Fade mask for overflow indication */}
        <div 
          data-testid="fade-mask"
          className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"
        />
      </div>

      {/* Nested Notes Navigation Icon */}
      {showNestedIcon && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
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
            {childCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {childCount > 9 ? '9+' : childCount}
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
