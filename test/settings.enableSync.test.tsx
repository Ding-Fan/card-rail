import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useAtomValue, useSetAtom } from 'jotai';
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

// Mock Jotai atoms
vi.mock('jotai', () => ({
    useAtomValue: vi.fn(),
    useSetAtom: vi.fn()
}));

// Mock syncService
vi.mock('../lib/syncService', () => ({
    syncService: {
        registerUser: vi.fn(),
        stopAutoSync: vi.fn(),
        initialize: vi.fn()
    }
}));

// Mock passphrase functions
vi.mock('../lib/passphrase', () => ({
    generatePassphrase: vi.fn(),
    validatePassphrase: vi.fn(),
    generateBackupReminder: vi.fn(() => 'Mock backup reminder')
}));

// Mock Supabase configuration
vi.mock('../lib/supabase', () => ({
    isSupabaseConfigured: vi.fn(() => true)
}));

// Mock copy to clipboard
vi.mock('react-copy-to-clipboard', () => ({
    CopyToClipboard: ({ children, onCopy }: any) => (
        <div onClick={onCopy}>{children}</div>
    )
}));

describe('Settings Page - Enable Sync Integration', () => {
    const mockSyncSettings = {
        enabled: false,
        autoSync: true,
        syncInterval: 30000
    };

    const mockUser = {
        id: 'test-user-id',
        passphrase: 'test passphrase with twelve words here for proper mnemonic phrase validation',
        created_at: '2024-01-01T00:00:00.000Z'
    };

    const mockSetAtomFunctions = {
        enableSync: vi.fn(),
        disableSync: vi.fn(),
        updateSyncSettings: vi.fn(),
        syncNotes: vi.fn(),
        initializeSync: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock atom values
        vi.mocked(useAtomValue).mockImplementation((atom) => {
            if (atom.toString().includes('syncSettings')) return mockSyncSettings;
            if (atom.toString().includes('currentUser')) return null;
            if (atom.toString().includes('syncStatus')) return 'idle';
            if (atom.toString().includes('offlineNotes')) return [];
            if (atom.toString().includes('syncedNotes')) return [];
            if (atom.toString().includes('conflictNotes')) return [];
            return null;
        });

        // Mock set atom functions
        vi.mocked(useSetAtom).mockImplementation((atom) => {
            if (atom.toString().includes('enableSync')) return mockSetAtomFunctions.enableSync;
            if (atom.toString().includes('disableSync')) return mockSetAtomFunctions.disableSync;
            if (atom.toString().includes('updateSyncSettings')) return mockSetAtomFunctions.updateSyncSettings;
            if (atom.toString().includes('syncNotes')) return mockSetAtomFunctions.syncNotes;
            if (atom.toString().includes('initializeSync')) return mockSetAtomFunctions.initializeSync;
            return vi.fn();
        });

        // Mock passphrase functions
        vi.mocked(passphraseModule.generatePassphrase).mockReturnValue('test passphrase with twelve words here for proper mnemonic phrase validation');
        vi.mocked(passphraseModule.validatePassphrase).mockReturnValue(true);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Enable Sync Flow', () => {
        it('should render enable sync button when sync is disabled', () => {
            render(<SettingsPage />);

            expect(screen.getByText('Enable Sync')).toBeInTheDocument();
            expect(screen.queryByText('Disable Sync')).not.toBeInTheDocument();
        });

        it('should open passphrase form when enable sync is clicked', async () => {
            render(<SettingsPage />);

            fireEvent.click(screen.getByText('Enable Sync'));

            await waitFor(() => {
                expect(screen.getByText('Setup Sync')).toBeInTheDocument();
                expect(screen.getByPlaceholderText('Enter existing passphrase or generate new one')).toBeInTheDocument();
            });
        });

        it('should generate new passphrase when generate button is clicked', async () => {
            render(<SettingsPage />);

            fireEvent.click(screen.getByText('Enable Sync'));

            await waitFor(() => {
                expect(screen.getByText('Generate New Passphrase')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('Generate New Passphrase'));

            expect(passphraseModule.generatePassphrase).toHaveBeenCalled();
            expect(screen.getByDisplayValue('test passphrase with twelve words here for proper mnemonic phrase validation')).toBeInTheDocument();
        });

        it('should show error for empty passphrase', async () => {
            render(<SettingsPage />);

            fireEvent.click(screen.getByText('Enable Sync'));

            await waitFor(() => {
                expect(screen.getByText('Enable Sync')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('Enable Sync'));

            await waitFor(() => {
                expect(screen.getByText('Please enter or generate a passphrase')).toBeInTheDocument();
            });
        });

        it('should show error for invalid passphrase format', async () => {
            vi.mocked(passphraseModule.validatePassphrase).mockReturnValue(false);

            render(<SettingsPage />);

            fireEvent.click(screen.getByText('Enable Sync'));

            await waitFor(() => {
                const textarea = screen.getByPlaceholderText('Enter existing passphrase or generate new one');
                fireEvent.change(textarea, { target: { value: 'invalid passphrase' } });
            });

            fireEvent.click(screen.getByText('Enable Sync'));

            await waitFor(() => {
                expect(screen.getByText(/Invalid passphrase format/)).toBeInTheDocument();
            });
        });

        it('should successfully register user and enable sync', async () => {
            vi.mocked(syncService.registerUser).mockResolvedValue(mockUser);

            render(<SettingsPage />);

            fireEvent.click(screen.getByText('Enable Sync'));

            await waitFor(() => {
                const textarea = screen.getByPlaceholderText('Enter existing passphrase or generate new one');
                fireEvent.change(textarea, { target: { value: 'test passphrase with twelve words here for proper mnemonic phrase validation' } });
            });

            fireEvent.click(screen.getByText('Enable Sync'));

            await waitFor(() => {
                expect(syncService.registerUser).toHaveBeenCalledWith('test passphrase with twelve words here for proper mnemonic phrase validation');
                expect(mockSetAtomFunctions.enableSync).toHaveBeenCalledWith(mockUser);
            });
        });

        it('should show backup reminder for new users', async () => {
            vi.mocked(syncService.registerUser).mockResolvedValue(mockUser);

            render(<SettingsPage />);

            fireEvent.click(screen.getByText('Enable Sync'));

            await waitFor(() => {
                fireEvent.click(screen.getByText('Generate New Passphrase'));
            });

            await waitFor(() => {
                fireEvent.click(screen.getByText('Enable Sync'));
            });

            await waitFor(() => {
                expect(screen.getByText('Sync Enabled!')).toBeInTheDocument();
                expect(screen.getByText('Your Passphrase:')).toBeInTheDocument();
            });
        });

        it('should handle sync service errors', async () => {
            vi.mocked(syncService.registerUser).mockRejectedValue(new Error('Database not set up'));

            render(<SettingsPage />);

            fireEvent.click(screen.getByText('Enable Sync'));

            await waitFor(() => {
                const textarea = screen.getByPlaceholderText('Enter existing passphrase or generate new one');
                fireEvent.change(textarea, { target: { value: 'test passphrase with twelve words here for proper mnemonic phrase validation' } });
            });

            fireEvent.click(screen.getByText('Enable Sync'));

            await waitFor(() => {
                expect(screen.getByText('Database not set up')).toBeInTheDocument();
            });
        });

        it('should show loading state during sync setup', async () => {
            vi.mocked(syncService.registerUser).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

            render(<SettingsPage />);

            fireEvent.click(screen.getByText('Enable Sync'));

            await waitFor(() => {
                const textarea = screen.getByPlaceholderText('Enter existing passphrase or generate new one');
                fireEvent.change(textarea, { target: { value: 'test passphrase with twelve words here for proper mnemonic phrase validation' } });
            });

            fireEvent.click(screen.getByText('Enable Sync'));

            await waitFor(() => {
                expect(screen.getByText('Setting up...')).toBeInTheDocument();
            });
        });

        it('should close passphrase form when cancelled', async () => {
            render(<SettingsPage />);

            fireEvent.click(screen.getByText('Enable Sync'));

            await waitFor(() => {
                expect(screen.getByText('Setup Sync')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('Cancel'));

            await waitFor(() => {
                expect(screen.queryByText('Setup Sync')).not.toBeInTheDocument();
            });
        });
    });

    describe('Copy to Clipboard', () => {
        it('should show copy button when passphrase is entered', async () => {
            render(<SettingsPage />);

            fireEvent.click(screen.getByText('Enable Sync'));

            await waitFor(() => {
                const textarea = screen.getByPlaceholderText('Enter existing passphrase or generate new one');
                fireEvent.change(textarea, { target: { value: 'test passphrase' } });
            });

            expect(screen.getByText('Copy')).toBeInTheDocument();
        });

        it('should show success feedback when copy is successful', async () => {
            render(<SettingsPage />);

            fireEvent.click(screen.getByText('Enable Sync'));

            await waitFor(() => {
                const textarea = screen.getByPlaceholderText('Enter existing passphrase or generate new one');
                fireEvent.change(textarea, { target: { value: 'test passphrase' } });
            });

            fireEvent.click(screen.getByText('Copy'));

            await waitFor(() => {
                expect(screen.getByText('Copied!')).toBeInTheDocument();
            });
        });
    });

    describe('Sync Status Display', () => {
        it('should show enabled sync status when sync is enabled', () => {
            vi.mocked(useAtomValue).mockImplementation((atom) => {
                if (atom.toString().includes('syncSettings')) return { ...mockSyncSettings, enabled: true };
                if (atom.toString().includes('currentUser')) return mockUser;
                if (atom.toString().includes('syncStatus')) return 'idle';
                if (atom.toString().includes('offlineNotes')) return [];
                if (atom.toString().includes('syncedNotes')) return [{ id: '1', title: 'Test Note' }];
                if (atom.toString().includes('conflictNotes')) return [];
                return null;
            });

            render(<SettingsPage />);

            expect(screen.getByText('Enabled')).toBeInTheDocument();
            expect(screen.getByText('Synced Notes:')).toBeInTheDocument();
            expect(screen.getByText('1')).toBeInTheDocument();
        });

        it('should show sync now button when sync is enabled', () => {
            vi.mocked(useAtomValue).mockImplementation((atom) => {
                if (atom.toString().includes('syncSettings')) return { ...mockSyncSettings, enabled: true };
                if (atom.toString().includes('currentUser')) return mockUser;
                return null;
            });

            render(<SettingsPage />);

            expect(screen.getByText('Sync Now')).toBeInTheDocument();
            expect(screen.getByText('Disable Sync')).toBeInTheDocument();
        });

        it('should trigger sync when sync now button is clicked', async () => {
            vi.mocked(useAtomValue).mockImplementation((atom) => {
                if (atom.toString().includes('syncSettings')) return { ...mockSyncSettings, enabled: true };
                if (atom.toString().includes('currentUser')) return mockUser;
                return null;
            });

            render(<SettingsPage />);

            fireEvent.click(screen.getByText('Sync Now'));

            expect(mockSetAtomFunctions.syncNotes).toHaveBeenCalled();
        });
    });

    describe('Supabase Configuration Warning', () => {
        it('should show warning when Supabase is not configured', () => {
            const { isSupabaseConfigured } = require('../lib/supabase');
            vi.mocked(isSupabaseConfigured).mockReturnValue(false);

            render(<SettingsPage />);

            expect(screen.getByText('Sync Not Available')).toBeInTheDocument();
            expect(screen.getByText(/Supabase is not configured/)).toBeInTheDocument();
        });

        it('should disable sync button when Supabase is not configured', () => {
            const { isSupabaseConfigured } = require('../lib/supabase');
            vi.mocked(isSupabaseConfigured).mockReturnValue(false);

            render(<SettingsPage />);

            const enableButton = screen.getByText('Enable Sync');
            expect(enableButton).toBeDisabled();
        });
    });
});
