'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as Switch from '@radix-ui/react-switch';
import { Note } from '../../../lib/types';

interface NoteClientProps {
  note: Note;
  noteId: string;
}

export default function NoteClient({ note, noteId }: NoteClientProps) {
  const router = useRouter();
  const [isEditMode, setIsEditMode] = useState(false);
  const [content, setContent] = useState(note.content);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('saved');
  
  // Extract title from content (first h1 or first line)
  const getTitle = useCallback((markdown: string) => {
    const lines = markdown.split('\n');
    const firstLine = lines[0]?.trim() || '';
    
    // If first line is H1, extract the text
    if (firstLine.startsWith('# ')) {
      return firstLine.substring(2).trim();
    }
    
    // Otherwise use first non-empty line or fallback
    return firstLine || 'Untitled Note';
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (content === note.content) return;
    
    setSaveStatus('saving');
    
    const timeoutId = setTimeout(() => {
      // Save to localStorage
      const savedNotes = JSON.parse(localStorage.getItem('card-rail-notes') || '{}');
      savedNotes[noteId] = {
        ...note,
        content,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem('card-rail-notes', JSON.stringify(savedNotes));
      setSaveStatus('saved');
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('notes-updated'));
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [content, note, noteId]);

  // Load saved content from localStorage on mount
  useEffect(() => {
    const savedNotes = JSON.parse(localStorage.getItem('card-rail-notes') || '{}');
    if (savedNotes[noteId]) {
      setContent(savedNotes[noteId].content);
    }
  }, [noteId]);

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Ultra-Compact Header */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-100 z-10">
        <div className="max-w-4xl mx-auto px-4 py-1 flex items-center justify-between h-10">
          {/* Icon-only Back Button */}
          <button
            data-testid="back-button"
            onClick={handleBack}
            aria-label="Go back"
            className="w-8 h-8 flex items-center justify-center text-gray-600 rounded-full transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            {/* Compact Save Status */}
            {saveStatus !== 'idle' && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                {saveStatus === 'saving' ? (
                  <>
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Saved
                  </>
                )}
              </div>
            )}

            {/* Compact View/Edit Toggle */}
            <div className="flex items-center gap-1">
              <span className={`text-xs ${!isEditMode ? 'text-gray-700' : 'text-gray-400'}`}>
                View
              </span>
              <Switch.Root
                className="w-6 h-3 bg-gray-200 rounded-full relative data-[state=checked]:bg-blue-500 outline-none cursor-pointer"
                checked={isEditMode}
                onCheckedChange={setIsEditMode}
                data-testid="view-edit-toggle"
              >
                <Switch.Thumb className="block w-2 h-2 bg-white rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[14px]" />
              </Switch.Root>
              <span className={`text-xs ${isEditMode ? 'text-gray-700' : 'text-gray-400'}`}>
                Edit
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto">
        {isEditMode ? (
          /* Edit Mode */
          <div className="p-4">
            <textarea
              data-testid="markdown-editor"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-[calc(100vh-60px)] p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Write your markdown here..."
            />
          </div>
        ) : (
          /* View Mode - Clean Article Style (No Card) */
          <article className="px-6 py-8 max-w-none">
            <header className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 leading-tight">
                {getTitle(content)}
              </h1>
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                <time>Created {new Date(note.created_at).toLocaleDateString()}</time>
                <span>•</span>
                <time>Updated {new Date(note.updated_at).toLocaleDateString()}</time>
              </div>
            </header>
            
            {/* Full Content Display - No Height Restrictions */}
            <div className="prose prose-lg max-w-none prose-gray">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-3xl font-bold mb-6 text-gray-900 mt-12 first:mt-0">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-2xl font-semibold mb-4 text-gray-800 mt-10">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl font-medium mb-3 text-gray-700 mt-8">{children}</h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-lg font-medium mb-2 text-gray-700 mt-6">{children}</h4>
                  ),
                  p: ({ children }) => (
                    <p className="mb-6 text-gray-700 leading-relaxed text-lg">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-6 pl-6 space-y-2 text-lg">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-6 pl-6 space-y-2 text-lg">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-gray-700 leading-relaxed">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-gray-900">{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-gray-800">{children}</em>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-200 pl-6 my-8 italic text-gray-600 text-lg">
                      {children}
                    </blockquote>
                  ),
                  code: ({ children }) => (
                    <code className="bg-gray-100 px-2 py-1 rounded text-base font-mono text-gray-800">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto my-6 text-sm">
                      {children}
                    </pre>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
