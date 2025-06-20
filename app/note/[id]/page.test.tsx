import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '../../../test/utils'
import NoteClient from './NoteClient'

// Mock Next.js router
const mockPush = vi.fn()
const mockBack = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}))

// Mock useNotes hook
const mockUpdateNote = vi.fn()
const mockDeleteNote = vi.fn()
const mockHasUserContent = vi.fn()

vi.mock('../../../lib/useNotes', () => ({
  useNotes: () => ({
    updateNote: mockUpdateNote,
    deleteNote: mockDeleteNote,
    hasUserContent: mockHasUserContent,
    notes: [],
    isLoading: false,
    refreshNotes: vi.fn(),
    createNote: vi.fn(),
  }),
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => '{}'),
  setItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Test note data
const mockNote = {
  id: '1',
  title: 'Test Note',
  content: '# Test Note\n\nThis is test content.',
  created_at: '2025-06-16T10:00:00Z',
  updated_at: '2025-06-16T10:00:00Z',
}

describe('Note Detail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue('{}')
    mockHasUserContent.mockReturnValue(true)
  })

  it('should render note title and content', () => {
    render(<NoteClient note={mockNote} noteId="1" />)
    
    // Check for the main title by class (3xl vs 2xl in markdown content)
    const mainTitles = screen.getAllByText('Test Note')
    expect(mainTitles.length).toBe(2) // One main title, one in markdown
    expect(screen.getByText('This is test content.')).toBeInTheDocument()
  })

  it('should render back button', () => {
    render(<NoteClient note={mockNote} noteId="1" />)
    
    const backButton = screen.getByTestId('back-button')
    expect(backButton).toBeInTheDocument()
    expect(backButton).toHaveAttribute('aria-label', 'Go back')
  })

  it('should render view/edit toggle switch', () => {
    render(<NoteClient note={mockNote} noteId="1" />)
    
    const editToggle = screen.getByTestId('view-edit-toggle')
    expect(editToggle).toBeInTheDocument()
    expect(editToggle).toHaveAttribute('role', 'switch')
    
    // Should show "View" and "Edit" labels
    expect(screen.getByText('View')).toBeInTheDocument()
    expect(screen.getByText('Edit')).toBeInTheDocument()
  })

  it('should show markdown editor when toggle is switched to edit mode', async () => {
    render(<NoteClient note={mockNote} noteId="1" />)
    
    const editToggle = screen.getByTestId('view-edit-toggle')
    
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
    
    const backButton = screen.getByTestId('back-button')
    fireEvent.click(backButton)
    
    expect(mockBack).toHaveBeenCalled()
  })

  it('should auto-save content changes', async () => {
    vi.useFakeTimers()
    
    render(<NoteClient note={mockNote} noteId="1" />)
    
    const editToggle = screen.getByTestId('view-edit-toggle')
    
    // Switch to edit mode
    await act(async () => {
      fireEvent.click(editToggle)
    })
    
    const editor = screen.getByTestId('markdown-editor')
    
    // Change content
    await act(async () => {
      fireEvent.change(editor, { target: { value: '# Updated Note\n\nUpdated content.' } })
    })
    
    // Fast-forward time to trigger auto-save
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    
    // Should have called updateNote from useNotes hook
    expect(mockUpdateNote).toHaveBeenCalledWith('1', {
      content: '# Updated Note\n\nUpdated content.',
      title: 'Updated Note'
    })
    
    vi.useRealTimers()
  })
})
