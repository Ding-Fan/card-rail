'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as Switch from '@radix-ui/react-switch';
import { useAtom } from 'jotai';
import { createNoteAtom, updateNoteAtom } from '../../../lib/atoms';

// Client component that shows empty editor and creates note on first keystroke
export default function NewNotePage() {
  const router = useRouter();
  const [, createNote] = useAtom(createNoteAtom);
  const [, updateNote] = useAtom(updateNoteAtom);
  const [isEditMode, setIsEditMode] = useState(true); // Start in edit mode
  const [content, setContent] = useState(''); // Start with empty content
  const [noteId, setNoteId] = useState<string | null>(null); // Track created note ID
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');

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

  // Debounced auto-save for subsequent changes after note is created
  useEffect(() => {
    if (!noteId || content === '') return; // Only save if note exists and has content

    setSaveStatus('saving');

    const timeoutId = setTimeout(() => {
      updateNote({
        id: noteId,
        updates: {
          content,
          title: getTitle(content)
        }
      });
      setSaveStatus('saved');
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [content, noteId, updateNote, getTitle]);

  // Handle content change - create note on first keystroke
  const handleContentChange = (newContent: string) => {
    setContent(newContent);

    // If this is the first keystroke (note not yet created)
    if (!noteId && newContent.length > 0) {
      // Create note with user content only
      const createdNote = createNote();
      if (createdNote) {
        setNoteId(createdNote.id);

        // Update the note with the user content
        updateNote({
          id: createdNote.id,
          updates: {
            content: newContent,
            title: getTitle(newContent)
          }
        });
      }
    }
    // Note: For subsequent changes, we'll use useEffect for debounced saving
  };

  // Handle navigation back
  const handleBack = () => {
    // Simple back navigation - no smart deletion needed
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
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full h-[calc(100vh-60px)] p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Start typing to create your note..."
              autoFocus
            />
          </div>
        ) : (
          /* View Mode - Clean Article Style */
          <article className="px-6 py-8 max-w-none">
            {content ? (
              <>
                <header className="mb-8">
                  <h1 className="text-4xl font-bold text-gray-900 leading-tight">
                    {getTitle(content)}
                  </h1>
                </header>

                {/* Full Content Display */}
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
              </>
            ) : (
              <div className="text-center text-gray-500 mt-20">
                <p>Switch to Edit mode to start writing your note</p>
              </div>
            )}
          </article>
        )}
      </div>
    </div>
  );
}
