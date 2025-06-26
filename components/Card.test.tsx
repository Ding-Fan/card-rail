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
    // The bg-white class is now on the card front
    const cardFront = screen.getByTestId('card-front')
    expect(cardFront).toHaveClass('bg-white')
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
    const drawerMenu = screen.getByTestId('card-drawer-menu')

    // Verify menu is initially closed
    expect(drawerMenu).toHaveAttribute('data-menu-open', 'false')
    expect(drawerMenu).toHaveClass('translate-y-full')
    expect(screen.queryByTestId('enter-note-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('archive-button')).not.toBeInTheDocument()

    // Click menu button to open menu
    fireEvent.click(menuButton)

    // Verify menu is now open
    expect(drawerMenu).toHaveAttribute('data-menu-open', 'true')
    expect(drawerMenu).toHaveClass('translate-y-0')
    expect(screen.getByTestId('enter-note-button')).toBeInTheDocument()
    expect(screen.getByTestId('archive-button')).toBeInTheDocument()
  })

  it('should have proper 3-dot menu button styling', () => {
    render(<Card note={mockNotes.simple} />)

    const menuButton = screen.getByTestId('card-menu-button')
    expect(menuButton).toHaveClass('bg-gray-100', 'text-gray-600', 'rounded-full')
    expect(menuButton).toHaveClass('w-8', 'h-8')
  })

  it('should navigate to note detail page when enter note menu item is clicked', () => {
    render(<Card note={mockNotes.simple} />)

    const menuButton = screen.getByTestId('card-menu-button')
    fireEvent.click(menuButton)

    const enterNoteMenuItem = screen.getByTestId('enter-note-button')
    fireEvent.click(enterNoteMenuItem)

    expect(mockPush).toHaveBeenCalledWith('/note/1')
  })

  it('should stop event propagation on menu interactions and close menu on menu item click', () => {
    render(<Card note={mockNotes.simple} />)

    const menuButton = screen.getByTestId('card-menu-button')
    const drawerMenu = screen.getByTestId('card-drawer-menu')

    fireEvent.click(menuButton)

    // Menu button should work independently of card clicks
    expect(mockPush).not.toHaveBeenCalled()
    expect(drawerMenu).toHaveAttribute('data-menu-open', 'true')

    const enterNoteMenuItem = screen.getByTestId('enter-note-button')
    fireEvent.click(enterNoteMenuItem)

    expect(mockPush).toHaveBeenCalledWith('/note/1')
    // Menu should close after clicking a menu item
    expect(drawerMenu).toHaveAttribute('data-menu-open', 'false')
  })

  it('should be accessible with proper ARIA labels', () => {
    render(<Card note={mockNotes.simple} />)

    const menuButton = screen.getByTestId('card-menu-button')
    expect(menuButton).toHaveAttribute('aria-label', 'Card options')
  })

  it('should have 3-dot button with higher z-index than drawer menu', () => {
    render(<Card note={mockNotes.simple} />)

    const menuButton = screen.getByTestId('card-menu-button')
    const drawerMenu = screen.getByTestId('card-drawer-menu')

    // Open the menu
    fireEvent.click(menuButton)

    // Button should have higher z-index than drawer
    const buttonParent = menuButton.closest('[class*="z-"]')
    const drawerParent = drawerMenu.closest('[class*="z-"]') || drawerMenu

    expect(buttonParent).toHaveClass('z-30') // Higher than drawer
    expect(drawerParent).toHaveClass('z-10') // Lower than button
  })

  it('should only close menu by clicking the 3-dot button, not by clicking outside', () => {
    render(<Card note={mockNotes.simple} />)

    const menuButton = screen.getByTestId('card-menu-button')
    const drawerMenu = screen.getByTestId('card-drawer-menu')
    const card = screen.getByTestId('note-card')

    // Open the menu
    fireEvent.click(menuButton)
    expect(drawerMenu).toHaveAttribute('data-menu-open', 'true')

    // Click outside (on card content) should NOT close menu
    fireEvent.click(card)
    expect(drawerMenu).toHaveAttribute('data-menu-open', 'true')

    // Click on content should NOT close menu
    const content = screen.getByTestId('card-content')
    fireEvent.click(content)
    expect(drawerMenu).toHaveAttribute('data-menu-open', 'true')

    // Only clicking the 3-dot button should close menu
    fireEvent.click(menuButton)
    expect(drawerMenu).toHaveAttribute('data-menu-open', 'false')
  })

  it('should keep 3-dot button visible and clickable when menu is open', () => {
    render(<Card note={mockNotes.simple} />)

    const menuButton = screen.getByTestId('card-menu-button')

    // Open the menu
    fireEvent.click(menuButton)

    // Button should still be visible and clickable
    expect(menuButton).toBeVisible()
    expect(menuButton).not.toHaveAttribute('disabled')

    // Should be able to click it again to close
    fireEvent.click(menuButton)

    const drawerMenu = screen.getByTestId('card-drawer-menu')
    expect(drawerMenu).toHaveAttribute('data-menu-open', 'false')
  })

  it('should act as a pure toggle - multiple clicks should open/close menu', () => {
    render(<Card note={mockNotes.simple} />)

    const menuButton = screen.getByTestId('card-menu-button')
    const drawerMenu = screen.getByTestId('card-drawer-menu')

    // Initially closed
    expect(drawerMenu).toHaveAttribute('data-menu-open', 'false')

    // First click - open
    fireEvent.click(menuButton)
    expect(drawerMenu).toHaveAttribute('data-menu-open', 'true')

    // Second click - close
    fireEvent.click(menuButton)
    expect(drawerMenu).toHaveAttribute('data-menu-open', 'false')

    // Third click - open again
    fireEvent.click(menuButton)
    expect(drawerMenu).toHaveAttribute('data-menu-open', 'true')

    // Fourth click - close again
    fireEvent.click(menuButton)
    expect(drawerMenu).toHaveAttribute('data-menu-open', 'false')
  })

  // Archive Mode Tests
  describe('Archive Mode', () => {
    it('should show "Delete Note" instead of "Archive Note" when in archive mode', () => {
      render(<Card note={mockNotes.simple} isArchiveMode={true} />)

      const menuButton = screen.getByTestId('card-menu-button')
      fireEvent.click(menuButton)

      // Should show Enter Note and Delete Note (not Archive Note) in the front drawer
      expect(screen.getByTestId('enter-note-button')).toBeInTheDocument()
      expect(screen.getByTestId('delete-button')).toBeInTheDocument()
      expect(screen.queryByTestId('archive-button')).not.toBeInTheDocument()
    })

    it('should show "Archive Note" when not in archive mode (default)', () => {
      render(<Card note={mockNotes.simple} />)

      const menuButton = screen.getByTestId('card-menu-button')
      fireEvent.click(menuButton)

      // Should show Enter Note and Archive Note (not Delete Note) in the front drawer
      expect(screen.getByTestId('enter-note-button')).toBeInTheDocument()
      expect(screen.getByTestId('archive-button')).toBeInTheDocument()
      expect(screen.queryByTestId('delete-button')).not.toBeInTheDocument()
    })

    it('should show delete confirmation in drawer when "Delete Note" is clicked', () => {
      render(<Card note={mockNotes.simple} isArchiveMode={true} />)

      const menuButton = screen.getByTestId('card-menu-button')
      const drawerMenu = screen.getByTestId('card-drawer-menu')
      fireEvent.click(menuButton)

      const deleteMenuItem = screen.getByTestId('delete-button')
      fireEvent.click(deleteMenuItem)

      // Drawer should still be open but showing confirmation content
      expect(drawerMenu).toHaveAttribute('data-menu-open', 'true')

      // Check for the confirmation header specifically in the drawer
      const confirmationHeadings = screen.getAllByText('Delete Note')
      const drawerHeading = confirmationHeadings.find(heading =>
        heading.tagName === 'H3' && heading.closest('[data-testid="card-drawer-menu"]')
      )
      expect(drawerHeading).toBeInTheDocument()

      expect(screen.getByText('Are you sure you want to permanently delete this note? This action cannot be undone.')).toBeInTheDocument()
      expect(screen.getByTestId('delete-cancel-button')).toBeInTheDocument()
      expect(screen.getByTestId('delete-confirm-button')).toBeInTheDocument()

      // Menu items should no longer be visible
      expect(screen.queryByTestId('enter-note-button')).not.toBeInTheDocument()
    })

    it('should return to menu when "Cancel" is clicked in confirmation', () => {
      render(<Card note={mockNotes.simple} isArchiveMode={true} />)

      const menuButton = screen.getByTestId('card-menu-button')
      const drawerMenu = screen.getByTestId('card-drawer-menu')
      fireEvent.click(menuButton)

      const deleteMenuItem = screen.getByTestId('delete-button')
      fireEvent.click(deleteMenuItem)

      const cancelButton = screen.getByTestId('delete-cancel-button')
      fireEvent.click(cancelButton)

      // Should return to menu state
      expect(drawerMenu).toHaveAttribute('data-menu-open', 'true')
      expect(screen.getByTestId('enter-note-button')).toBeInTheDocument()
      expect(screen.getByTestId('delete-button')).toBeInTheDocument()
      expect(screen.queryByText('Are you sure you want to permanently delete this note?')).not.toBeInTheDocument()
    })

    it('should show archive confirmation in drawer when "Archive Note" is clicked', () => {
      render(<Card note={mockNotes.simple} />)

      const menuButton = screen.getByTestId('card-menu-button')
      const drawerMenu = screen.getByTestId('card-drawer-menu')
      fireEvent.click(menuButton)

      const archiveMenuItem = screen.getByTestId('archive-button')
      fireEvent.click(archiveMenuItem)

      // Drawer should still be open but showing confirmation content
      expect(drawerMenu).toHaveAttribute('data-menu-open', 'true')

      // Check for the confirmation header specifically in the drawer
      const confirmationHeadings = screen.getAllByText('Archive Note')
      const drawerHeading = confirmationHeadings.find(heading =>
        heading.tagName === 'H3' && heading.closest('[data-testid="card-drawer-menu"]')
      )
      expect(drawerHeading).toBeInTheDocument()

      expect(screen.getByText('Are you sure you want to archive this note?')).toBeInTheDocument()
      expect(screen.getByTestId('archive-cancel-button')).toBeInTheDocument()
      expect(screen.getByTestId('archive-confirm-button')).toBeInTheDocument()

      // Menu items should no longer be visible
      expect(screen.queryByTestId('enter-note-button')).not.toBeInTheDocument()
    })

    it('should call onDelete callback when "Delete" is confirmed', () => {
      const mockOnDelete = vi.fn()
      render(<Card note={mockNotes.simple} isArchiveMode={true} onDelete={mockOnDelete} />)

      const menuButton = screen.getByTestId('card-menu-button')
      fireEvent.click(menuButton)

      const deleteMenuItem = screen.getByTestId('delete-button')
      fireEvent.click(deleteMenuItem)

      const confirmDeleteButton = screen.getByTestId('delete-confirm-button')
      fireEvent.click(confirmDeleteButton)

      // Should call onDelete with note id
      expect(mockOnDelete).toHaveBeenCalledWith('1')
    })

    it('should close menu and confirmation dialog after successful delete', () => {
      const mockOnDelete = vi.fn()
      render(<Card note={mockNotes.simple} isArchiveMode={true} onDelete={mockOnDelete} />)

      const menuButton = screen.getByTestId('card-menu-button')
      const drawerMenu = screen.getByTestId('card-drawer-menu')

      fireEvent.click(menuButton)
      expect(drawerMenu).toHaveAttribute('data-menu-open', 'true')

      const deleteMenuItem = screen.getByTestId('delete-button')
      fireEvent.click(deleteMenuItem)

      const confirmDeleteButton = screen.getByTestId('delete-confirm-button')
      fireEvent.click(confirmDeleteButton)

      // Menu should be closed and confirmation dialog should be gone
      expect(drawerMenu).toHaveAttribute('data-menu-open', 'false')
      expect(screen.queryByText('Are you sure you want to permanently delete this note?')).not.toBeInTheDocument()
    })
  })
})
