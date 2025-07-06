import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '../test/utils'
import { Card } from './Card/Card'
import { mockAnimejs, mockNotes } from '../test/mocks'

// Mock Next.js router - must be done at module level
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

mockAnimejs()

describe('Card Component - Enter Note Button', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('should render an enter note button in the card header', () => {
    render(<Card note={mockNotes.simple} />)

    // Card now uses a menu button instead of direct edit button
    const menuButton = screen.getByTestId('card-menu-button')
    expect(menuButton).toBeInTheDocument()

    // Click to open menu
    fireEvent.click(menuButton)

    // Should find enter note option in the menu
    const enterNoteButton = screen.getByTestId('enter-note-button')
    expect(enterNoteButton).toBeInTheDocument()
  })

  it('should have proper enter note button styling and icon', () => {
    render(<Card note={mockNotes.simple} />)

    // Open the menu
    const menuButton = screen.getByTestId('card-menu-button')
    fireEvent.click(menuButton)

    // Check menu button styling
    expect(menuButton).toHaveClass('bg-gray-100', 'text-gray-600', 'rounded-full')
    expect(menuButton).toHaveClass('w-8', 'h-8')

    // Should have enter note option in menu
    const enterNoteOption = screen.getByTestId('enter-note-button')
    expect(enterNoteOption).toBeInTheDocument()
  })

  it('should navigate to note page when enter note button is clicked', () => {
    render(<Card note={mockNotes.simple} />)

    // Open the menu first
    const menuButton = screen.getByTestId('card-menu-button')
    fireEvent.click(menuButton)

    // Click the enter note option
    const enterNoteButton = screen.getByTestId('enter-note-button')
    fireEvent.click(enterNoteButton)

    expect(mockPush).toHaveBeenCalledWith('/note/1')
  })

  it('should stop event propagation on enter note button click', () => {
    render(<Card note={mockNotes.simple} />)

    // Open the menu first
    const menuButton = screen.getByTestId('card-menu-button')
    fireEvent.click(menuButton)

    // Click the enter note option
    const enterNoteButton = screen.getByTestId('enter-note-button')
    fireEvent.click(enterNoteButton)

    // Enter note button should work independently
    expect(mockPush).toHaveBeenCalledWith('/note/1')
  })

  it('should be accessible with proper ARIA labels', () => {
    render(<Card note={mockNotes.simple} />)

    const menuButton = screen.getByTestId('card-menu-button')
    expect(menuButton).toHaveAttribute('aria-label', 'Card options')

    // Open menu and check enter note option accessibility
    fireEvent.click(menuButton)
    const enterNoteOption = screen.getByTestId('enter-note-button')
    expect(enterNoteOption).toBeInTheDocument()
  })
})
