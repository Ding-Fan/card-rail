import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { SubnotesPanel } from './SubnotesPanel';
import { JotaiProvider } from '../lib/JotaiProvider';

describe('SubnotesPanel', () => {
    const renderWithProvider = (component: React.ReactElement) => {
        return render(
            <JotaiProvider>
                {component}
            </JotaiProvider>
        );
    };

    it('should render without crashing', () => {
        const mockOnVisibilityChange = vi.fn();

        expect(() => {
            renderWithProvider(
                <SubnotesPanel
                    parentNoteId="parent1"
                    isVisible={true}
                    onVisibilityChange={mockOnVisibilityChange}
                />
            );
        }).not.toThrow();
    });
});
