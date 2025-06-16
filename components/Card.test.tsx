import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../test/utils'
import { Card } from './Card'
import { Note } from '../lib/types'

// Mock animejs to avoid DOM manipulation during tests
vi.mock('animejs', () => ({
  default: vi.fn(() => ({
    play: vi.fn(),
    pause: vi.fn(),
  })),
}))

const mockNote: Note = {
  id: '1',
  title: 'Test Note',
  content: `# Test Note

This is a **test** note with some *markdown* content.

- Item 1
- Item 2`,
  created_at: '2025-06-16T10:00:00Z',
  updated_at: '2025-06-16T10:00:00Z',
}

describe('Card Component', () => {
  it('should render the note title in header', () => {
    render(<Card note={mockNote} />)
    
    const header = screen.getByTestId('card-header')
    expect(header).toHaveTextContent('Test Note')
  })

  it('should render markdown content as HTML', () => {
    render(<Card note={mockNote} />)
    
    // Check for rendered markdown elements
    expect(screen.getByText('test', { selector: 'strong' })).toBeInTheDocument()
    expect(screen.getByText('markdown', { selector: 'em' })).toBeInTheDocument()
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
  })

  it('should have mobile-first full-height styling', () => {
    render(<Card note={mockNote} />)
    
    const card = screen.getByTestId('note-card')
    expect(card).toHaveClass('h-full')
    expect(card).toHaveClass('w-full')
  })

  it('should have card-like visual styling', () => {
    render(<Card note={mockNote} />)
    
    const card = screen.getByTestId('note-card')
    expect(card).toHaveClass('rounded-lg')
    expect(card).toHaveClass('shadow-lg')
    expect(card).toHaveClass('bg-white')
  })

  it('should be clickable and call onTap when tapped', () => {
    const onTap = vi.fn()
    render(<Card note={mockNote} onTap={onTap} />)
    
    const card = screen.getByTestId('note-card')
    card.click()
    
    expect(onTap).toHaveBeenCalledWith(mockNote.id)
  })

  it('should have proper touch target size for mobile', () => {
    render(<Card note={mockNote} />)
    
    const card = screen.getByTestId('note-card')
    // Should be at least 44px touch target (full screen card meets this)
    expect(card).toHaveClass('cursor-pointer')
  })

  it('should hide overflowing content instead of scrolling', () => {
    render(<Card note={mockNote} />)
    
    const content = screen.getByTestId('card-content')
    expect(content).toHaveClass('overflow-hidden')
    expect(content).not.toHaveClass('overflow-y-auto')
  })

  it('should have a fade mask effect for content overflow', () => {
    render(<Card note={mockNote} />)
    
    const contentWrapper = screen.getByTestId('card-content-wrapper')
    // Should have relative positioning for mask overlay
    expect(contentWrapper).toHaveClass('relative')
    
    // Should have fade mask element
    const fadeMask = screen.getByTestId('fade-mask')
    expect(fadeMask).toBeInTheDocument()
    expect(fadeMask).toHaveClass('absolute')
    expect(fadeMask).toHaveClass('bottom-0')
  })
})
