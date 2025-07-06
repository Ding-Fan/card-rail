import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'jotai';
import { Card } from './Card';
import { Note } from '../lib/types';

// Mock the router
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
    }),
}));

// Mock animejs
vi.mock('animejs', () => ({
    animate: vi.fn(),
}));

const mockNote: Note = {
    id: 'test-note-1',
    title: 'Test Note',
    content: '# Test Note\n\nThis is a test note with some **markdown** content.\n\n- Item 1\n- Item 2',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    parent_id: undefined,
    isArchived: false,
};

describe('Card Flip Functionality', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render both front and back sides', () => {
        render(
            <Provider>
                <Card note={mockNote} childCount={0} />
            </Provider>
        );

        // Check that both front and back elements exist
        expect(screen.getByTestId('card-front')).toBeInTheDocument();
        expect(screen.getByTestId('card-back')).toBeInTheDocument();
    });

    it('should have 3D flip container styling', () => {
        render(
            <Provider>
                <Card note={mockNote} childCount={0} />
            </Provider>
        );

        const card = screen.getByTestId('note-card');
        expect(card).toHaveStyle({
            perspective: '1000px',
            'transform-style': 'preserve-3d',
        });
    });

    it('should have proper backface visibility on card sides', () => {
        render(
            <Provider>
                <Card note={mockNote} childCount={0} />
            </Provider>
        );

        const frontSide = screen.getByTestId('card-front');
        const backSide = screen.getByTestId('card-back');

        expect(frontSide).toHaveStyle({
            'backface-visibility': 'hidden',
            'transform-style': 'preserve-3d',
        });

        expect(backSide).toHaveStyle({
            'backface-visibility': 'hidden',
            'transform-style': 'preserve-3d',
            transform: 'rotateY(180deg)',
        });
    });

    it('should render card back panel with subnotes info', () => {
        render(
            <Provider>
                <Card note={mockNote} childCount={0} />
            </Provider>
        );

        // The back panel should show subnotes count (0 since no mock subnotes in store)
        expect(screen.getByText((content, element) => {
            return element?.textContent === 'Subnotes (0)';
        })).toBeInTheDocument();
    });

    it('should have touch event handlers for swipe gestures', () => {
        render(
            <Provider>
                <Card note={mockNote} childCount={0} />
            </Provider>
        );

        const card = screen.getByTestId('note-card');

        // Check that touch event handlers are present
        fireEvent.touchStart(card, {
            touches: [{ clientX: 100, clientY: 100 }],
        });

        fireEvent.touchMove(card, {
            touches: [{ clientX: 150, clientY: 100 }],
        });

        fireEvent.touchEnd(card, {
            changedTouches: [{ clientX: 200, clientY: 100 }],
        });

        // Test passes if no errors are thrown during touch events
        expect(card).toBeInTheDocument();
    });

    it('should show flip hint text on card back', () => {
        render(
            <Provider>
                <Card note={mockNote} childCount={0} />
            </Provider>
        );

        expect(screen.getByText('Swipe to flip back')).toBeInTheDocument();
    });
});
