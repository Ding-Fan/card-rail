import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '../../test/utils'
import React from 'react'
import { GlobalFAB } from './GlobalFAB'
import { FABProvider, useFAB } from './FABContext'
import { createLocalStorageMock } from '../../test/mocks'

// Mock Next.js router - must be done at module level
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

const localStorageMock = createLocalStorageMock()

// Helper to render GlobalFAB with required context
const renderGlobalFAB = (props = {}) => {
  return render(
    <FABProvider>
      <GlobalFAB {...props} />
    </FABProvider>
  )
}

describe('GlobalFAB User Workflow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('Core User Workflow: Note Creation', () => {
    it('should allow user to click FAB and navigate to note creation', async () => {
      renderGlobalFAB()

      const fab = screen.getByTestId('draggable-fab')
      expect(fab).toBeInTheDocument()
      expect(fab).toHaveAttribute('aria-label', 'Floating action menu')

      // User clicks FAB to open dropdown
      await act(async () => {
        fireEvent.click(fab)
      })

      // Should show dropdown with "Add Note" option
      const addNoteOption = await screen.findByText('Add Note')
      expect(addNoteOption).toBeInTheDocument()

      // User clicks "Add Note" option
      await act(async () => {
        fireEvent.click(addNoteOption)
      })

      // Should navigate to note creation route
      expect(mockPush).toHaveBeenCalledWith('/note/new')
    })

    it('should support custom note creation callback', async () => {
      const customCreateNote = vi.fn()

      // Create a test component that sets the custom handler
      const TestComponent = () => {
        const { setCreateNoteHandler } = useFAB()
        React.useEffect(() => {
          setCreateNoteHandler(customCreateNote)
        }, [setCreateNoteHandler])
        return null
      }

      render(
        <FABProvider>
          <TestComponent />
          <GlobalFAB />
        </FABProvider>
      )

      const fab = screen.getByTestId('draggable-fab')

      // User clicks FAB to open dropdown
      await act(async () => {
        fireEvent.click(fab)
      })

      // Should show dropdown with "Add Note" option
      const addNoteOption = await screen.findByText('Add Note')

      // User clicks "Add Note" option
      await act(async () => {
        fireEvent.click(addNoteOption)
      })

      // Should call custom callback instead of navigation
      expect(customCreateNote).toHaveBeenCalledOnce()
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should maintain consistent FAB design across different pages', () => {
      renderGlobalFAB()

      const fab = screen.getByTestId('draggable-fab')

      // Verify Japanese wall socket design (tall vertical slots)
      const blackRectangles = fab.querySelectorAll('div > div')
      expect(blackRectangles).toHaveLength(2)
      blackRectangles.forEach((rectangle: Element) => {
        expect(rectangle).toHaveClass('w-1', 'h-6', 'bg-black', 'rounded-sm')
      })

      // Verify FAB styling
      expect(fab).toHaveClass('w-20', 'h-10', 'bg-stone-100/80', 'rounded-xl')
    })
  })

  describe('Position Persistence Business Logic', () => {
    it('should start at golden spiral position when no saved position exists', () => {
      // Set up realistic viewport dimensions
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true })
      Object.defineProperty(window, 'innerHeight', { value: 768, writable: true })

      renderGlobalFAB()

      const fab = screen.getByTestId('draggable-fab')

      // Should be positioned at top-right corner
      const leftValue = parseInt(fab.style.left.replace('px', ''))
      const topValue = parseInt(fab.style.top.replace('px', ''))

      // With viewport 1024x768, expected position should be:
      // x = 1024 - 80 - 20 = 924 (right side with padding)
      // y = 20 (top with padding)
      expect(leftValue).toBeGreaterThan(800) // Should be on right side
      expect(topValue).toBeLessThan(50) // Should be at top with padding
    })

    it('should load and use saved position from localStorage', () => {
      const savedPosition = { x: 250, y: 150 }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedPosition))

      renderGlobalFAB()

      const fab = screen.getByTestId('draggable-fab')

      // Should use saved position
      expect(fab.style.left).toBe('250px')
      expect(fab.style.top).toBe('150px')
    })

    it('should handle corrupted localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json-data')

      // Should not crash when localStorage contains invalid data
      expect(() => renderGlobalFAB()).not.toThrow()

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

      renderGlobalFAB()

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
      renderGlobalFAB()

      const fab = screen.getByTestId('draggable-fab')

      // Should be focusable
      fab.focus()
      expect(fab).toHaveFocus()

      // Should respond to Enter key
      await act(async () => {
        fireEvent.keyDown(fab, { key: 'Enter' })
      })

      // Should show dropdown
      const addNoteOption = await screen.findByText('Add Note')
      expect(addNoteOption).toBeInTheDocument()
    })

    it('should respond to Space key activation', async () => {
      renderGlobalFAB()

      const fab = screen.getByTestId('draggable-fab')

      // Should respond to Space key
      await act(async () => {
        fireEvent.keyDown(fab, { key: ' ' })
      })

      // Should show dropdown
      const addNoteOption = await screen.findByText('Add Note')
      expect(addNoteOption).toBeInTheDocument()
    })

    it('should have proper accessibility attributes', () => {
      renderGlobalFAB()

      const fab = screen.getByTestId('draggable-fab')

      expect(fab).toHaveAttribute('aria-label', 'Floating action menu')
      expect(fab).toHaveAttribute('role', 'button')
    })
  })

  describe('Error Handling', () => {
    it('should continue working when localStorage is disabled', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage unavailable')
      })

      // Should render without errors even if localStorage fails
      expect(() => renderGlobalFAB()).not.toThrow()

      const fab = screen.getByTestId('draggable-fab')
      expect(fab).toBeInTheDocument()

      // Should still be clickable
      await act(async () => {
        fireEvent.click(fab)
      })

      // Should show dropdown
      const addNoteOption = await screen.findByText('Add Note')
      expect(addNoteOption).toBeInTheDocument()
    })
  })
})
