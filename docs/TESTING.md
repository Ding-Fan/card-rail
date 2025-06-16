# Testing Guide for Card Rail

This project uses **Vitest** with **React Testing Library** for unit testing. The testing setup follows TDD (Test-Driven Development) principles and is designed to be beginner-friendly.

## 🧪 Testing Stack

- **Vitest**: Fast test runner (Jest-compatible API)
- **React Testing Library**: Component testing focused on user behavior
- **jsdom**: DOM environment for browser-like testing
- **@testing-library/jest-dom**: Extended matchers for better assertions

## 📁 Test Structure

```
test/
├── setup.ts           # Global test configuration
└── utils.tsx          # Custom render helpers and utilities
components/
├── Card.test.tsx      # Card component tests (8 tests)
└── Card.tsx           # Card component implementation
data/
└── mockNotes.ts       # Test data (4 sample notes)
lib/
└── types.ts           # TypeScript interfaces
```

## 🚀 Running Tests

```bash
# Run all tests once
pnpm test:run

# Run tests in watch mode (for TDD)
pnpm test:watch

# Run specific test file
pnpm test:run components/Card.test.tsx

# Run tests with coverage
pnpm test:coverage
```

## 📊 Current Test Coverage

**8/8 tests passing** with comprehensive coverage of:

### Card Component Tests
- ✅ Note title rendering
- ✅ Markdown content rendering (headers, emphasis, lists)
- ✅ Mobile-first full-height styling
- ✅ Card-like visual styling (shadows, rounded corners)
- ✅ Click interactions and onTap callbacks
- ✅ Touch target size requirements
- ✅ Overflow content hiding (no scrollbars)
- ✅ Fade mask effect for content overflow

## 📝 Writing Tests (TDD Approach)

### 1. Red Phase - Write Failing Test

```typescript
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

describe('Card Component', () => {
  it('should have fade mask for content overflow', () => {
    const mockNote: Note = {
      id: '1',
      title: 'Test Note',
      content: 'Long content...',
      created_at: '2025-06-16T10:00:00Z',
      updated_at: '2025-06-16T10:00:00Z',
    }
    
    render(<Card note={mockNote} />)
    
    const fadeMask = screen.getByTestId('fade-mask')
    expect(fadeMask).toBeInTheDocument()
    expect(fadeMask).toHaveClass('absolute', 'bottom-0')
  })
})
```

### 2. Green Phase - Make Test Pass

```typescript
// Add fade mask to Card component
<div 
  data-testid="fade-mask"
  className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"
/>
```

### 3. Refactor Phase - Improve Code

- Extract reusable test data
- Optimize component performance
- Improve accessibility
- Clean up test assertions

describe('MyComponent', () => {
  it('should display the user name', () => {
    render(<MyComponent name="John Doe" />)
    
    // This will fail initially
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })
})
```

### 2. Green Phase - Make Test Pass

```typescript
// MyComponent.tsx
interface Props {
  name: string
}

function MyComponent({ name }: Props) {
  return <div>{name}</div>
}

export default MyComponent
```

### 3. Refactor Phase - Improve Code

```typescript
// Add proper styling, accessibility, etc.
function MyComponent({ name }: Props) {
  return (
    <div role="heading" aria-level={2}>
      {name}
    </div>
  )
}
```

## 🛠️ Testing Utilities

### Custom Render Function

```typescript
import { render, createMockNote } from '../test/utils'

// Automatically wraps components with ErrorBoundary
render(<Card note={createMockNote()} />)
```

### Mock Data Helpers

```typescript
// Create a mock note with defaults
const note = createMockNote({
  title: 'Custom Title',
  content: '# Custom Content'
})

// Create a demo note
const demoNote = createDemoNote()
```

### Animation Testing

```typescript
import { waitForAnimation } from '../test/utils'

// Wait for anime.js animations to complete
fireEvent.click(button)
await waitForAnimation()
expect(mockFunction).toHaveBeenCalled()
```

## 🎯 Testing Best Practices

### 1. Test User Behavior, Not Implementation

```typescript
// ✅ Good - Test what user sees/does
expect(screen.getByRole('button', { name: /save note/i })).toBeInTheDocument()

