import { vi } from 'vitest'
import { Note } from '../lib/types'

// Centralized Next.js router mock
export const createRouterMock = () => {
  const mockPush = vi.fn()
  const mockBack = vi.fn()
  const mockReplace = vi.fn()
  
  vi.mock('next/navigation', () => ({
    useRouter: () => ({
      push: mockPush,
      back: mockBack,
      replace: mockReplace,
    }),
  }))
  
  return { mockPush, mockBack, mockReplace }
}

// Centralized localStorage mock
export const createLocalStorageMock = () => {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  }
  
  Object.defineProperty(window, 'localStorage', { 
    value: localStorageMock,
    writable: true 
  })
  
  return localStorageMock
}

// Centralized animejs mock
export const mockAnimejs = () => {
  vi.mock('animejs', () => ({
    default: vi.fn(() => ({
      play: vi.fn(),
      pause: vi.fn(),
    })),
  }))
}

// Centralized useNotes hook mock
export const createUseNotesMock = () => {
  const mockCreateNote = vi.fn()
  const mockUpdateNote = vi.fn()
  const mockDeleteNote = vi.fn()
  const mockRefreshNotes = vi.fn()
  
  vi.mock('../lib/useNotes', () => ({
    useNotes: () => ({
      notes: [],
      isLoading: false,
      createNote: mockCreateNote,
      updateNote: mockUpdateNote,
      deleteNote: mockDeleteNote,
      refreshNotes: mockRefreshNotes,
      getTopLevelNotes: vi.fn(),
      getChildNotes: vi.fn(),
      createNestedNote: vi.fn(),
      getNoteById: vi.fn(),
      hasUserContent: vi.fn(),
    }),
  }))
  
  return {
    mockCreateNote,
    mockUpdateNote,
    mockDeleteNote,
    mockRefreshNotes,
  }
}

// Standard test setup function
export const setupTest = () => {
  vi.clearAllMocks()
  
  const router = createRouterMock()
  const localStorage = createLocalStorageMock()
  
  // Reset localStorage mock to return empty object by default
  localStorage.getItem.mockReturnValue('{}')
  
  return { router, localStorage }
}

// Factory for creating consistent mock notes
export const createMockNote = (overrides: Partial<Note> = {}): Note => ({
  id: '1',
  title: 'Test Note',
  content: `# Test Note

This is a **test** note with some *markdown* content.

- Item 1
- Item 2`,
  created_at: '2025-06-16T10:00:00Z',
  updated_at: '2025-06-16T10:00:00Z',
  ...overrides,
})

// Specialized mock notes for different test scenarios
export const mockNotes = {
  simple: createMockNote(),
  withLongContent: createMockNote({
    content: `# Long Content Note\n\n${'This is a very long paragraph. '.repeat(20)}`,
  }),
  empty: createMockNote({
    title: 'Empty Note',
    content: '',
  }),
  nested: createMockNote({
    id: 'parent-1',
    title: 'Parent Note',
    content: '# Parent Note\n\nThis note has children.',
  }),
  child: createMockNote({
    id: 'child-1',
    title: 'Child Note',
    content: '# Child Note\n\nThis is a child note.',
  }),
}
