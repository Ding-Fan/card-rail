'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as Switch from '@radix-ui/react-switch';
import { useAtom, useAtomValue, atom } from 'jotai';
import { Note } from '../../../lib/types';
import { updateNoteAtom, getChildNotesAtom, createNoteAtom, canCreateSubnoteAtom } from '../../../lib/atoms';
import { Card } from '../../../components/Card';
import { useFAB } from '../../../components/FAB/FABContext';

interface NoteClientProps {
  note: Note;
  noteId: string;
}

export default function NoteClient({ note, noteId }: NoteClientProps) {
  const router = useRouter();
  const [, updateNote] = useAtom(updateNoteAtom);
  const [, createNote] = useAtom(createNoteAtom);
  const canCreateSubnote = useAtomValue(canCreateSubnoteAtom);

  // Create a derived atom for this specific note's subnotes
  const subnotesSelectorAtom = useMemo(
    () => atom((get) => get(getChildNotesAtom)(noteId)),
    [noteId]
  );
  const subnotes = useAtomValue(subnotesSelectorAtom);

  const { setCreateSubnoteHandler, setIsInNoteView } = useFAB();
  const [isEditMode, setIsEditMode] = useState(false);
  const [content, setContent] = useState(note.content);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('saved');
  const [isSubnotesPanelVisible, setIsSubnotesPanelVisible] = useState(false);

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

  // Handle subnote creation
  const handleCreateSubnote = useCallback(() => {
    // Check if subnote creation is allowed
    if (!canCreateSubnote(noteId)) {
      alert('Cannot create subnote: Maximum nesting level reached or note is archived.');
      return;
    }

    createNote({
      content: '# New Subnote\n\nStart writing...',
      parentId: noteId
    });
  }, [noteId, canCreateSubnote, createNote]);

  // Set up FAB context for note view
  useEffect(() => {
    setIsInNoteView(true);
    setCreateSubnoteHandler(handleCreateSubnote);

    return () => {
      setIsInNoteView(false);
      setCreateSubnoteHandler(undefined);
    };
  }, [setIsInNoteView, setCreateSubnoteHandler, handleCreateSubnote]);

  // Smart auto-save functionality
  useEffect(() => {
    if (content === note.content) return;

    setSaveStatus('saving');

    const timeoutId = setTimeout(() => {
      // Update the note using the Jotai atom
      updateNote({
        id: noteId,
        updates: {
          content,
          title: getTitle(content)
        }
      });
      setSaveStatus('saved');
    }, 500); // Reduced from 2000ms to 500ms for faster saving

    return () => clearTimeout(timeoutId);
  }, [content, note.content, noteId, updateNote, getTitle]);

  // Load saved content on mount
  useEffect(() => {
    setContent(note.content);
  }, [note.content]);

  // Handle navigation back
  const handleBack = async () => {
    // Save any pending changes before leaving
    if (content !== note.content) {
      try {
        await new Promise<void>((resolve) => {
          updateNote({
            id: noteId,
            updates: {
              content,
              title: getTitle(content)
            }
          });
          // Give a small delay to ensure storage is written
          setTimeout(resolve, 100);
        });
      } catch (error) {
        console.error('Failed to save note before navigation:', error);
      }
    }

    router.back();
  };

  return (
    <div className="flex w-[180vw] h-screen overflow-hidden">
      {/* Main Note Content - 90vw */}
      <div className="w-[90vw] h-full overflow-auto bg-white">
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
              {/* Subnotes count and toggle */}
              {subnotes.length > 0 && (
                <button
                  onClick={() => setIsSubnotesPanelVisible(!isSubnotesPanelVisible)}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {subnotes.length} subnote{subnotes.length !== 1 ? 's' : ''}
                </button>
              )}

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

      {/* Subnotes Panel - 90vw */}
      <div className="w-[90vw] h-full bg-gray-50 border-l border-gray-200">
        {subnotes.length > 0 ? (
          <div className="h-full flex flex-col">
            {/* Subnotes Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Subnotes ({subnotes.length})
                </h3>
                <button
                  onClick={() => setIsSubnotesPanelVisible(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Subnotes List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {subnotes.map((subnote) => (
                <div key={subnote.id} className="transform scale-90 origin-top">
                  <Card
                    note={subnote}
                    disableEntryAnimation={true}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg">No subnotes yet</p>
              <p className="text-sm mt-1">Use the FAB to create a subnote</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
