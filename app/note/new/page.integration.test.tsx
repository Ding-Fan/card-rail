import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act, screen, fireEvent } from '../../../test/utils'
import Page from './page'
import { createNoteAtom, updateNoteAtom } from '../../../lib/atoms'

// Mock Next.js router
const mockReplace = vi.fn()
const mockPush = vi.fn()
const mockBack = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
    back: mockBack,
  }),
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock Jotai atoms
const mockCreateNote = vi.fn()
const mockUpdateNote = vi.fn()

vi.mock('jotai', async (importOriginal) => {
  const actualJotai = await importOriginal<typeof import('jotai')>()
  return {
    ...actualJotai,
    useAtom: vi.fn((anAtom) => {
      if (anAtom === createNoteAtom) {
        return [null, mockCreateNote]
      }
      if (anAtom === updateNoteAtom) {
        return [null, mockUpdateNote]
      }
      // Fallback for other atoms if needed, or throw an error if unexpected atom is used
      return actualJotai.useAtom(anAtom)
    }),
  }
})

describe('Note Creation Workflow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue('{}')
    mockCreateNote.mockReturnValue('note-12345')
  })

  describe('Deferred Note Creation Workflow', () => {
    it('should show empty editor interface and not create note immediately', async () => {
      render(<Page />)

      // Should show editor interface with placeholder
      const editor = screen.getByTestId('markdown-editor')
      expect(editor).toBeDefined()
      expect(editor.getAttribute('placeholder')).toBe('Start typing to create your note...')

      // Should NOT call createNote immediately
      expect(mockCreateNote).not.toHaveBeenCalled()

      // Should NOT redirect immediately
      expect(mockReplace).not.toHaveBeenCalled()
    })

    it('should create note with timestamp header on first keystroke', async () => {
      const mockDate = new Date('2025-06-20T15:30:00Z')
      vi.setSystemTime(mockDate)

      render(<Page />)

      const editor = screen.getByTestId('markdown-editor')

      await act(async () => {
        // Type first character
        fireEvent.change(editor, { target: { value: 'H' } })
      })

      // Should call createNote on first keystroke
      expect(mockCreateNote).toHaveBeenCalledOnce()

      // Get the expected timestamp format that will actually be generated
      const expectedTimestamp = mockDate.toLocaleString()

      // Should update note with timestamp header + user content
      expect(mockUpdateNote).toHaveBeenCalledWith({
        id: 'note-12345',
        updates: {
          content: `# ${expectedTimestamp}\n\nH`,
          title: expectedTimestamp,
        },
      })

      vi.useRealTimers()
    })

    it('should stay on /note/new route after note creation', async () => {
      render(<Page />)

      const editor = screen.getByTestId('markdown-editor')

      await act(async () => {
        fireEvent.change(editor, { target: { value: 'Hello world' } })
      })

      // Should NOT redirect after note creation
      expect(mockReplace).not.toHaveBeenCalled()
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should handle note creation failure gracefully', async () => {
      mockCreateNote.mockReturnValue('') // Simulate failure

      render(<Page />)

      const editor = screen.getByTestId('markdown-editor')

      await act(async () => {
        fireEvent.change(editor, { target: { value: 'H' } })
      })

      expect(mockCreateNote).toHaveBeenCalledOnce()
      // Should not call updateNote if creation fails
      expect(mockUpdateNote).not.toHaveBeenCalled()
    })
  })

  describe('Navigation and UI', () => {
    it('should handle back navigation without smart deletion', async () => {
      render(<Page />)

      const backButton = screen.getByTestId('back-button')

      await act(async () => {
        fireEvent.click(backButton)
      })

      // Should navigate back
      expect(mockBack).toHaveBeenCalledOnce()

      // Should NOT attempt to delete any notes
      expect(mockCreateNote).not.toHaveBeenCalled()
    })

    it('should toggle between edit and view modes', async () => {
      render(<Page />)

      const toggle = screen.getByTestId('view-edit-toggle')

      // Should start in edit mode
      expect(toggle.getAttribute('data-state')).toBe('checked')

      await act(async () => {
        fireEvent.click(toggle)
      })

      // Should switch to view mode
      expect(toggle.getAttribute('data-state')).toBe('unchecked')
    })
  })

  describe('Edge Cases', () => {
    it('should work when localStorage is disabled', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage disabled')
      })

      expect(() => render(<Page />)).not.toThrow()

      // Should show editor interface
      const editor = screen.getByTestId('markdown-editor')
      expect(editor).toBeDefined()
    })
  })
})
