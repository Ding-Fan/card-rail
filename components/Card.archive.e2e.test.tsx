import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '../test/utils'
import { Card } from './Card'
import { mockAnimejs, mockNotes } from '../test/mocks'
import { Note } from '../lib/types'

// Mock Next.js router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}))

// Mock anime.js
mockAnimejs()

// Create a real-like storage mock that actually persists state
let mockStorageState: Record<string, Note> = {}

const mockStorage = {
    archiveNote: vi.fn((id: string) => {
        if (mockStorageState[id]) {
            mockStorageState[id].isArchived = true
            return true
        }
        return false
    }),
    getNotes: vi.fn(() => mockStorageState),
    getActiveNotes: vi.fn(() =>
        Object.values(mockStorageState).filter((note: Note) => !note.isArchived)
    ),
}

vi.mock('../lib/storage', () => ({
    storage: mockStorage,
}))

describe('Archive End-to-End Workflow', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        // Reset storage state
        mockStorageState = {
            '1': {
                id: '1',
                title: 'Test Note 1',
                content: 'Content 1',
                created_at: '2023-01-01T00:00:00Z',
                updated_at: '2023-01-01T00:00:00Z',
                isArchived: false,
            },
            '2': {
                id: '2',
                title: 'Test Note 2',
                content: 'Content 2',
                created_at: '2023-01-02T00:00:00Z',
                updated_at: '2023-01-02T00:00:00Z',
                isArchived: false,
            }
        }
    })

    describe('Complete Archive User Flow', () => {
        it('should complete full archive workflow from card to confirmation to storage', async () => {
            const onArchived = vi.fn()

            render(<Card note={mockNotes.simple} onArchived={onArchived} />)

            // Step 1: User opens card menu
            const menuButton = screen.getByTestId('card-menu-button')
            expect(menuButton).toBeInTheDocument()
            fireEvent.click(menuButton)

            // Step 2: User sees and clicks archive option
            const archiveOption = screen.getByText('Archive Note')
            expect(archiveOption).toBeInTheDocument()
            fireEvent.click(archiveOption)

            // Step 3: Confirmation bubble appears with note details
            const confirmationTitle = screen.getByText('Archive Note?')
            expect(confirmationTitle).toBeInTheDocument()

            const noteTitle = screen.getByText(/Test Note/)
            expect(noteTitle).toBeInTheDocument()

            // Step 4: User confirms archive action
            const archiveButton = screen.getByRole('button', { name: 'Archive' })
            expect(archiveButton).toBeInTheDocument()
            fireEvent.click(archiveButton)

            // Step 5: Verify all expected actions occurred
            expect(mockStorage.archiveNote).toHaveBeenCalledWith(mockNotes.simple.id)
            expect(onArchived).toHaveBeenCalled()

            // Step 6: Confirmation bubble should disappear
            expect(screen.queryByText('Archive Note?')).not.toBeInTheDocument()
        })

        it('should allow user to cancel archive workflow at any step', async () => {
            const onArchived = vi.fn()

            render(<Card note={mockNotes.simple} onArchived={onArchived} />)

            // Start archive workflow
            const menuButton = screen.getByTestId('card-menu-button')
            fireEvent.click(menuButton)
            fireEvent.click(screen.getByText('Archive Note'))

            // User decides to cancel
            const cancelButton = screen.getByRole('button', { name: 'Cancel' })
            fireEvent.click(cancelButton)

            // Should not archive
            expect(mockStorage.archiveNote).not.toHaveBeenCalled()
            expect(onArchived).not.toHaveBeenCalled()

            // Confirmation should disappear
            expect(screen.queryByText('Archive Note?')).not.toBeInTheDocument()
        })

        it('should handle archive workflow with keyboard navigation', async () => {
            render(<Card note={mockNotes.simple} />)

            // Open menu with keyboard
            const menuButton = screen.getByTestId('card-menu-button')
            menuButton.focus()
            fireEvent.keyDown(menuButton, { key: 'Enter' })

            // Navigate to archive option (assuming it's focusable)
            const archiveOption = screen.getByText('Archive Note')
            fireEvent.click(archiveOption) // In real usage, this would be Enter key

            // Use Escape to cancel
            fireEvent.keyDown(document, { key: 'Escape' })

            // Should close without archiving
            expect(mockStorage.archiveNote).not.toHaveBeenCalled()
            expect(screen.queryByText('Archive Note?')).not.toBeInTheDocument()
        })

        it('should handle archive workflow with touch/mobile gestures', async () => {
            render(<Card note={mockNotes.simple} />)

            // Simulate touch interaction
            const menuButton = screen.getByTestId('card-menu-button')

            // Touch start/end sequence
            fireEvent.touchStart(menuButton)
            fireEvent.touchEnd(menuButton)
            fireEvent.click(menuButton)

            // Touch archive option
            const archiveOption = screen.getByText('Archive Note')
            fireEvent.touchStart(archiveOption)
            fireEvent.touchEnd(archiveOption)
            fireEvent.click(archiveOption)

            // Should show confirmation
            expect(screen.getByText('Archive Note?')).toBeInTheDocument()

            // Touch confirm
            const archiveButton = screen.getByRole('button', { name: 'Archive' })
            fireEvent.touchStart(archiveButton)
            fireEvent.touchEnd(archiveButton)
            fireEvent.click(archiveButton)

            // Should complete archive
            expect(mockStorage.archiveNote).toHaveBeenCalledWith(mockNotes.simple.id)
        })
    })

    describe('Archive State Management', () => {
        it('should maintain state consistency throughout archive workflow', () => {
            const { rerender } = render(<Card note={mockNotes.simple} />)

            // Initial state - note is not archived
            expect(mockStorageState['1'].isArchived).toBe(false)

            // Start archive process
            const menuButton = screen.getByTestId('card-menu-button')
            fireEvent.click(menuButton)
            fireEvent.click(screen.getByText('Archive Note'))

            // State should still be unchanged until confirmation
            expect(mockStorageState['1'].isArchived).toBe(false)

            // Confirm archive
            fireEvent.click(screen.getByRole('button', { name: 'Archive' }))

            // Now state should be updated
            expect(mockStorage.archiveNote).toHaveBeenCalled()

            // Re-render with updated state would show archived note
            const updatedNote = { ...mockNotes.simple, isArchived: true }
            rerender(<Card note={updatedNote} />)

            // Archive option should not be available for archived notes
            fireEvent.click(screen.getByTestId('card-menu-button'))
            expect(screen.queryByText('Archive Note')).not.toBeInTheDocument()
        })

        it('should handle concurrent archive attempts gracefully', async () => {
            const onArchived1 = vi.fn()
            const onArchived2 = vi.fn()

            // Render two instances of the same note
            const { container } = render(
                <div>
                    <Card note={mockNotes.simple} onArchived={onArchived1} />
                    <Card note={mockNotes.simple} onArchived={onArchived2} />
                </div>
            )

            const menuButtons = container.querySelectorAll('[data-testid="card-menu-button"]')

            // Try to archive from both cards simultaneously
            fireEvent.click(menuButtons[0])
            const archiveOptions = screen.getAllByText('Archive Note')
            fireEvent.click(archiveOptions[0])

            fireEvent.click(menuButtons[1])
            fireEvent.click(archiveOptions[1])

            // Confirm both (though only one should succeed in real implementation)
            const archiveButtons = screen.getAllByRole('button', { name: 'Archive' })
            fireEvent.click(archiveButtons[0])
            fireEvent.click(archiveButtons[1])

            // Storage should handle this gracefully
            expect(mockStorage.archiveNote).toHaveBeenCalledTimes(2)
            expect(mockStorage.archiveNote).toHaveBeenCalledWith(mockNotes.simple.id)
        })
    })
})
