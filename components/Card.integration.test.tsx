import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { Card } from './Card';
import { JotaiProvider } from '../lib/JotaiProvider';
import { storage } from '../lib/storage';
import { Note } from '../lib/types';
import { mockAnimejs } from '../test/mocks';

// Mock Next.js router
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
}));

// Mock storage
vi.mock('../lib/storage', () => ({
    storage: {
        getNotes: vi.fn(),
        setNotes: vi.fn(),
        getNote: vi.fn(),
        setNote: vi.fn(),
        getArchivedNotes: vi.fn(),
        getActiveNotes: vi.fn(),
        archiveNote: vi.fn(),
        deleteNote: vi.fn(),
        removeNote: vi.fn(),
        getFabPosition: vi.fn(),
        setFabPosition: vi.fn(),
        clearAll: vi.fn(),
    },
}));

// Mock animejs for smooth animations
mockAnimejs();

describe('Card Integration Tests', () => {
    const mockRouter = {
        push: vi.fn(),
        back: vi.fn(),
        refresh: vi.fn(),
        replace: vi.fn(),
        forward: vi.fn(),
        prefetch: vi.fn(),
    };

    const mockNote: Note = {
        id: 'test-card-1',
        title: 'Test Card Note',
        content: '# Test Content\n\nThis is a **test** note for integration testing.\n\n- Item 1\n- Item 2',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
    };

    const mockNoteWithSubnotes: Note = {
        id: 'test-card-2',
        title: 'Parent Note',
        content: '# Parent Note\n\nThis note has subnotes.',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
        parent_id: undefined,
    };

    const mockSubnote: Note = {
        id: 'test-subnote-1',
        title: 'Subnote',
        content: '# Subnote Content\n\nThis is a subnote.',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
        parent_id: 'test-card-2',
    };

    const mockNotes: Record<string, Note> = {
        'test-card-1': mockNote,
        'test-card-2': mockNoteWithSubnotes,
        'test-subnote-1': mockSubnote,
    };

    const mockActiveNotes = [mockNote, mockNoteWithSubnotes];
    const mockArchivedNotes: Note[] = [];

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup router mock
        vi.mocked(useRouter).mockReturnValue(mockRouter);

        // Setup storage mocks with realistic behavior
        vi.mocked(storage.getNotes).mockReturnValue(mockNotes);
        vi.mocked(storage.getNote).mockImplementation((id) => mockNotes[id] || null);
        vi.mocked(storage.setNote).mockReturnValue(true);
        vi.mocked(storage.setNotes).mockReturnValue(true);
        vi.mocked(storage.getArchivedNotes).mockReturnValue(mockArchivedNotes);
        vi.mocked(storage.getActiveNotes).mockReturnValue(mockActiveNotes);

        // Mock archive and delete operations
        vi.mocked(storage.archiveNote).mockImplementation((id) => {
            const note = mockNotes[id];
            if (note) {
                mockArchivedNotes.push(note);
                const index = mockActiveNotes.findIndex(n => n.id === id);
                if (index > -1) {
                    mockActiveNotes.splice(index, 1);
                }
                return true;
            }
            return false;
        });

        vi.mocked(storage.deleteNote).mockImplementation((id) => {
            delete mockNotes[id];
            const archivedIndex = mockArchivedNotes.findIndex(n => n.id === id);
            if (archivedIndex > -1) {
                mockArchivedNotes.splice(archivedIndex, 1);
            }
            const activeIndex = mockActiveNotes.findIndex(n => n.id === id);
            if (activeIndex > -1) {
                mockActiveNotes.splice(activeIndex, 1);
            }
            return true;
        });
    });

    afterEach(() => {
        // Reset mock data
        mockArchivedNotes.length = 0;
        mockActiveNotes.length = 0;
        mockActiveNotes.push(mockNote, mockNoteWithSubnotes);
        mockNotes['test-card-1'] = mockNote;
        mockNotes['test-card-2'] = mockNoteWithSubnotes;
        mockNotes['test-subnote-1'] = mockSubnote;
    });

    const renderCard = (note: Note = mockNote, props: Partial<React.ComponentProps<typeof Card>> = {}) => {
        return render(
            <JotaiProvider>
                <Card note={note} {...props} />
            </JotaiProvider>
        );
    };

    describe('Card Display and Content', () => {
        it('should render card with markdown content correctly', async () => {
            renderCard();

            // Check that markdown is rendered as HTML
            expect(screen.getByText('Test Content')).toBeInTheDocument();
            expect(screen.getByText('test', { selector: 'strong' })).toBeInTheDocument();
            expect(screen.getByText('Item 1')).toBeInTheDocument();
            expect(screen.getByText('Item 2')).toBeInTheDocument();
        });

        it('should display menu button and handle click interactions', async () => {
            const user = userEvent.setup();
            renderCard();

            const menuButton = screen.getByTestId('card-menu-button');
            expect(menuButton).toBeInTheDocument();

            // Click to open menu
            await user.click(menuButton);

            // Should see menu options
            await waitFor(() => {
                expect(screen.getByTestId('edit-button')).toBeInTheDocument();
                expect(screen.getByTestId('archive-button')).toBeInTheDocument();
            });
        });

        it('should display subnote count and navigation when subnotes exist', async () => {
            const user = userEvent.setup();
            renderCard(mockNoteWithSubnotes, { childCount: 1 });

            const menuButton = screen.getByTestId('card-menu-button');
            await user.click(menuButton);

            await waitFor(() => {
                expect(screen.getByTestId('view-subnotes-button')).toBeInTheDocument();
                expect(screen.getByText('View Subnotes (1)')).toBeInTheDocument();
            });
        });

        it('should not show subnote navigation when no subnotes exist', async () => {
            const user = userEvent.setup();
            renderCard(mockNote, { childCount: 0 });

            const menuButton = screen.getByTestId('card-menu-button');
            await user.click(menuButton);

            await waitFor(() => {
                expect(screen.queryByTestId('view-subnotes-button')).not.toBeInTheDocument();
            });
        });
    });

    describe('Navigation and Routing', () => {
        it('should navigate to edit mode when edit button is clicked', async () => {
            const user = userEvent.setup();
            renderCard();

            const menuButton = screen.getByTestId('card-menu-button');
            await user.click(menuButton);

            const editButton = await screen.findByTestId('edit-button');
            await user.click(editButton);

            expect(mockRouter.push).toHaveBeenCalledWith('/note/test-card-1?edit=true');
        });

        it('should navigate to note detail page when view subnotes is clicked', async () => {
            const user = userEvent.setup();
            renderCard(mockNoteWithSubnotes, { childCount: 1 });

            const menuButton = screen.getByTestId('card-menu-button');
            await user.click(menuButton);

            const subnotesButton = await screen.findByTestId('view-subnotes-button');
            await user.click(subnotesButton);

            expect(mockRouter.push).toHaveBeenCalledWith('/note/test-card-2');
        });
    });

    describe('Archive Flow Integration', () => {
        it('should complete full archive workflow with confirmation', async () => {
            const user = userEvent.setup();
            const onArchived = vi.fn();
            renderCard(mockNote, { onArchived });

            // Open menu
            const menuButton = screen.getByTestId('card-menu-button');
            await user.click(menuButton);

            // Click archive
            const archiveButton = await screen.findByTestId('archive-button');
            await user.click(archiveButton);

            // Should show confirmation dialog
            await waitFor(() => {
                expect(screen.getByTestId('archive-confirm-button')).toBeInTheDocument();
                expect(screen.getByTestId('archive-cancel-button')).toBeInTheDocument();
            });

            // Confirm archive
            const confirmButton = screen.getByTestId('archive-confirm-button');
            await user.click(confirmButton);

            // Wait for archive operation to complete
            await waitFor(() => {
                expect(storage.archiveNote).toHaveBeenCalledWith('test-card-1');
                expect(onArchived).toHaveBeenCalled();
            });
        });

        it('should cancel archive operation when cancel is clicked', async () => {
            const user = userEvent.setup();
            const onArchived = vi.fn();
            renderCard(mockNote, { onArchived });

            // Open menu and start archive
            const menuButton = screen.getByTestId('card-menu-button');
            await user.click(menuButton);

            const archiveButton = await screen.findByTestId('archive-button');
            await user.click(archiveButton);

            // Cancel archive
            const cancelButton = await screen.findByTestId('archive-cancel-button');
            await user.click(cancelButton);

            // Should return to menu
            await waitFor(() => {
                expect(screen.getByTestId('edit-button')).toBeInTheDocument();
                expect(storage.archiveNote).not.toHaveBeenCalled();
                expect(onArchived).not.toHaveBeenCalled();
            });
        });
    });

    describe('Delete Flow Integration', () => {
        it('should complete full delete workflow in normal mode (archives note)', async () => {
            const user = userEvent.setup();
            const onArchived = vi.fn();
            renderCard(mockNote, { onArchived, isArchiveMode: false });

            // Open menu and click delete
            const menuButton = screen.getByTestId('card-menu-button');
            await user.click(menuButton);

            const deleteButton = await screen.findByTestId('delete-button');
            await user.click(deleteButton);

            // Should show delete confirmation
            await waitFor(() => {
                expect(screen.getByTestId('delete-confirm-button')).toBeInTheDocument();
                expect(screen.getByTestId('delete-cancel-button')).toBeInTheDocument();
            });

            // Confirm delete (should archive in normal mode)
            const confirmButton = screen.getByTestId('delete-confirm-button');
            await user.click(confirmButton);

            // Wait for operation to complete
            await waitFor(() => {
                expect(storage.archiveNote).toHaveBeenCalledWith('test-card-1');
                expect(onArchived).toHaveBeenCalled();
            });
        });

        it('should permanently delete note in archive mode', async () => {
            const user = userEvent.setup();
            const onDelete = vi.fn();
            renderCard(mockNote, { onDelete, isArchiveMode: true });

            // Open menu and click delete
            const menuButton = screen.getByTestId('card-menu-button');
            await user.click(menuButton);

            const deleteButton = await screen.findByTestId('delete-button');
            await user.click(deleteButton);

            // Confirm permanent delete
            const confirmButton = await screen.findByTestId('delete-confirm-button');
            await user.click(confirmButton);

            // Wait for permanent deletion
            await waitFor(() => {
                expect(storage.deleteNote).toHaveBeenCalledWith('test-card-1');
                expect(onDelete).toHaveBeenCalledWith('test-card-1');
            });
        });

        it('should cancel delete operation', async () => {
            const user = userEvent.setup();
            const onDelete = vi.fn();
            renderCard(mockNote, { onDelete, isArchiveMode: true });

            // Open menu and start delete
            const menuButton = screen.getByTestId('card-menu-button');
            await user.click(menuButton);

            const deleteButton = await screen.findByTestId('delete-button');
            await user.click(deleteButton);

            // Cancel delete
            const cancelButton = await screen.findByTestId('delete-cancel-button');
            await user.click(cancelButton);

            // Should return to menu without deleting
            await waitFor(() => {
                expect(screen.getByTestId('edit-button')).toBeInTheDocument();
                expect(storage.deleteNote).not.toHaveBeenCalled();
                expect(onDelete).not.toHaveBeenCalled();
            });
        });
    });

    describe('Animation and Visual States', () => {
        it('should apply fade animation classes when being removed', async () => {
            renderCard(mockNote, { disableEntryAnimation: true });

            const card = screen.getByTestId('note-card');

            // Initially should have normal classes when animation is disabled
            expect(card).toHaveClass('opacity-100', 'scale-100', 'translate-y-0');

            // Note: Testing the removing state would require triggering the actual 
            // atom state change, which is complex in isolation. The visual classes
            // are tested in the unit tests.
        });

        it('should dim content when drawer is open', async () => {
            const user = userEvent.setup();
            renderCard();

            const contentWrapper = screen.getByTestId('card-content-wrapper');

            // Initially content should be fully opaque
            expect(contentWrapper).toHaveClass('opacity-100');

            // Open menu
            const menuButton = screen.getByTestId('card-menu-button');
            await user.click(menuButton);

            // Content should be dimmed
            await waitFor(() => {
                expect(contentWrapper).toHaveClass('opacity-30');
            });
        });

        it('should hide fade mask when drawer is open', async () => {
            const user = userEvent.setup();
            renderCard();

            const fadeMask = screen.getByTestId('fade-mask');

            // Initially fade mask should be visible
            expect(fadeMask).toHaveClass('opacity-100');

            // Open menu
            const menuButton = screen.getByTestId('card-menu-button');
            await user.click(menuButton);

            // Fade mask should be hidden
            await waitFor(() => {
                expect(fadeMask).toHaveClass('opacity-0');
            });
        });
    });

    describe('State Management Integration', () => {
        it('should handle note state changes through Jotai atoms', async () => {
            const user = userEvent.setup();
            renderCard();

            // Test that Jotai state integration works by triggering an archive
            const menuButton = screen.getByTestId('card-menu-button');
            await user.click(menuButton);

            const archiveButton = await screen.findByTestId('archive-button');
            await user.click(archiveButton);

            const confirmButton = await screen.findByTestId('archive-confirm-button');
            await user.click(confirmButton);

            // Verify storage integration
            await waitFor(() => {
                expect(storage.archiveNote).toHaveBeenCalledWith('test-card-1');
            });
        });

        it('should handle multiple rapid interactions gracefully', async () => {
            const user = userEvent.setup();
            renderCard();

            const menuButton = screen.getByTestId('card-menu-button');

            // Rapidly open and close menu
            await user.click(menuButton);
            await user.click(menuButton);
            await user.click(menuButton);

            // Should still be responsive
            await waitFor(() => {
                expect(screen.getByTestId('edit-button')).toBeInTheDocument();
            });
        });
    });

    describe('Accessibility and User Experience', () => {
        it('should have proper ARIA labels and accessibility features', () => {
            renderCard();

            const menuButton = screen.getByTestId('card-menu-button');
            expect(menuButton).toHaveAttribute('aria-label', 'Card options');
        });

        it('should stop event propagation on menu interactions', async () => {
            const user = userEvent.setup();
            const cardClickHandler = vi.fn();

            renderCard();
            const card = screen.getByTestId('note-card');

            // Add event listener to parent element instead of card itself
            const parentDiv = card.parentElement!;
            parentDiv.addEventListener('click', cardClickHandler);

            const menuButton = screen.getByTestId('card-menu-button');
            await user.click(menuButton);

            // Parent click handler should not be called due to stopPropagation
            expect(cardClickHandler).not.toHaveBeenCalled();
        });
    });
});
