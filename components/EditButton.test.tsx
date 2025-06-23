import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '../test/utils'
import { Card } from './Card'
import { mockAnimejs, mockNotes } from '../test/mocks'

// Mock Next.js router - must be done at module level
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

mockAnimejs()

describe('Card Component - Edit Button', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('should render an edit button in the card header', () => {
    render(<Card note={mockNotes.simple} />)
    
    const editButton = screen.getByTestId('edit-button')
    expect(editButton).toBeInTheDocument()
    
    // Should be within the header section
    const header = screen.getByTestId('card-header')
    expect(header).toContainElement(editButton)
  })

  it('should have proper edit button styling and icon', () => {
    render(<Card note={mockNotes.simple} />)
    
    const editButton = screen.getByTestId('edit-button')
    expect(editButton).toHaveClass('bg-gray-400', 'text-white', 'rounded-full')
    expect(editButton).toHaveClass('w-7', 'h-7') // Smaller, subtle floating button
    
    // Should have edit icon
    const editIcon = screen.getByTestId('edit-icon')
    expect(editIcon).toBeInTheDocument()
    expect(editIcon).toHaveClass('w-3', 'h-3')
  })

  it('should navigate to edit page when edit button is clicked', () => {
    render(<Card note={mockNotes.simple} />)
    
    const editButton = screen.getByTestId('edit-button')
    fireEvent.click(editButton)
    
    expect(mockPush).toHaveBeenCalledWith('/note/1?edit=true')
  })

  it('should stop event propagation on edit button click', () => {
    render(<Card note={mockNotes.simple} />)
    
    const editButton = screen.getByTestId('edit-button')
    fireEvent.click(editButton)
    
    // Edit button should work independently
    expect(mockPush).toHaveBeenCalledWith('/note/1?edit=true')
  })

  it('should be accessible with proper ARIA labels', () => {
    render(<Card note={mockNotes.simple} />)
    
    const editButton = screen.getByTestId('edit-button')
    expect(editButton).toHaveAttribute('aria-label', 'Edit note')
    expect(editButton).toHaveAttribute('role', 'button')
  })
})
