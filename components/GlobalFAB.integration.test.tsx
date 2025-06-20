import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '../test/utils'
import { GlobalFAB } from './GlobalFAB'

// Mock Next.js router
const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('GlobalFAB User Workflow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('Core User Workflow: Note Creation', () => {
    it('should allow user to click FAB and navigate to note creation', async () => {
      render(<GlobalFAB />)
      
      const fab = screen.getByTestId('draggable-fab')
      expect(fab).toBeInTheDocument()
      expect(fab).toHaveAttribute('aria-label', 'Add new note')
      
      // User clicks FAB to create new note
      await act(async () => {
        fireEvent.click(fab)
      })
      
      // Should navigate to note creation route
      expect(mockPush).toHaveBeenCalledWith('/note/new')
    })

    it('should support custom note creation callback', async () => {
      const customCreateNote = vi.fn()
      
      render(<GlobalFAB onCreateNote={customCreateNote} />)
      
      const fab = screen.getByTestId('draggable-fab')
      
      // User clicks FAB with custom callback
      await act(async () => {
        fireEvent.click(fab)
      })
      
      // Should call custom callback instead of navigation
      expect(customCreateNote).toHaveBeenCalledOnce()
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should maintain consistent FAB design across different pages', () => {
      render(<GlobalFAB />)
      
      const fab = screen.getByTestId('draggable-fab')
      
      // Verify Japanese wall socket design (tall vertical slots)
      const blackRectangles = fab.querySelectorAll('div > div')
      expect(blackRectangles).toHaveLength(2)
      blackRectangles.forEach(rectangle => {
        expect(rectangle).toHaveClass('w-1', 'h-6', 'bg-black', 'rounded-sm')
      })
      
      // Verify FAB styling
      expect(fab).toHaveClass('w-20', 'h-10', 'bg-stone-100', 'rounded-xl')
    })
  })

  describe('Position Persistence Business Logic', () => {
    it('should start at golden spiral position when no saved position exists', () => {
      render(<GlobalFAB />)
      
      const fab = screen.getByTestId('draggable-fab')
      
      // Should be positioned at golden spiral point (right side)
      const leftValue = parseInt(fab.style.left.replace('px', ''))
      const topValue = parseInt(fab.style.top.replace('px', ''))
      
      expect(leftValue).toBeGreaterThan(800) // Should be on right side
      expect(topValue).toBeGreaterThan(100) // Should be positioned vertically
    })

    it('should load and use saved position from localStorage', () => {
      const savedPosition = { x: 250, y: 150 }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedPosition))
      
      render(<GlobalFAB />)
      
      const fab = screen.getByTestId('draggable-fab')
      
      // Should use saved position
      expect(fab.style.left).toBe('250px')
      expect(fab.style.top).toBe('150px')
    })

    it('should handle corrupted localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json-data')
      
      // Should not crash when localStorage contains invalid data
      expect(() => render(<GlobalFAB />)).not.toThrow()
      
      const fab = screen.getByTestId('draggable-fab')
      expect(fab).toBeInTheDocument()
      
      // Should fall back to default position
      const leftValue = parseInt(fab.style.left.replace('px', ''))
      expect(leftValue).toBeGreaterThan(0)
    })
  })

  describe('Responsive Behavior', () => {
    it('should adjust position when window becomes too small', () => {
      const savedPosition = { x: 900, y: 400 }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedPosition))
      
      render(<GlobalFAB />)
      
      // Simulate window resize to smaller viewport
      act(() => {
        Object.defineProperty(window, 'innerWidth', { value: 600, writable: true })
        Object.defineProperty(window, 'innerHeight', { value: 400, writable: true })
        window.dispatchEvent(new Event('resize'))
      })
      
      const fab = screen.getByTestId('draggable-fab')
      
      // Should be constrained within new viewport bounds
      const leftValue = parseInt(fab.style.left.replace('px', ''))
      const maxAllowedX = 600 - 80 - 20 // viewport - fab width - padding
      
      expect(leftValue).toBeLessThanOrEqual(maxAllowedX)
    })
  })

  describe('Accessibility Support', () => {
    it('should be accessible via keyboard navigation', async () => {
      render(<GlobalFAB />)
      
      const fab = screen.getByTestId('draggable-fab')
      
      // Should be focusable
      fab.focus()
      expect(fab).toHaveFocus()
      
      // Should respond to Enter key
      await act(async () => {
        fireEvent.keyDown(fab, { key: 'Enter' })
      })
      
      expect(mockPush).toHaveBeenCalledWith('/note/new')
    })

    it('should respond to Space key activation', async () => {
      render(<GlobalFAB />)
      
      const fab = screen.getByTestId('draggable-fab')
      
      // Should respond to Space key
      await act(async () => {
        fireEvent.keyDown(fab, { key: ' ' })
      })
      
      expect(mockPush).toHaveBeenCalledWith('/note/new')
    })

    it('should have proper accessibility attributes', () => {
      render(<GlobalFAB />)
      
      const fab = screen.getByTestId('draggable-fab')
      
      expect(fab).toHaveAttribute('aria-label', 'Add new note')
      expect(fab).toHaveAttribute('role', 'button')
    })
  })

  describe('Error Handling', () => {
    it('should continue working when localStorage is disabled', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage unavailable')
      })
      
      // Should render without errors even if localStorage fails
      expect(() => render(<GlobalFAB />)).not.toThrow()
      
      const fab = screen.getByTestId('draggable-fab')
      expect(fab).toBeInTheDocument()
      
      // Should still be clickable
      fireEvent.click(fab)
      expect(mockPush).toHaveBeenCalledWith('/note/new')
    })
  })
})
