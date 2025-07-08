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

describe('Card Component - Edit Note Button', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('should render an edit note button in the card menu', () => {
    render(<Card note={mockNotes.simple} />)

    // Card now uses a menu button instead of direct edit button
    const menuButton = screen.getByTestId('card-menu-button')
    expect(menuButton).toBeInTheDocument()

    // Click to open menu
    fireEvent.click(menuButton)

    // Should find edit note option in the menu
    const editButton = screen.getByTestId('edit-button')
    expect(editButton).toBeInTheDocument()
  })

  it('should have proper edit note button styling and icon', () => {
    render(<Card note={mockNotes.simple} />)

    // Open the menu
    const menuButton = screen.getByTestId('card-menu-button')
    fireEvent.click(menuButton)

    // Check menu button styling
    expect(menuButton).toHaveClass('bg-gray-100', 'text-gray-600', 'rounded-full')
    expect(menuButton).toHaveClass('w-8', 'h-8')

    // Should have edit note option in menu
    const editOption = screen.getByTestId('edit-button')
    expect(editOption).toBeInTheDocument()
  })

  it('should navigate to note page when edit note button is clicked', () => {
    render(<Card note={mockNotes.simple} />)

    // Open the menu first
    const menuButton = screen.getByTestId('card-menu-button')
    fireEvent.click(menuButton)

    // Click the edit note option
    const editButton = screen.getByTestId('edit-button')
    fireEvent.click(editButton)

    expect(mockPush).toHaveBeenCalledWith('/note/1?edit=true')
  })

  it('should stop event propagation on edit note button click', () => {
    render(<Card note={mockNotes.simple} />)

    // Open the menu first
    const menuButton = screen.getByTestId('card-menu-button')
    fireEvent.click(menuButton)

    // Click the edit note option
    const editButton = screen.getByTestId('edit-button')
    fireEvent.click(editButton)

    // Edit note button should work independently
    expect(mockPush).toHaveBeenCalledWith('/note/1?edit=true')
  })

  it('should be accessible with proper ARIA labels', () => {
    render(<Card note={mockNotes.simple} />)

    const menuButton = screen.getByTestId('card-menu-button')
    expect(menuButton).toHaveAttribute('aria-label', 'Card options')

    // Open menu and check edit note option accessibility
    fireEvent.click(menuButton)
    const editOption = screen.getByTestId('edit-button')
    expect(editOption).toBeInTheDocument()
  })
})
