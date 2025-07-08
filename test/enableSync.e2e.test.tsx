import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JotaiProvider } from '../lib/JotaiProvider';
import SettingsPage from '../app/settings/page';
import { syncService } from '../lib/syncService';
import * as passphraseModule from '../lib/passphrase';

// Mock Next.js router
const mockRouter = {
    back: vi.fn(),
    push: vi.fn(),
    replace: vi.fn()
};

vi.mock('next/navigation', () => ({
    useRouter: () => mockRouter
}));

// Mock Supabase with realistic responses
const mockSupabase = {
    from: vi.fn(() => ({
        select: vi.fn(() => ({
            eq: vi.fn(() => ({
                single: vi.fn()
            }))
        })),
        insert: vi.fn(() => ({
            select: vi.fn(() => ({
                single: vi.fn()
            }))
        }))
    }))
};

vi.mock('../lib/supabase', () => ({
    supabase: mockSupabase,
    isSupabaseConfigured: vi.fn(() => true)
}));

// Mock copy to clipboard
vi.mock('react-copy-to-clipboard', () => ({
    CopyToClipboard: ({ children, onCopy }: any) => (
        <div onClick={onCopy} data-testid="copy-button">{children}</div>
    )
}));

// Wrapper component with Jotai provider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <JotaiProvider>{children}</JotaiProvider>
);

