import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card } from '../components/Card';
import { createMockNote } from '../test/mocks';

// Mock Next.js router - must be done at module level
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: vi.fn(),
  }),
}))

// Mock the cardHeight hook
vi.mock('../lib/cardHeight', () => ({
  useCardHeight: () => 'small',
  CARD_HEIGHT_RATIOS: {
    small: 0.4,
    medium: 0.6,
    large: 0.8,
  },
}));

describe('Card with Nested Notes', () => {
  const mockNote = createMockNote({
    id: 'test-note-1',
    title: 'Test Note',
    content: '# Test Note\n\nThis is a test note.',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nested notes button when showNestedIcon is true', () => {
    render(
      <Card 
        note={mockNote} 
        childCount={3}
        showNestedIcon={true}
      />
    );

    const nestedButton = screen.getByTestId('nested-notes-button');
    expect(nestedButton).toBeInTheDocument();
    expect(nestedButton).toHaveAttribute('aria-label', 'View nested notes (3 child notes)');
  });

  it('does not render nested notes button when showNestedIcon is false', () => {
    render(
      <Card 
        note={mockNote} 
        childCount={0}
        showNestedIcon={false}
      />
    );

    const nestedButton = screen.queryByTestId('nested-notes-button');
    expect(nestedButton).not.toBeInTheDocument();
  });

  it('shows child count badge when there are child notes', () => {
    render(
      <Card 
        note={mockNote} 
        childCount={5}
        showNestedIcon={true}
      />
    );

    const nestedButton = screen.getByTestId('nested-notes-button');
    expect(nestedButton).toHaveTextContent('5');
  });

  it('shows 9+ badge when there are more than 9 child notes', () => {
    render(
      <Card 
        note={mockNote} 
        childCount={15}
        showNestedIcon={true}
      />
    );

    const nestedButton = screen.getByTestId('nested-notes-button');
    expect(nestedButton).toHaveTextContent('9+');
  });

  it('navigates to nested notes page when nested button is clicked', () => {
    render(
      <Card 
        note={mockNote} 
        childCount={2}
        showNestedIcon={true}
      />
    );

    const nestedButton = screen.getByTestId('nested-notes-button');
    fireEvent.click(nestedButton);

    expect(mockPush).toHaveBeenCalledWith('/note/test-note-1');
  });

  it('does not trigger card tap when nested button is clicked', () => {
    render(
      <Card 
        note={mockNote} 
        childCount={1}
        showNestedIcon={true}
      />
    );

    const nestedButton = screen.getByTestId('nested-notes-button');
    fireEvent.click(nestedButton);

    // Nested button should work independently
    expect(mockPush).toHaveBeenCalledWith('/note/test-note-1');
  });
});
