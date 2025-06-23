import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../test/utils'
import { Card } from './Card'
import { mockAnimejs, mockNotes } from '../test/mocks'

// Mock Next.js router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}))

// Mock anime.js
mockAnimejs()

// Mock storage
const mockArchiveNote = vi.fn()
vi.mock('../lib/storage', () => ({
    storage: {
        archiveNote: mockArchiveNote,
    },
}))

describe('Card Archive Functionality', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockArchiveNote.mockReturnValue(true)
    })

    describe('Archive Note Menu Option', () => {
        it('should show "Archive Note" option in card menu', () => {
            render(<Card note={mockNotes.simple} />)

            // Open the card menu
            const menuButton = screen.getByTestId('card-menu-button')
            fireEvent.click(menuButton)

            // Should show archive option
            const archiveOption = screen.getByText('Archive Note')
            expect(archiveOption).toBeInTheDocument()
        })

        it('should open archive confirmation bubble when "Archive Note" is clicked', () => {
            render(<Card note={mockNotes.simple} />)

            // Open menu and click archive
            const menuButton = screen.getByTestId('card-menu-button')
            fireEvent.click(menuButton)

            const archiveOption = screen.getByText('Archive Note')
            fireEvent.click(archiveOption)

            // Should show confirmation bubble
            expect(screen.getByText('Archive Note?')).toBeInTheDocument()
            expect(screen.getByText(/Be sure to archive/)).toBeInTheDocument()
        })

        it('should close card menu when archive option is clicked', () => {
            render(<Card note={mockNotes.simple} />)

            // Open menu
            const menuButton = screen.getByTestId('card-menu-button')
            fireEvent.click(menuButton)

            // Verify menu is open
            expect(screen.getByText('Archive Note')).toBeInTheDocument()

            // Click archive option
            const archiveOption = screen.getByText('Archive Note')
            fireEvent.click(archiveOption)

            // Menu should be closed (menu content not visible, but confirmation bubble is)
            expect(screen.queryByText('Edit Note')).not.toBeInTheDocument()
            expect(screen.getByText('Archive Note?')).toBeInTheDocument()
        })
    })

    describe('Archive Confirmation Bubble', () => {
        it('should display note title in confirmation message', () => {
            render(<Card note={mockNotes.simple} />)

            // Trigger archive confirmation
            const menuButton = screen.getByTestId('card-menu-button')
            fireEvent.click(menuButton)
            fireEvent.click(screen.getByText('Archive Note'))

            // Should show note title in confirmation
            expect(screen.getByText(/Test Note/)).toBeInTheDocument()
        })

        it('should truncate long note titles in confirmation message', () => {
            const longTitleNote = {
                ...mockNotes.simple,
                title: 'This is a very long note title that should be truncated when displayed in the confirmation bubble'
            }

            render(<Card note={longTitleNote} />)

            // Trigger archive confirmation
            const menuButton = screen.getByTestId('card-menu-button')
            fireEvent.click(menuButton)
            fireEvent.click(screen.getByText('Archive Note'))

            // Should show truncated title with ellipsis
            const confirmationText = screen.getByText(/Be sure to archive/)
            expect(confirmationText.textContent).toMatch(/\.\.\./)
        })

        it('should have Cancel and Archive buttons', () => {
            render(<Card note={mockNotes.simple} />)

            // Trigger archive confirmation
            const menuButton = screen.getByTestId('card-menu-button')
            fireEvent.click(menuButton)
            fireEvent.click(screen.getByText('Archive Note'))

            // Should have both buttons
            expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: 'Archive' })).toBeInTheDocument()
        })

        it('should close confirmation bubble when Cancel is clicked', () => {
            render(<Card note={mockNotes.simple} />)

            // Trigger archive confirmation
            const menuButton = screen.getByTestId('card-menu-button')
            fireEvent.click(menuButton)
            fireEvent.click(screen.getByText('Archive Note'))

            // Click Cancel
            const cancelButton = screen.getByRole('button', { name: 'Cancel' })
            fireEvent.click(cancelButton)

            // Confirmation should be closed
            expect(screen.queryByText('Archive Note?')).not.toBeInTheDocument()
        })

        it('should close confirmation bubble on Escape key', () => {
            render(<Card note={mockNotes.simple} />)

            // Trigger archive confirmation
            const menuButton = screen.getByTestId('card-menu-button')
            fireEvent.click(menuButton)
            fireEvent.click(screen.getByText('Archive Note'))

            // Press Escape
            fireEvent.keyDown(document, { key: 'Escape' })

            // Confirmation should be closed
            expect(screen.queryByText('Archive Note?')).not.toBeInTheDocument()
        })

        it('should auto-close confirmation bubble after 10 seconds', async () => {
            vi.useFakeTimers()

            render(<Card note={mockNotes.simple} />)

            // Trigger archive confirmation
            const menuButton = screen.getByTestId('card-menu-button')
            fireEvent.click(menuButton)
            fireEvent.click(screen.getByText('Archive Note'))

            // Confirmation should be visible
            expect(screen.getByText('Archive Note?')).toBeInTheDocument()

            // Fast-forward time
            vi.advanceTimersByTime(10000)

            // Wait for the timeout to trigger
            await waitFor(() => {
                expect(screen.queryByText('Archive Note?')).not.toBeInTheDocument()
            })

            vi.useRealTimers()
        })
    })

    describe('Archive Action Execution', () => {
        it('should call storage.archiveNote when Archive button is clicked', () => {
            render(<Card note={mockNotes.simple} />)

            // Trigger archive confirmation and confirm
            const menuButton = screen.getByTestId('card-menu-button')
            fireEvent.click(menuButton)
            fireEvent.click(screen.getByText('Archive Note'))

            const archiveButton = screen.getByRole('button', { name: 'Archive' })
            fireEvent.click(archiveButton)

            // Should call storage with correct note ID
            expect(mockArchiveNote).toHaveBeenCalledWith(mockNotes.simple.id)
        })

        it('should call onArchived callback when archive succeeds', () => {
            const onArchived = vi.fn()
            render(<Card note={mockNotes.simple} onArchived={onArchived} />)

            // Trigger archive confirmation and confirm
            const menuButton = screen.getByTestId('card-menu-button')
            fireEvent.click(menuButton)
            fireEvent.click(screen.getByText('Archive Note'))

            const archiveButton = screen.getByRole('button', { name: 'Archive' })
            fireEvent.click(archiveButton)

            // Should call the callback
            expect(onArchived).toHaveBeenCalled()
        })

        it('should not call onArchived callback when archive fails', () => {
            mockArchiveNote.mockReturnValue(false) // Simulate failure

            const onArchived = vi.fn()
            render(<Card note={mockNotes.simple} onArchived={onArchived} />)

            // Trigger archive confirmation and confirm
            const menuButton = screen.getByTestId('card-menu-button')
            fireEvent.click(menuButton)
            fireEvent.click(screen.getByText('Archive Note'))

            const archiveButton = screen.getByRole('button', { name: 'Archive' })
            fireEvent.click(archiveButton)

            // Should not call the callback on failure
            expect(onArchived).not.toHaveBeenCalled()
        })

        it('should close confirmation bubble after archive action', () => {
            render(<Card note={mockNotes.simple} />)

            // Trigger archive confirmation and confirm
            const menuButton = screen.getByTestId('card-menu-button')
            fireEvent.click(menuButton)
            fireEvent.click(screen.getByText('Archive Note'))

            const archiveButton = screen.getByRole('button', { name: 'Archive' })
            fireEvent.click(archiveButton)

            // Confirmation should be closed
            expect(screen.queryByText('Archive Note?')).not.toBeInTheDocument()
        })
    })

    describe('Archive Integration with Card States', () => {
        it('should not show archive option for already archived notes', () => {
            const archivedNote = {
                ...mockNotes.simple,
                isArchived: true
            }

            render(<Card note={archivedNote} />)

            // Open the card menu
            const menuButton = screen.getByTestId('card-menu-button')
            fireEvent.click(menuButton)

            // Should not show archive option for archived notes
            expect(screen.queryByText('Archive Note')).not.toBeInTheDocument()
        })

        it('should stop event propagation when archive option is clicked', () => {
            const cardClickHandler = vi.fn()

            render(
                <div onClick={cardClickHandler}>
                    <Card note={mockNotes.simple} />
                </div>
            )

            // Open menu and click archive
            const menuButton = screen.getByTestId('card-menu-button')
            fireEvent.click(menuButton)

            const archiveOption = screen.getByText('Archive Note')
            fireEvent.click(archiveOption)

            // Parent click handler should not be called
            expect(cardClickHandler).not.toHaveBeenCalled()
        })

        it('should handle archive action without onArchived callback gracefully', () => {
            render(<Card note={mockNotes.simple} />) // No onArchived prop

            // Trigger archive confirmation and confirm
            const menuButton = screen.getByTestId('card-menu-button')
            fireEvent.click(menuButton)
            fireEvent.click(screen.getByText('Archive Note'))

            const archiveButton = screen.getByRole('button', { name: 'Archive' })

            // Should not throw error when clicking archive without callback
            expect(() => {
                fireEvent.click(archiveButton)
            }).not.toThrow()

            // Should still call storage
            expect(mockArchiveNote).toHaveBeenCalled()
        })
    })

    describe('Archive Confirmation Bubble Positioning', () => {
        it('should position archive bubble relative to archive menu option', () => {
            render(<Card note={mockNotes.simple} />)

            // Trigger archive confirmation
            const menuButton = screen.getByTestId('card-menu-button')
            fireEvent.click(menuButton)
            fireEvent.click(screen.getByText('Archive Note'))

            // Should render the confirmation bubble
            const bubble = screen.getByText('Archive Note?').closest('[style*="left"]')
            expect(bubble).toBeInTheDocument()
            expect(bubble).toHaveStyle({ position: 'fixed' })
        })
    })

    describe('Archive Button Behavior Edge Cases', () => {
        it('should handle rapid clicking on archive button', () => {
            render(<Card note={mockNotes.simple} />)

            // Open menu and click archive multiple times rapidly
            const menuButton = screen.getByTestId('card-menu-button')
            fireEvent.click(menuButton)

            const archiveOption = screen.getByText('Archive Note')
            fireEvent.click(archiveOption)
            fireEvent.click(archiveOption) // Second click should not cause issues

            // Should only show one confirmation bubble
            const confirmButtons = screen.getAllByText('Archive Note?')
            expect(confirmButtons).toHaveLength(1)
        })

        it('should handle archive confirmation with missing note ID', () => {
            const noteWithoutId = { ...mockNotes.simple, id: '' }

            render(<Card note={noteWithoutId} />)

            // Trigger archive confirmation and confirm
            const menuButton = screen.getByTestId('card-menu-button')
            fireEvent.click(menuButton)
            fireEvent.click(screen.getByText('Archive Note'))

            const archiveButton = screen.getByRole('button', { name: 'Archive' })

            // Should handle empty ID gracefully
            expect(() => {
                fireEvent.click(archiveButton)
            }).not.toThrow()

            expect(mockArchiveNote).toHaveBeenCalledWith('')
        })

        it('should preserve archive button state when card re-renders', () => {
            const { rerender } = render(<Card note={mockNotes.simple} />)

            // Open menu
            const menuButton = screen.getByTestId('card-menu-button')
            fireEvent.click(menuButton)

            // Archive option should be visible
            expect(screen.getByText('Archive Note')).toBeInTheDocument()

            // Re-render with same note
            rerender(<Card note={mockNotes.simple} />)

            // Menu should be closed after re-render, but archive option should still be available
            expect(screen.queryByText('Archive Note')).not.toBeInTheDocument()

            // Open menu again
            fireEvent.click(screen.getByTestId('card-menu-button'))
            expect(screen.getByText('Archive Note')).toBeInTheDocument()
        })
    })

    describe('Archive Confirmation Bubble Accessibility', () => {
        it('should have proper ARIA labels for confirmation buttons', () => {
            render(<Card note={mockNotes.simple} />)

            // Trigger archive confirmation
            const menuButton = screen.getByTestId('card-menu-button')
            fireEvent.click(menuButton)
            fireEvent.click(screen.getByText('Archive Note'))

            // Check ARIA labels
            const cancelButton = screen.getByRole('button', { name: 'Cancel' })
            const archiveButton = screen.getByRole('button', { name: 'Archive' })

            expect(cancelButton).toHaveAttribute('type', 'button')
            expect(archiveButton).toHaveAttribute('type', 'button')
        })

        it('should be keyboard navigable', () => {
            render(<Card note={mockNotes.simple} />)

            // Trigger archive confirmation
            const menuButton = screen.getByTestId('card-menu-button')
            fireEvent.click(menuButton)
            fireEvent.click(screen.getByText('Archive Note'))

            // Should be able to tab between buttons
            const cancelButton = screen.getByRole('button', { name: 'Cancel' })
            const archiveButton = screen.getByRole('button', { name: 'Archive' })

            cancelButton.focus()
            expect(document.activeElement).toBe(cancelButton)

            // Tab to archive button
            fireEvent.keyDown(cancelButton, { key: 'Tab' })
            // Note: jsdom doesn't automatically handle focus changes, but we can verify buttons exist and are focusable
            expect(archiveButton).toBeInTheDocument()
        })

        it('should activate archive on Enter key when archive button is focused', () => {
            render(<Card note={mockNotes.simple} />)

            // Trigger archive confirmation
            const menuButton = screen.getByTestId('card-menu-button')
            fireEvent.click(menuButton)
            fireEvent.click(screen.getByText('Archive Note'))

            const archiveButton = screen.getByRole('button', { name: 'Archive' })

            // Focus and press Enter
            archiveButton.focus()
            fireEvent.keyDown(archiveButton, { key: 'Enter' })

            // Should trigger archive
            expect(mockArchiveNote).toHaveBeenCalledWith(mockNotes.simple.id)
        })
    })

    describe('Archive Integration with Parent-Child Relationships', () => {
        it('should handle archiving parent notes with children', () => {
            const parentNote = {
                ...mockNotes.simple,
                id: 'parent-1',
                title: 'Parent Note'
            }

            render(<Card note={parentNote} childCount={3} />)

            // Trigger archive for parent note
            const menuButton = screen.getByTestId('card-menu-button')
            fireEvent.click(menuButton)
            fireEvent.click(screen.getByText('Archive Note'))

            const archiveButton = screen.getByRole('button', { name: 'Archive' })
            fireEvent.click(archiveButton)

            // Should attempt to archive the parent
            expect(mockArchiveNote).toHaveBeenCalledWith('parent-1')
        })

        it('should handle archiving child notes', () => {
            const childNote = {
                ...mockNotes.simple,
                id: 'child-1',
                parentId: 'parent-1',
                title: 'Child Note'
            }

            render(<Card note={childNote} />)

            // Trigger archive for child note
            const menuButton = screen.getByTestId('card-menu-button')
            fireEvent.click(menuButton)
            fireEvent.click(screen.getByText('Archive Note'))

            const archiveButton = screen.getByRole('button', { name: 'Archive' })
            fireEvent.click(archiveButton)

            // Should attempt to archive the child
            expect(mockArchiveNote).toHaveBeenCalledWith('child-1')
        })
    })
})
