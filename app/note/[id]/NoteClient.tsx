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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            data-testid="back-button"
            onClick={handleBack}
            aria-label="Go back"
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
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
            Back
          </button>

          <div className="flex items-center gap-4">
            {/* Save Status */}
            {saveStatus !== 'idle' && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {saveStatus === 'saving' ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Saved
                  </>
                )}
              </div>
            )}

            {/* View/Edit Toggle */}
            <div className="flex items-center gap-3">
              <span className={`text-sm ${!isEditMode ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                View
              </span>
              <Switch.Root
                className="w-11 h-6 bg-gray-200 rounded-full relative data-[state=checked]:bg-blue-600 outline-none cursor-pointer"
                checked={isEditMode}
                onCheckedChange={setIsEditMode}
                data-testid="view-edit-toggle"
              >
                <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[22px]" />
              </Switch.Root>
              <span className={`text-sm ${isEditMode ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                Edit
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        {isEditMode ? (
          /* Edit Mode */
          <div className="space-y-4">
            <textarea
              data-testid="markdown-editor"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-[calc(100vh-200px)] p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Write your markdown here..."
            />
          </div>
        ) : (
          /* View Mode */
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="prose max-w-none">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">
                {getTitle(content)}
              </h1>
              
              <div className="markdown-content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-2xl font-bold mb-4 text-gray-900">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-xl font-semibold mb-3 text-gray-800">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-lg font-medium mb-2 text-gray-700">{children}</h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-4 text-gray-700 leading-relaxed">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="mb-4 pl-6 space-y-2">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-4 pl-6 space-y-2">{children}</ol>
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
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-blue-200 pl-4 my-4 italic text-gray-600">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
                        {children}
                      </code>
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500">
                <p>Created: {new Date(note.created_at).toLocaleDateString()}</p>
                <p>Updated: {new Date(note.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
