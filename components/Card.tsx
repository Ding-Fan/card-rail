'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Note } from '../lib/types';

interface CardProps {
  note: Note;
  onTap?: (noteId: string) => void;
}

export const Card: React.FC<CardProps> = ({ note, onTap }) => {
  const handleClick = () => {
    if (onTap) {
      onTap(note.id);
    }
  };

  return (
    <div
      data-testid="note-card"
      className="h-full w-full bg-white rounded-lg shadow-lg cursor-pointer p-6 flex flex-col"
      onClick={handleClick}
    >
      {/* Card Header */}
      <div data-testid="card-header" className="flex-none mb-4">
        <h1 className="text-2xl font-bold text-gray-900 line-clamp-2">
          {note.title}
        </h1>
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
