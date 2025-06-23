import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '../test/utils'
import { Card } from './Card'
import { Note } from '../lib/types'

// Mock Next.js router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

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

describe('Card Component - Edit Button', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('should render an edit button in the card header', () => {
    render(<Card note={mockNote} />)
    
    const editButton = screen.getByTestId('edit-button')
    expect(editButton).toBeInTheDocument()
    
    // Should be within the header section
    const header = screen.getByTestId('card-header')
    expect(header).toContainElement(editButton)
  })

  it('should have proper edit button styling and icon', () => {
    render(<Card note={mockNote} />)
    
    const editButton = screen.getByTestId('edit-button')
    expect(editButton).toHaveClass('bg-gray-400', 'text-white', 'rounded-full')
    expect(editButton).toHaveClass('w-7', 'h-7') // Smaller, subtle floating button
    
    // Should have edit icon
    const editIcon = screen.getByTestId('edit-icon')
    expect(editIcon).toBeInTheDocument()
    expect(editIcon).toHaveClass('w-3', 'h-3')
  })

  it('should navigate to edit page when edit button is clicked', () => {
    render(<Card note={mockNote} />)
    
    const editButton = screen.getByTestId('edit-button')
    fireEvent.click(editButton)
    
    expect(mockPush).toHaveBeenCalledWith('/note/1?edit=true')
  })

  it('should stop event propagation on edit button click', () => {
    const onTap = vi.fn()
    render(<Card note={mockNote} onTap={onTap} />)
    
    const editButton = screen.getByTestId('edit-button')
    fireEvent.click(editButton)
    
    // Card onTap should not be called when edit button is clicked
    expect(onTap).not.toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/note/1?edit=true')
  })

  it('should be accessible with proper ARIA labels', () => {
    render(<Card note={mockNote} />)
    
    const editButton = screen.getByTestId('edit-button')
    expect(editButton).toHaveAttribute('aria-label', 'Edit note')
    expect(editButton).toHaveAttribute('role', 'button')
  })
})
