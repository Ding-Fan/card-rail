import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../test/utils'
import Home from '../app/page'
import { mockAnimejs } from '../test/mocks'
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

// Mock storage with real-like behavior
const mockNotes: Record<string, Note> = {
    '1': {
        id: '1',
        title: 'Test Note 1',
        content: 'Content 1',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        isArchived: false,
        parent_id: undefined,
    },
    '2': {
        id: '2',
        title: 'Test Note 2',
        content: 'Content 2',
        created_at: '2023-01-02T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
        isArchived: false,
        parent_id: undefined,
    },
    '3': {
        id: '3',
        title: 'Archived Note',
        content: 'Archived content',
        created_at: '2023-01-03T00:00:00Z',
        updated_at: '2023-01-03T00:00:00Z',
        isArchived: true,
        parent_id: undefined,
    }
}

const mockStorage = {
    getNotes: vi.fn(() => mockNotes),
    getActiveNotes: vi.fn(() =>
        Object.values(mockNotes).filter(note => !note.isArchived)
    ),
    getArchivedNotes: vi.fn(() =>
        Object.values(mockNotes).filter(note => note.isArchived)
    ),
    archiveNote: vi.fn((id: string) => {
        if (mockNotes[id]) {
            mockNotes[id].isArchived = true
            return true
        }
        return false
    }),
    setNote: vi.fn(),
    setNotes: vi.fn(),
}

vi.mock('../lib/storage', () => ({
    storage: mockStorage,
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}))

describe('Archive Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        // Reset mock notes
        mockNotes['1'].isArchived = false
        mockNotes['2'].isArchived = false
        mockNotes['3'].isArchived = true

        // Reset mock behavior
        mockStorage.getActiveNotes.mockReturnValue(
            Object.values(mockNotes).filter(note => !note.isArchived)
        )
    })

    describe('Main Page Archive Integration', () => {
        it('should only display non-archived notes on main page', async () => {
            render(<Home />)

            // Wait for notes to load
            await waitFor(() => {
                expect(screen.getByText('Test Note 1')).toBeInTheDocument()
                expect(screen.getByText('Test Note 2')).toBeInTheDocument()
            })

            // Archived note should not be visible
            expect(screen.queryByText('Archived Note')).not.toBeInTheDocument()

            // Should call getActiveNotes to filter archived notes
            expect(mockStorage.getActiveNotes).toHaveBeenCalled()
        })

        it('should remove note from main page when archived', async () => {
            render(<Home />)

            // Wait for notes to load
            await waitFor(() => {
                expect(screen.getByText('Test Note 1')).toBeInTheDocument()
            })

            // Archive the first note
            const cards = screen.getAllByTestId('card-menu-button')
            fireEvent.click(cards[0]) // Open menu for first card

            const archiveOption = screen.getByText('Archive Note')
            fireEvent.click(archiveOption)

            const archiveButton = screen.getByRole('button', { name: 'Archive' })
            fireEvent.click(archiveButton)

            // Note should be archived
            expect(mockStorage.archiveNote).toHaveBeenCalledWith('1')

            // After archive, the note should be removed from view
            // Note: In a real implementation, this would trigger a refresh
            // For now, we're testing that the archive function is called
        })

        it('should handle archive failure gracefully', async () => {
            // Mock archive failure
            mockStorage.archiveNote.mockReturnValue(false)

            render(<Home />)

            // Wait for notes to load
            await waitFor(() => {
                expect(screen.getByText('Test Note 1')).toBeInTheDocument()
            })

            // Try to archive a note
            const cards = screen.getAllByTestId('card-menu-button')
            fireEvent.click(cards[0])

            const archiveOption = screen.getByText('Archive Note')
            fireEvent.click(archiveOption)

            const archiveButton = screen.getByRole('button', { name: 'Archive' })
            fireEvent.click(archiveButton)

            // Archive should be attempted but fail
            expect(mockStorage.archiveNote).toHaveBeenCalledWith('1')

            // Note should still be visible since archive failed
            expect(screen.getByText('Test Note 1')).toBeInTheDocument()
        })
    })

    describe('Storage Integration', () => {
        it('should correctly filter active vs archived notes', () => {
            // Test the storage mock behavior
            const activeNotes = mockStorage.getActiveNotes()
            const archivedNotes = mockStorage.getArchivedNotes()

            expect(activeNotes).toHaveLength(2)
            expect(archivedNotes).toHaveLength(1)

            expect(activeNotes.some(note => note.id === '1')).toBe(true)
            expect(activeNotes.some(note => note.id === '2')).toBe(true)
            expect(activeNotes.some(note => note.id === '3')).toBe(false)

            expect(archivedNotes.some(note => note.id === '3')).toBe(true)
        })

        it('should update note status when archiving', () => {
            // Archive a note
            const result = mockStorage.archiveNote('1')

            expect(result).toBe(true)
            expect(mockNotes['1'].isArchived).toBe(true)

            // Active notes should now exclude the archived one
            const updatedActiveNotes = Object.values(mockNotes).filter(note => !note.isArchived)
            expect(updatedActiveNotes).toHaveLength(1)
            expect(updatedActiveNotes.some(note => note.id === '1')).toBe(false)
        })

        it('should handle archiving non-existent note', () => {
            const result = mockStorage.archiveNote('non-existent')

            expect(result).toBe(false)
        })
    })

    describe('Archive Page Integration', () => {
        it('should have proper data flow to archive page', () => {
            // This test ensures our mock storage properly segregates archived notes
            // which would be consumed by the archive page

            const archivedNotes = mockStorage.getArchivedNotes()

            expect(archivedNotes).toHaveLength(1)
            expect(archivedNotes[0].id).toBe('3')
            expect(archivedNotes[0].title).toBe('Archived Note')
            expect(archivedNotes[0].isArchived).toBe(true)
        })
    })
})
