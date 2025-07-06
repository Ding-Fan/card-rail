'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as Switch from '@radix-ui/react-switch';
import { useAtom, useAtomValue, atom } from 'jotai';
import { animate } from 'animejs';
import { Note } from '../../../lib/types';
import { updateNoteAtom, getChildNotesAtom, createNoteAtom, canCreateSubnoteAtom, getNestingLevelAtom, getNoteByIdAtom } from '../../../lib/atoms';
import { Card } from '../../../components/Card/Card';
import { useFAB } from '../../../components/FAB/FABContext';

interface NoteClientProps {
  note: Note;
  noteId: string;
}

type TabType = 'content' | 'subnotes';

export default function NoteClient({ note, noteId }: NoteClientProps) {
  const router = useRouter();
  const [, updateNote] = useAtom(updateNoteAtom);
  const [, createNote] = useAtom(createNoteAtom);
  const canCreateSubnote = useAtomValue(canCreateSubnoteAtom);
  const nestingLevel = useAtomValue(getNestingLevelAtom)(noteId);
  const getNoteById = useAtomValue(getNoteByIdAtom);

  // Create a derived atom for this specific note's subnotes
  const subnotesSelectorAtom = useMemo(
    () => atom((get) => get(getChildNotesAtom)(noteId)),
    [noteId]
  );
  const subnotes = useAtomValue(subnotesSelectorAtom);

  const { setCreateSubnoteHandler, setIsInNoteView } = useFAB();

  // Tab and content state
  const [activeTab, setActiveTab] = useState<TabType>('content');
  const [isEditMode, setIsEditMode] = useState(false);
  const [content, setContent] = useState(note.content);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('saved');

  // Refs for swipe animation
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Touch gesture state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

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

  // Generate breadcrumbs based on nesting level
  const breadcrumbs = useMemo(() => {
    if (!nestingLevel.path || nestingLevel.path.length <= 1) return [];
    // Return path excluding current note with actual titles
    return nestingLevel.path.slice(0, -1).map(id => {
      const breadcrumbNote = getNoteById(id);
      return {
        id,
        title: breadcrumbNote ? getTitle(breadcrumbNote.content) : `Note ${id.slice(-4)}`
      };
    });
  }, [nestingLevel, getNoteById, getTitle]);

  // Tab switching with synchronized slide animation
  const switchTab = useCallback((newTab: TabType) => {
    if (newTab === activeTab || isTransitioning) return;

    setIsTransitioning(true);

    const direction = newTab === 'subnotes' ? 1 : -1; // 1 for right, -1 for left
    const headerElement = headerRef.current;
    const contentElement = contentRef.current;

    if (headerElement && contentElement) {
      // Get both header and content elements to animate together
      const headerContent = headerElement.querySelector('.flex.items-center.h-14'); // Main header row
      const currentContent = contentElement.querySelector('[data-tab-content]');

      // Animate both header and content together - slide out
      if (headerContent) {
        animate(headerContent, {
          translateX: direction * -20,
          duration: 300,
          ease: 'outQuart'
        });
      }

      if (currentContent) {
        animate(currentContent, {
          translateX: direction * -20,
          duration: 300,
          ease: 'outQuart'
        });
      }

      // Switch active tab at halfway point
      setTimeout(() => {
        setActiveTab(newTab);

        // Slide both header and content back in
        setTimeout(() => {
          const newHeaderContent = headerElement.querySelector('.flex.items-center.h-14');
          const newContent = contentElement.querySelector('[data-tab-content]');

          if (newHeaderContent) {
            animate(newHeaderContent, {
              translateX: [direction * 20, 0],
              duration: 300,
              ease: 'outQuart'
            });
          }

          if (newContent) {
            animate(newContent, {
              translateX: [direction * 20, 0],
              duration: 300,
              ease: 'outQuart',
              complete: () => {
                setIsTransitioning(false);
              }
            });
          } else {
            setIsTransitioning(false);
          }
        }, 50); // Small delay to ensure DOM update
      }, 150);
    } else {
      // Fallback without animation
      setActiveTab(newTab);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  }, [activeTab, isTransitioning]);

  // Handle touch gestures for tab switching
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isTransitioning) return;
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || isTransitioning) return;

    const touch = e.changedTouches[0];
    const deltaX = touchStart.x - touch.clientX;
    const deltaY = Math.abs(touchStart.y - touch.clientY);
    const minSwipeDistance = 60; // Reduced for more gentle, responsive gestures

    // Only trigger if horizontal swipe is dominant and meets minimum distance
    if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0 && activeTab === 'content') {
        // Swipe left: content -> subnotes
        switchTab('subnotes');
      } else if (deltaX < 0 && activeTab === 'subnotes') {
        // Swipe right: subnotes -> content
        switchTab('content');
      }
    }

    setTouchStart(null);
  };

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
    <div
      className="h-screen overflow-hidden bg-white"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header with tab layout */}
      <div
        ref={headerRef}
        className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-20"
      >        {/* Main header row */}
        <div className="flex items-center h-14 px-4">
          {/* Left section: Back button, save status (content only), subnotes count */}
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Save status - only show on content tab */}
            {activeTab === 'content' && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {saveStatus === 'saving' ? (
                  <>
                    <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    Saving
                  </>
                ) : saveStatus === 'saved' ? (
                  <>
                    <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Saved
                  </>
                ) : null}
              </div>
            )}

            {/* Subnotes count */}
            {subnotes.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {subnotes.length}
              </div>
            )}

            {/* Current tab indicator */}
            <div className="px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-600 font-medium">
              {activeTab === 'content' ? 'Content' : 'Subnotes'}
            </div>
          </div>

          {/* Center: View/Edit toggle - only show on content tab */}
          {activeTab === 'content' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">View</span>
              <Switch.Root
                checked={isEditMode}
                onCheckedChange={setIsEditMode}
                className="w-11 h-6 bg-gray-200 rounded-full relative data-[state=checked]:bg-blue-500 outline-none transition-colors"
              >
                <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[22px]" />
              </Switch.Root>
              <span className="text-sm text-gray-600">Edit</span>
            </div>
          )}

          {/* Right section: Blank space */}
          <div className="flex-1"></div>
        </div>

        {/* Breadcrumbs row */}
        {breadcrumbs.length > 0 && (
          <div className="px-4 pb-2">
            <div className="flex items-center text-sm text-gray-500 overflow-x-auto">
              {breadcrumbs.map((breadcrumb, index) => (
                <React.Fragment key={breadcrumb.id}>
                  <button
                    onClick={() => router.push(`/note/${breadcrumb.id}`)}
                    className="hover:text-blue-600 transition-colors whitespace-nowrap max-w-[120px] truncate"
                    title={breadcrumb.title}
                  >
                    {breadcrumb.title}
                  </button>
                  {index < breadcrumbs.length - 1 && (
                    <svg className="w-4 h-4 mx-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content area */}
      <div
        ref={contentRef}
        className="flex-1 overflow-hidden"
      >
        {activeTab === 'content' ? (
          // Content tab
          <div data-tab-content className="h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto p-6">
              {isEditMode ? (
                <textarea
                  data-testid="markdown-editor"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-[calc(100vh-200px)] p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="Start writing your note..."
                />
              ) : (
                <div className="prose prose-gray max-w-none">
                  <div data-testid="note-title">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {content || '*This note is empty. Switch to edit mode to start writing.*'}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Subnotes tab
          <div data-tab-content className="h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto p-6">
              {subnotes.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No subnotes yet</h3>
                  <p className="text-gray-500 mb-4">Create subnotes to organize your thoughts and break down complex topics.</p>
                  {canCreateSubnote(noteId) && (
                    <button
                      onClick={handleCreateSubnote}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create First Subnote
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {canCreateSubnote(noteId) && (
                    <button
                      onClick={handleCreateSubnote}
                      className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                    >
                      <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add New Subnote
                    </button>
                  )}

                  {subnotes.map((subnote) => (
                    <Card
                      key={subnote.id}
                      note={subnote}
                      childCount={0}
                      showNestedIcon={true}
                      onArchived={() => { }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
