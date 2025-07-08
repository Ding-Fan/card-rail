import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '../../../test/utils';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import NoteClient from './NoteClient';
import { storage } from '../../../lib/storage';
import { Note } from '../../../lib/types';

// Mock Next.js router
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
}));

// Mock storage
vi.mock('../../../lib/storage', () => ({
    storage: {
        getNotes: vi.fn(),
        setNotes: vi.fn(),
        getNote: vi.fn(),
        setNote: vi.fn(),
        getArchivedNotes: vi.fn(),
        getActiveNotes: vi.fn(),
    },
}));

describe('Note Edit Integration Test', () => {
    const mockRouter = {
        push: vi.fn(),
        back: vi.fn(),
        refresh: vi.fn(),
        replace: vi.fn(),
        forward: vi.fn(),
        prefetch: vi.fn(),
    };

    const mockNote: Note = {
        id: 'test-note-1',
        title: 'Test Note',
        content: '# Original Content\n\nThis is the original content.',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
    };

    const mockNotes: Record<string, Note> = {
        'test-note-1': mockNote,
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup router mock
        vi.mocked(useRouter).mockReturnValue(mockRouter);

        // Setup storage mocks
        vi.mocked(storage.getNotes).mockReturnValue(mockNotes);
        vi.mocked(storage.getNote).mockReturnValue(mockNote);
        vi.mocked(storage.setNote).mockReturnValue(true);
        vi.mocked(storage.setNotes).mockReturnValue(true);
        vi.mocked(storage.getArchivedNotes).mockReturnValue([]);
        vi.mocked(storage.getActiveNotes).mockReturnValue([mockNote]);
    });

    const renderNoteClient = () => {
        return render(<NoteClient note={mockNote} noteId="test-note-1" />);
    };

    it('should persist note changes when editing and going back', async () => {
        const user = userEvent.setup();

        renderNoteClient();

        // Wait for note to load
        await waitFor(() => {
            expect(screen.getByText('Original Content')).toBeInTheDocument();
        });

        // Switch to edit mode
        const editToggle = screen.getByTestId('view-edit-toggle');
        await user.click(editToggle);

        // Wait for textarea to appear
        await waitFor(() => {
            expect(screen.getByTestId('markdown-editor')).toBeInTheDocument();
        });

        // Edit the content
        const textarea = screen.getByTestId('markdown-editor');
        await user.clear(textarea);
        await user.type(textarea, '# Updated Content\n\nThis content has been edited and should persist.');

        // Wait for auto-save to trigger (should be immediate now)
        await waitFor(() => {
            expect(screen.getByText('Saved')).toBeInTheDocument();
        }, { timeout: 3000 });

        // Go back
        const backButton = screen.getByTestId('back-button');
        await user.click(backButton);

        // Verify router.back was called
        expect(mockRouter.back).toHaveBeenCalled();

        // Verify storage was updated (either setNote or updateNote through atoms)
        // Note: The actual storage calls might be through atoms, so we check if any storage method was called
        expect(vi.mocked(storage.setNote).mock.calls.length).toBeGreaterThan(0);
    });

    it('should show correct save status during editing', async () => {
        const user = userEvent.setup();

        renderNoteClient();

        // Wait for note to load
        await waitFor(() => {
            expect(screen.getByText('Original Content')).toBeInTheDocument();
        });

        // Switch to edit mode
        const editToggle = screen.getByTestId('view-edit-toggle');
        await user.click(editToggle);

        // Wait for textarea to appear
        await waitFor(() => {
            expect(screen.getByTestId('markdown-editor')).toBeInTheDocument();
        });

        // Edit the content
        const textarea = screen.getByTestId('markdown-editor');
        await user.type(textarea, ' Additional text');

        // Should show "Saving" status
        await waitFor(() => {
            expect(screen.getByText('Saving')).toBeInTheDocument();
        });

        // Should show "Saved" status after auto-save completes
        await waitFor(() => {
            expect(screen.getByText('Saved')).toBeInTheDocument();
        }, { timeout: 1500 });
    });

    it('should display subnotes in side-by-side layout', async () => {
        // Mock a note with subnotes
        const subnote: Note = {
            id: 'subnote-1',
            title: 'Subnote',
            content: '# Subnote Content\n\nThis is a subnote.',
            parent_id: 'test-note-1',
            created_at: '2023-01-01T00:00:00.000Z',
            updated_at: '2023-01-01T00:00:00.000Z',
        };

        const notesWithSubnotes: Record<string, Note> = {
            'test-note-1': mockNote,
            'subnote-1': subnote,
        };

        // Update storage mock to include subnote
        vi.mocked(storage.getNotes).mockReturnValue(notesWithSubnotes);
        vi.mocked(storage.getActiveNotes).mockReturnValue([mockNote, subnote]);

        renderNoteClient();

        // Wait for note to load
        await waitFor(() => {
            expect(screen.getByText('Original Content')).toBeInTheDocument();
        });

        // Should show subnote count in header
        await waitFor(() => {
            expect(screen.getByText('1 subnote')).toBeInTheDocument();
        });

        // Should show subnote content in the right panel
        await waitFor(() => {
            expect(screen.getByText('Subnote Content')).toBeInTheDocument();
        });

        // The layout should have the correct structure
        // Main content should be in a 90vw container
        const layoutContainer = screen.getByText('Original Content').closest('div[class*="w-[90vw]"]');
        expect(layoutContainer).toBeInTheDocument();

        // Subnotes should also be in a 90vw container
        const subnotesContainer = screen.getByText('Subnote Content').closest('div[class*="w-[90vw]"]');
        expect(subnotesContainer).toBeInTheDocument();
    });

    it('should handle switching between view and edit modes', async () => {
        const user = userEvent.setup();

        renderNoteClient();

        // Start in view mode
        await waitFor(() => {
            expect(screen.getByText('Original Content')).toBeInTheDocument();
        });

        // Should not show textarea initially
        expect(screen.queryByTestId('markdown-editor')).not.toBeInTheDocument();

        // Switch to edit mode
        const editToggle = screen.getByTestId('view-edit-toggle');
        await user.click(editToggle);

        // Should show textarea
        await waitFor(() => {
            expect(screen.getByTestId('markdown-editor')).toBeInTheDocument();
        });

        // Should not show rendered content
        expect(screen.queryByText('Original Content')).not.toBeInTheDocument();

        // Switch back to view mode
        await user.click(editToggle);

        // Should show rendered content again
        await waitFor(() => {
            expect(screen.getByText('Original Content')).toBeInTheDocument();
        });

        // Should not show textarea
        expect(screen.queryByTestId('markdown-editor')).not.toBeInTheDocument();
    });
});
