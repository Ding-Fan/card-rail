'use client';

import React from 'react';
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
      data-testid="note-card"
      className="h-full w-full bg-white rounded-lg shadow-lg cursor-pointer p-6 flex flex-col"
      onClick={handleClick}
    >
      {/* Card Header */}
      <div data-testid="card-header" className="flex-none mb-4 flex items-start justify-between">
        <h1 className="text-2xl font-bold text-gray-900 line-clamp-2 flex-1 mr-3">
          {note.title}
        </h1>
        
        {/* Edit Button */}
        <button
          data-testid="edit-button"
          onClick={handleEditClick}
          aria-label="Edit note"
          role="button"
          className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center"
        >
          <svg
            data-testid="edit-icon"
            className="w-4 h-4"
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

      {/* Card Content - Hidden overflow with fade mask */}
      <div 
        data-testid="card-content-wrapper"
        className="flex-1 relative overflow-hidden"
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
