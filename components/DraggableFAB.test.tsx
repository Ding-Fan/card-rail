import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DraggableFAB } from './DraggableFAB';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
};
vi.stubGlobal('localStorage', localStorageMock);

// Mock window dimensions
Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 800,
});
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 400,
});

describe('DraggableFAB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should render with Japanese wall socket design', () => {
    render(<DraggableFAB />);
    
    const fab = screen.getByTestId('draggable-fab');
    expect(fab).toBeInTheDocument();
    expect(fab).toHaveAttribute('aria-label', 'Add new note');
    
    // Should have two tall black rectangles (Japanese socket design)
    const blackRectangles = fab.querySelectorAll('div.bg-black');
    expect(blackRectangles).toHaveLength(2);
    
    // Verify they are thin tall rectangles (w-1 h-6)
    blackRectangles.forEach(rect => {
      expect(rect).toHaveClass('w-1', 'h-6');
    });
  });

  it('should have proper styling for bagel rounded background with stone border', () => {
    render(<DraggableFAB />);
    
    const fab = screen.getByTestId('draggable-fab');
    expect(fab).toHaveClass('bg-stone-100');
    expect(fab).toHaveClass('border');
    expect(fab).toHaveClass('border-stone-300');
    expect(fab).toHaveClass('rounded-xl');
    expect(fab).toHaveClass('shadow-lg');
  });

  it('should navigate to /note/new when clicked', () => {
    render(<DraggableFAB />);
    
    const fab = screen.getByTestId('draggable-fab');
    fireEvent.click(fab);
    
    expect(mockPush).toHaveBeenCalledWith('/note/new');
  });

  it('should be draggable with dnd-kit attributes', () => {
    render(<DraggableFAB />);
    
    const fab = screen.getByTestId('draggable-fab');
    expect(fab).toHaveClass('cursor-grab');
    
    // Should be draggable (dnd-kit manages this internally)
    expect(fab).toHaveAttribute('role', 'button');
  });

  it('should call custom onCreateNote handler when provided', () => {
    const mockOnCreateNote = vi.fn();
    render(<DraggableFAB onCreateNote={mockOnCreateNote} />);
    
    const fab = screen.getByTestId('draggable-fab');
    fireEvent.click(fab);
    
    expect(mockOnCreateNote).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should load saved position from localStorage', () => {
    const savedPosition = JSON.stringify({ x: 200, y: 300 });
    localStorageMock.getItem.mockReturnValue(savedPosition);
    
    render(<DraggableFAB />);
    
    const fab = screen.getByTestId('draggable-fab');
    expect(fab.style.left).toBe('200px');
    expect(fab.style.top).toBe('300px');
  });

  it('should have fixed positioning and high z-index', () => {
    render(<DraggableFAB />);
    
    const fab = screen.getByTestId('draggable-fab');
    expect(fab).toHaveClass('fixed');
    expect(fab).toHaveClass('z-50');
  });

  it('should be touch-friendly with proper dimensions', () => {
    render(<DraggableFAB />);
    
    const fab = screen.getByTestId('draggable-fab');
    expect(fab).toHaveClass('w-20'); // 80px width
    expect(fab).toHaveClass('h-10'); // 40px height  
    expect(fab).toHaveClass('select-none'); // Non-selectable for touch
  });
});
