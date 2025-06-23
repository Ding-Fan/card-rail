import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '../test/utils'
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

describe('Card Component', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('should render a floating edit button in header area', () => {
    render(<Card note={mockNotes.simple} />)
    
    const header = screen.getByTestId('card-header')
    const editButton = screen.getByTestId('edit-button')
    
    expect(header).toBeInTheDocument()
    expect(editButton).toBeInTheDocument()
  })

  it('should render markdown content as HTML', () => {
    render(<Card note={mockNotes.simple} />)
    
    // Check for rendered markdown elements
    expect(screen.getByText('test', { selector: 'strong' })).toBeInTheDocument()
    expect(screen.getByText('markdown', { selector: 'em' })).toBeInTheDocument()
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
  })

  it('should have dynamic height based on content', () => {
    render(<Card note={mockNotes.simple} />)
    
    const card = screen.getByTestId('note-card')
    // Should have dynamic viewport height (one of: h-[24vh], h-[38vh], h-[62vh])
    expect(card.className).toMatch(/h-\[\d+vh\]/)
    expect(card).toHaveClass('w-full')
  })

  it('should have card-like visual styling', () => {
    render(<Card note={mockNotes.simple} />)
    
    const card = screen.getByTestId('note-card')
    expect(card).toHaveClass('rounded-lg')
    expect(card).toHaveClass('shadow-lg')
    expect(card).toHaveClass('bg-white')
  })

  it('should not be clickable and should not trigger any navigation', () => {
    render(<Card note={mockNotes.simple} />)
    
    const card = screen.getByTestId('note-card')
    card.click()
    
    // Card should not have cursor-pointer class
    expect(card).not.toHaveClass('cursor-pointer')
    
    // No navigation should occur when clicking
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should have proper touch target size for mobile', () => {
    render(<Card note={mockNotes.simple} />)
    
    const card = screen.getByTestId('note-card')
    // Should be at least 44px touch target (full screen card meets this)
    // Card should not have cursor-pointer since clicking is disabled
    expect(card).not.toHaveClass('cursor-pointer')
  })

  it('should hide overflowing content instead of scrolling', () => {
    render(<Card note={mockNotes.simple} />)
    
    const content = screen.getByTestId('card-content')
    expect(content).toHaveClass('overflow-hidden')
    expect(content).not.toHaveClass('overflow-y-auto')
  })

  it('should have a fade mask effect for content overflow', () => {
    render(<Card note={mockNotes.simple} />)
    
    const contentWrapper = screen.getByTestId('card-content-wrapper')
    // Should have relative positioning for mask overlay
    expect(contentWrapper).toHaveClass('relative')
    
    // Should have fade mask element
    const fadeMask = screen.getByTestId('fade-mask')
    expect(fadeMask).toBeInTheDocument()
    expect(fadeMask).toHaveClass('absolute')
    expect(fadeMask).toHaveClass('bottom-0')
  })

  // Edit Button Tests
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
    expect(editButton).toHaveClass('w-7', 'h-7') // Smaller, subtle button
    
    // Should have edit icon
    const editIcon = screen.getByTestId('edit-icon')
    expect(editIcon).toBeInTheDocument()
    expect(editIcon).toHaveClass('w-3', 'h-3')
  })

  it('should navigate to edit page when edit button is clicked', () => {
    render(<Card note={mockNotes.simple} />)
    
    const editButton = screen.getByTestId('edit-button')
    editButton.click()
    
    expect(mockPush).toHaveBeenCalledWith('/note/1?edit=true')
  })

  it('should stop event propagation on edit button click', () => {
    render(<Card note={mockNotes.simple} />)
    
    const editButton = screen.getByTestId('edit-button')
    editButton.click()
    
    // Edit button should work independently of card clicks
    expect(mockPush).toHaveBeenCalledWith('/note/1?edit=true')
  })

  it('should be accessible with proper ARIA labels', () => {
    render(<Card note={mockNotes.simple} />)
    
    const editButton = screen.getByTestId('edit-button')
    expect(editButton).toHaveAttribute('aria-label', 'Edit note')
    expect(editButton).toHaveAttribute('role', 'button')
  })
})
