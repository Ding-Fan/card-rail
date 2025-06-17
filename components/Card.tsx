'use client';

import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from 'next/navigation';
import { Note } from '../lib/types';

interface CardProps {
  note: Note;
  onTap?: (noteId: string) => void;
}

export const Card: React.FC<CardProps> = ({ note, onTap }) => {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isAnimated, setIsAnimated] = React.useState(false);

  // Entry animation on mount using CSS transitions
  useEffect(() => {
    // Trigger animation after a small delay
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, Math.random() * 200); // Stagger animation for multiple cards

    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    if (onTap) {
      onTap(note.id);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card tap event
    router.push(`/note/${note.id}`);
  };

  return (
    <div
      ref={cardRef}
      data-testid="note-card"
      className={`h-full w-full bg-white rounded-lg shadow-lg cursor-pointer p-6 flex flex-col relative
        transition-all duration-600 ease-out
        hover:shadow-xl hover:scale-105
        ${isAnimated 
          ? 'opacity-100 scale-100 translate-y-0' 
          : 'opacity-0 scale-95 translate-y-4'
        }`}
      onClick={handleClick}
    >
      {/* Fixed Card Header */}
      <div data-testid="card-header" className="absolute top-4 right-4 z-10">
        {/* Edit Button */}
        <button
          data-testid="edit-button"
          onClick={handleEditClick}
          aria-label="Edit note"
          role="button"
          className="w-7 h-7 bg-gray-400 text-white rounded-full shadow-sm hover:bg-gray-500 transition-colors flex items-center justify-center"
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
    </div>
  );
};
