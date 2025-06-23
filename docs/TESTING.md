# Testing Guide for Card Rail

This project uses **Vitest** with **React Testing Library** for comprehensive testing. The testing approach follows TDD (Test-Driven Development) principles with extensive coverage of user workflows and edge cases.

## 🧪 Testing Stack

- **Vitest**: Fast test runner (Jest-compatible API)
- **React Testing Library**: Component testing focused on user behavior
- **jsdom**: DOM environment for browser-like testing
- **@testing-library/jest-dom**: Extended matchers for better assertions
- **TDD Approach**: Tests written first, implementation follows

## 📁 Test Structure

```
test/
├── setup.ts                      # Global test configuration
├── utils.tsx                     # Custom render helpers and utilities
└── mocks.ts                      # Mock data and utilities
components/
├── Card.test.tsx                 # Core card component tests (13 tests)
├── EditButton.test.tsx           # Edit button interaction tests (5 tests) 
├── Card.archive.test.tsx         # Archive functionality tests (25 tests)
├── Archive.integration.test.tsx  # Archive integration tests (8 tests)
├── Card.archive.e2e.test.tsx     # End-to-end archive workflow (12 tests)
└── FAB/
    ├── GlobalFAB.integration.test.tsx # FAB workflow tests (8 tests)
    └── DraggableFAB.test.tsx         # FAB interaction tests (6 tests)
app/
└── note/[id]/
    ├── page.test.tsx             # Note detail page tests (5 tests)
    └── page.integration.test.tsx # Note creation workflow (4 tests)
```

## 🚀 Running Tests

```bash
# Run all tests once
pnpm test

# Run tests in watch mode (for TDD)
pnpm test:watch

# Run specific test file
pnpm test components/Card.archive.test.tsx

# Run tests with coverage
pnpm test:coverage

# Run only archive-related tests
pnpm test --testNamePattern="Archive"
```

## 📊 Current Test Coverage

**80+ tests passing** with comprehensive coverage of:

### Card Component Tests (13 tests)
- ✅ Note title rendering
- ✅ Markdown content rendering (headers, emphasis, lists)
- ✅ Mobile-first full-height styling
- ✅ Card-like visual styling (shadows, rounded corners)
- ✅ Touch interactions and click handlers
- ✅ Mobile touch target sizing (44px minimum)
- ✅ Content overflow handling with fade mask
- ✅ Edit button embedded in card header
- ✅ Edit button navigation functionality
- ✅ Event propagation handling
- ✅ Accessibility features (ARIA labels)

### Edit Button Tests (5 tests)
- ✅ Edit button positioning within card header
- ✅ Button styling and visual design
- ✅ Navigation to note detail pages
- ✅ Event propagation prevention
- ✅ Accessibility and touch targets

### Note Detail Page Tests (5 tests)
- ✅ Note content rendering (title and markdown)
- ✅ Back button functionality
- ✅ Edit button in detail header
- ✅ Navigation between pages
- ✅ Error handling for invalid note IDs

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

## 🧭 Testing Navigation & Page Components

### Testing Next.js App Router Pages

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../../test/utils'
import NotePage from './page'

// Mock Next.js router
const mockPush = vi.fn()
const mockBack = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}))

// Mock data functions
vi.mock('../../../data/mockNotes', () => ({
  getMockNote: vi.fn((id: string) => {
    if (id === '1') {
      return {
        id: '1',
        title: 'Test Note',
        content: '# Test Note\n\nThis is test content.',
        created_at: '2025-06-16T10:00:00Z',
        updated_at: '2025-06-16T10:00:00Z',
      }
    }
    return undefined
  })
}))

describe('Note Detail Page', () => {
  it('should navigate back when back button is clicked', () => {
    const props = { params: { id: '1' } }
    render(<NotePage params={props.params} />)
    
    const backButton = screen.getByTestId('back-button')
    backButton.click()
    
    expect(mockBack).toHaveBeenCalled()
  })

  it('should show not found message for invalid note id', () => {
    const props = { params: { id: 'invalid' } }
    render(<NotePage params={props.params} />)
    
    expect(screen.getByText('Note not found')).toBeInTheDocument()
  })
})
```

### Testing Component Navigation

```typescript
// Test edit button navigation from cards
it('should navigate to edit page when edit button is clicked', () => {
  render(<Card note={mockNote} />)
  
  const editButton = screen.getByTestId('edit-button')
  fireEvent.click(editButton)
  
  expect(mockPush).toHaveBeenCalledWith('/note/1')
})

// Test event propagation
it('should stop event propagation on edit button click', () => {
  const onTap = vi.fn()
  render(<Card note={mockNote} onTap={onTap} />)
  
  const editButton = screen.getByTestId('edit-button')
  fireEvent.click(editButton)
  
  // Card onTap should not be called when edit button is clicked
  expect(onTap).not.toHaveBeenCalled()
  expect(mockPush).toHaveBeenCalledWith('/note/1')
})
```

### Handling Duplicate Content in Tests

When testing pages with markdown content, you may encounter duplicate text (e.g., title appears both in page header and markdown content):

```typescript
// ❌ This will fail if content has duplicate text
expect(screen.getByText('Test Note')).toBeInTheDocument()

// ✅ Better approach - check for multiple instances
const mainTitles = screen.getAllByText('Test Note')
expect(mainTitles.length).toBe(2) // One main title, one in markdown

// ✅ Or target specific elements
expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Note')
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

## 🎯 TDD Archive Feature Development

The archive functionality was developed using strict TDD methodology:

### **Phase 1: Test-First Development**
1. **Requirements Analysis**: Defined archive user stories and acceptance criteria
2. **Test Case Creation**: Wrote comprehensive test suites before any implementation
3. **Red Phase**: All tests fail initially (expected behavior)
4. **Implementation**: Built features to make tests pass
5. **Green Phase**: All tests pass with minimal implementation
6. **Refactor Phase**: Improved code quality while maintaining test coverage

### **Test Categories for Archive Feature**

#### **Unit Tests** (`Card.archive.test.tsx`)
- Archive menu option rendering and interactions
- Confirmation bubble display and positioning
- Archive action execution and callbacks
- Error handling and edge cases
- State management consistency
- **Coverage**: 25 test cases

#### **Integration Tests** (`Archive.integration.test.tsx`)
- Main page filtering of archived notes
- Archive page display of archived notes
- Storage integration and data persistence
- Component communication and data flow
- **Coverage**: 8 test cases

#### **End-to-End Tests** (`Card.archive.e2e.test.tsx`)
- Complete user workflows from menu to confirmation
- Keyboard and touch interaction patterns
- State persistence across component re-renders
- Concurrent archive attempt handling
- **Coverage**: 12 test cases

### **Test-Driven Benefits Achieved**
- **100% Feature Coverage**: Every archive workflow path tested
- **Regression Protection**: Changes can't break existing functionality
- **Documentation**: Tests serve as living specification
- **Confidence**: Refactoring and improvements made safely
- **Quality**: Edge cases and error conditions handled properly