describe('Enable Sync E2E Flow', () => {
    const mockGeneratedPassphrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const mockUserId = 'test-user-id';
    const mockUser = {
        id: mockUserId,
        passphrase: mockGeneratedPassphrase,
        created_at: '2024-01-01T00:00:00.000Z'
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock successful passphrase generation
        vi.spyOn(passphraseModule, 'generatePassphrase').mockReturnValue(mockGeneratedPassphrase);
        vi.spyOn(passphraseModule, 'validatePassphrase').mockReturnValue(true);
        vi.spyOn(passphraseModule, 'generateUserId').mockReturnValue(mockUserId);
        vi.spyOn(passphraseModule, 'generateBackupReminder').mockReturnValue('Mock backup reminder text');

        // Mock successful Supabase operations
        mockSupabase.from().select().eq().single.mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' } // User not found
        });

        mockSupabase.from().insert().select().single.mockResolvedValue({
            data: mockUser,
            error: null
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should complete the full enable sync flow for a new user', async () => {
        render(
            <TestWrapper>
                <SettingsPage />
            </TestWrapper>
        );

        // Step 1: Initial state - sync should be disabled
        expect(screen.getByText('Disabled')).toBeInTheDocument();
        expect(screen.getByText('Enable Sync')).toBeInTheDocument();

        // Step 2: Click enable sync to open modal
        fireEvent.click(screen.getByText('Enable Sync'));

        await waitFor(() => {
            expect(screen.getByText('Setup Sync')).toBeInTheDocument();
        });

        // Step 3: Generate new passphrase
        fireEvent.click(screen.getByText('Generate New Passphrase'));

        await waitFor(() => {
            expect(screen.getByDisplayValue(mockGeneratedPassphrase)).toBeInTheDocument();
        });

        // Step 4: Test copy functionality
        const copyButton = screen.getByTestId('copy-button');
        fireEvent.click(copyButton);

        await waitFor(() => {
            expect(screen.getByText('Copied!')).toBeInTheDocument();
        });

        // Step 5: Enable sync
        fireEvent.click(screen.getByText('Enable Sync'));

        // Step 6: Verify loading state
        await waitFor(() => {
            expect(screen.getByText('Setting up...')).toBeInTheDocument();
        });

        // Step 7: Wait for sync to be enabled and backup reminder to show
        await waitFor(() => {
            expect(screen.getByText('Sync Enabled!')).toBeInTheDocument();
        }, { timeout: 5000 });

        // Step 8: Verify backup reminder modal content
        expect(screen.getByText('Your Passphrase:')).toBeInTheDocument();
        expect(screen.getByDisplayValue(mockGeneratedPassphrase)).toBeInTheDocument();

        // Step 9: Test copy in backup reminder
        const backupCopyButton = screen.getAllByTestId('copy-button')[1];
        fireEvent.click(backupCopyButton);

        await waitFor(() => {
            expect(screen.getByText('Copied to Clipboard!')).toBeInTheDocument();
        });

        // Step 10: Dismiss backup reminder
        fireEvent.click(screen.getByText('I\'ve Saved My Passphrase'));

        await waitFor(() => {
            expect(screen.queryByText('Sync Enabled!')).not.toBeInTheDocument();
        });

        // Step 11: Verify final state - sync should be enabled
        expect(screen.getByText('Enabled')).toBeInTheDocument();
        expect(screen.getByText('Sync Now')).toBeInTheDocument();
        expect(screen.getByText('Disable Sync')).toBeInTheDocument();
    });

    it('should handle existing user login', async () => {
        const existingUser = {
            id: mockUserId,
            passphrase: mockGeneratedPassphrase,
            created_at: '2024-01-01T00:00:00.000Z'
        };

        // Mock existing user found
        mockSupabase.from().select().eq().single.mockResolvedValue({
            data: existingUser,
            error: null
        });

        render(
            <TestWrapper>
                <SettingsPage />
            </TestWrapper>
        );

        // Open sync modal
        fireEvent.click(screen.getByText('Enable Sync'));

        await waitFor(() => {
            expect(screen.getByText('Setup Sync')).toBeInTheDocument();
        });

        // Enter existing passphrase
        const textarea = screen.getByPlaceholderText('Enter existing passphrase or generate new one');
        fireEvent.change(textarea, { target: { value: mockGeneratedPassphrase } });

        // Enable sync
        fireEvent.click(screen.getByText('Enable Sync'));

        // Should NOT show backup reminder for existing user
        await waitFor(() => {
            expect(screen.getByText('Enabled')).toBeInTheDocument();
        });

        expect(screen.queryByText('Sync Enabled!')).not.toBeInTheDocument();
    });

    it('should handle database setup error', async () => {
        // Mock database not set up error
        mockSupabase.from().select().eq().single.mockResolvedValue({
            data: null,
            error: { message: 'relation "cardrail_users" does not exist' }
        });

        render(
            <TestWrapper>
                <SettingsPage />
            </TestWrapper>
        );

        fireEvent.click(screen.getByText('Enable Sync'));

        await waitFor(() => {
            const textarea = screen.getByPlaceholderText('Enter existing passphrase or generate new one');
            fireEvent.change(textarea, { target: { value: mockGeneratedPassphrase } });
        });

        fireEvent.click(screen.getByText('Enable Sync'));

        await waitFor(() => {
            expect(screen.getByText(/Database not set up/)).toBeInTheDocument();
        });
    });

    it('should handle network errors gracefully', async () => {
        // Mock network error
        mockSupabase.from().select().eq().single.mockRejectedValue(new Error('Network error'));

        render(
            <TestWrapper>
                <SettingsPage />
            </TestWrapper>
        );

        fireEvent.click(screen.getByText('Enable Sync'));

        await waitFor(() => {
            const textarea = screen.getByPlaceholderText('Enter existing passphrase or generate new one');
            fireEvent.change(textarea, { target: { value: mockGeneratedPassphrase } });
        });

        fireEvent.click(screen.getByText('Enable Sync'));

        await waitFor(() => {
            expect(screen.getByText(/Network error/)).toBeInTheDocument();
        });
    });

    it('should validate passphrase format correctly', async () => {
        // Mock invalid passphrase
        vi.spyOn(passphraseModule, 'validatePassphrase').mockReturnValue(false);

        render(
            <TestWrapper>
                <SettingsPage />
            </TestWrapper>
        );

        fireEvent.click(screen.getByText('Enable Sync'));

        await waitFor(() => {
            const textarea = screen.getByPlaceholderText('Enter existing passphrase or generate new one');
            fireEvent.change(textarea, { target: { value: 'invalid short phrase' } });
        });

        fireEvent.click(screen.getByText('Enable Sync'));

        await waitFor(() => {
            expect(screen.getByText(/Invalid passphrase format/)).toBeInTheDocument();
        });
    });

    it('should handle sync after enable', async () => {
        render(
            <TestWrapper>
                <SettingsPage />
            </TestWrapper>
        );

        // Enable sync first
        fireEvent.click(screen.getByText('Enable Sync'));

        await waitFor(() => {
            fireEvent.click(screen.getByText('Generate New Passphrase'));
        });

        await waitFor(() => {
            fireEvent.click(screen.getByText('Enable Sync'));
        });

        // Wait for sync to be enabled
        await waitFor(() => {
            fireEvent.click(screen.getByText('I\'ve Saved My Passphrase'));
        });

        // Test sync now functionality
        await waitFor(() => {
            expect(screen.getByText('Sync Now')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Sync Now'));

        // Should show syncing state
        await waitFor(() => {
            expect(screen.getByText('Syncing...')).toBeInTheDocument();
        });
    });

    it('should handle disable sync', async () => {
        render(
            <TestWrapper>
                <SettingsPage />
            </TestWrapper>
        );

        // Enable sync first
        fireEvent.click(screen.getByText('Enable Sync'));
        await waitFor(() => {
            fireEvent.click(screen.getByText('Generate New Passphrase'));
        });
        await waitFor(() => {
            fireEvent.click(screen.getByText('Enable Sync'));
        });
        await waitFor(() => {
            fireEvent.click(screen.getByText('I\'ve Saved My Passphrase'));
        });

        // Now disable sync
        await waitFor(() => {
            expect(screen.getByText('Disable Sync')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Disable Sync'));

        // Should return to disabled state
        await waitFor(() => {
            expect(screen.getByText('Disabled')).toBeInTheDocument();
            expect(screen.getByText('Enable Sync')).toBeInTheDocument();
        });
    });
});
