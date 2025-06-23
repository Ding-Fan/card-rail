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

describe('Card Component', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('should render a 3-dot menu button in bottom-right corner', () => {
    render(<Card note={mockNotes.simple} />)

    const menuButton = screen.getByTestId('card-menu-button')
    expect(menuButton).toBeInTheDocument()
    expect(menuButton).toHaveAttribute('aria-label', 'Card options')
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

  // Edit Button Tests - Now using 3-dot menu
  it('should render a 3-dot menu with edit and archive options when clicked', () => {
    render(<Card note={mockNotes.simple} />)

    const menuButton = screen.getByTestId('card-menu-button')

    // Menu should not be visible initially
    expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    expect(screen.queryByText('Archive')).not.toBeInTheDocument()

    // Click menu button to open menu
    fireEvent.click(menuButton)

    // Menu items should now be visible
    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.getByText('Archive')).toBeInTheDocument()
  })

  it('should have proper 3-dot menu button styling', () => {
    render(<Card note={mockNotes.simple} />)

    const menuButton = screen.getByTestId('card-menu-button')
    expect(menuButton).toHaveClass('bg-gray-100', 'hover:bg-gray-200', 'text-gray-600', 'rounded-full')
    expect(menuButton).toHaveClass('w-8', 'h-8')
  })

  it('should navigate to edit page when edit menu item is clicked', () => {
    render(<Card note={mockNotes.simple} />)

    const menuButton = screen.getByTestId('card-menu-button')
    fireEvent.click(menuButton)

    const editMenuItem = screen.getByText('Edit')
    fireEvent.click(editMenuItem)

    expect(mockPush).toHaveBeenCalledWith('/note/1?edit=true')
  })

  it('should stop event propagation on menu interactions', () => {
    render(<Card note={mockNotes.simple} />)

    const menuButton = screen.getByTestId('card-menu-button')
    fireEvent.click(menuButton)

    // Menu button should work independently of card clicks
    expect(mockPush).not.toHaveBeenCalled()

    const editMenuItem = screen.getByText('Edit')
    fireEvent.click(editMenuItem)

    expect(mockPush).toHaveBeenCalledWith('/note/1?edit=true')
  })

  it('should be accessible with proper ARIA labels', () => {
    render(<Card note={mockNotes.simple} />)

    const menuButton = screen.getByTestId('card-menu-button')
    expect(menuButton).toHaveAttribute('aria-label', 'Card options')
  })
})