// ❌ Bad - Test implementation details
expect(component.state.isVisible).toBe(true)
```

### 2. Use Accessible Queries

```typescript
// ✅ Good - Accessible and robust
screen.getByRole('button', { name: /edit note/i })
screen.getByLabelText('Note title')
screen.getByText('Welcome message')

// ❌ Bad - Fragile selectors
screen.getByClassName('btn-primary')
screen.getByTestId('edit-button')
```

### 3. Test Edge Cases

```typescript
describe('Card Component', () => {
  it('should handle empty note content', () => {
    const note = createMockNote({ content: '' })
    render(<Card note={note} />)
    
    expect(screen.getByText(/this note is empty/i)).toBeInTheDocument()
  })

  it('should handle very long titles', () => {
    const note = createMockNote({ title: 'A'.repeat(100) })
    render(<Card note={note} />)
    
    // Test truncation behavior
    expect(screen.getByRole('heading')).toHaveClass('truncate')
  })
})
```

### 4. Mock External Dependencies

```typescript
// Mocks are set up for performance and reliability:
// - animejs (to avoid DOM manipulation in tests)
// - External APIs (when implemented)

// Example from Card.test.tsx:
vi.mock('animejs', () => ({
  default: vi.fn(() => ({
    play: vi.fn(),
    pause: vi.fn(),
  })),
}))
```

### 5. Test Data Management

```typescript
// Centralized test data in data/mockNotes.ts
const mockNote: Note = {
  id: '1',
  title: 'Test Note',
  content: '# Test\n\nContent with **markdown**',
  created_at: '2025-06-16T10:00:00Z',
  updated_at: '2025-06-16T10:00:00Z',
}

// Reusable across all tests
import { getAllMockNotes } from '../data/mockNotes'
```
// - Environment variables
```

## 📊 Test Coverage Goals

- **Components**: ✅ Card component fully tested (8/8 tests)
- **User Interactions**: ✅ Touch events, tap handlers
- **Rendering**: ✅ Markdown content, styling, responsive design
- **Edge Cases**: ✅ Overflow handling, fade mask effects
- **Future**: Navigation, form inputs, error boundaries

## 🔍 Debugging Tests

### 1. See What's Rendered

```typescript
import { screen } from '../test/utils'

render(<Card note={mockNote} />)
screen.debug() // Prints current DOM to console
```

### 2. Find Available Queries

```typescript
// When a query fails, it shows all available elements
screen.getByRole('button') // Shows all buttons if it fails
screen.getByTestId('card-content') // Use data-testid for complex queries
```

### 3. Test Environment Issues

```typescript
// Check if mocks are working
expect(vi.mocked(animejs)).toHaveBeenCalled()

// Verify test data
const notes = getAllMockNotes()
expect(notes).toHaveLength(4)
```

## 🚀 Future Testing Plans

### Phase 2 Features to Test
- **Navigation**: Route transitions, edit page
- **Form Validation**: Note editing, input validation
- **Error Handling**: Network failures, validation errors
- **Accessibility**: Screen reader compatibility, keyboard navigation

### Integration Tests
- **Multi-card Navigation**: Scroll behavior, card switching
- **Data Flow**: Props passing, state management
- **Performance**: Render optimization, memory usage

---

*This testing approach ensures Card Rail maintains high quality as new features are added while keeping the test suite fast and reliable.*
```

## 🔄 TDD Workflow Example

1. **Write the test first** (it should fail)
2. **Run the test** to see it fail
3. **Write minimal code** to make it pass
4. **Run the test** to see it pass
5. **Refactor** the code while keeping tests green
6. **Repeat** for the next feature

This ensures your code is testable, focused, and has high coverage by design!

## 🎮 Interactive Development

Use watch mode for the best TDD experience:

```bash
pnpm test:watch
```

This will re-run relevant tests as you save files, giving you instant feedback on your changes.
