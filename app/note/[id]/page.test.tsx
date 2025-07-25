import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '../../../test/utils'
import NoteClient from './NoteClient'
import { createMockNote } from '../../../test/mocks'

// Mock Next.js router - must be done at module level
const mockBack = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: mockBack,
  }),
}))

// Mock Jotai atoms
const mockUpdateNote = vi.fn()
const mockCreateNote = vi.fn()

vi.mock('../../../lib/atoms', () => ({
  updateNoteAtom: [null, mockUpdateNote],
  createNoteAtom: [null, mockCreateNote],
  getChildNotesAtom: () => () => [],
  canCreateSubnoteAtom: () => true,
  getNestingLevelAtom: () => () => ({ level: 0, path: ['1'] }),
  getNoteByIdAtom: () => () => null,
}))

// Mock FAB context
vi.mock('../../../components/FAB/FABContext', () => ({
  useFAB: () => ({
    setCreateSubnoteHandler: vi.fn(),
    setIsInNoteView: vi.fn(),
  }),
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => '{}'),
  setItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Test note data
const mockNote = createMockNote({
  id: '1',
  title: 'Test Note',
  content: '# Test Note\n\nThis is test content.',
  created_at: '2025-06-16T10:00:00Z',
  updated_at: '2025-06-16T10:00:00Z',
})

describe('Note Detail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue('{}')
  })

  it('should render note title and content', () => {
    render(<NoteClient note={mockNote} noteId="1" />)

    // Check for the main title and content
    expect(screen.getByTestId('note-title')).toBeInTheDocument()
    expect(screen.getByText('This is test content.')).toBeInTheDocument()
  })

  it('should render back button', () => {
    render(<NoteClient note={mockNote} noteId="1" />)

    const backButton = screen.getByLabelText('Go back')
    expect(backButton).toBeInTheDocument()
  })

  it('should render view/edit toggle switch', () => {
    render(<NoteClient note={mockNote} noteId="1" />)

    const editToggle = screen.getByRole('switch')
    expect(editToggle).toBeInTheDocument()

    // Should show "View" and "Edit" labels
    expect(screen.getByText('View')).toBeInTheDocument()
    expect(screen.getByText('Edit')).toBeInTheDocument()
  })

  it('should show markdown editor when toggle is switched to edit mode', async () => {
    render(<NoteClient note={mockNote} noteId="1" />)

    const editToggle = screen.getByRole('switch')

    // Initially should be in view mode
    expect(screen.queryByTestId('markdown-editor')).not.toBeInTheDocument()

    // Switch to edit mode
    await act(async () => {
      fireEvent.click(editToggle)
    })

    // Should now show the markdown editor
    expect(screen.getByTestId('markdown-editor')).toBeInTheDocument()
  })

  it('should show save status indicator', () => {
    render(<NoteClient note={mockNote} noteId="1" />)

    // Should show "Saved" status by default
    expect(screen.getByText('Saved')).toBeInTheDocument()
  })

  it('should navigate back when back button is clicked', () => {
    render(<NoteClient note={mockNote} noteId="1" />)

    const backButton = screen.getByLabelText('Go back')
    fireEvent.click(backButton)

    expect(mockBack).toHaveBeenCalled()
  })

  it('should auto-save content changes', async () => {
    vi.useFakeTimers()

    render(<NoteClient note={mockNote} noteId="1" />)

    const editToggle = screen.getByRole('switch')

    // Switch to edit mode
    await act(async () => {
      fireEvent.click(editToggle)
    })

    const editor = screen.getByTestId('markdown-editor')

    // Change content
    await act(async () => {
      fireEvent.change(editor, { target: { value: '# Updated Note\n\nUpdated content.' } })
    })

    // Fast-forward time to trigger auto-save (component uses 500ms timeout)
    act(() => {
      vi.advanceTimersByTime(500)
    })

    // Should have called updateNote from Jotai atom
    expect(mockUpdateNote).toHaveBeenCalledWith({
      id: '1',
      updates: {
        content: '# Updated Note\n\nUpdated content.',
        title: 'Updated Note'
      }
    })

    vi.useRealTimers()
  })
})
