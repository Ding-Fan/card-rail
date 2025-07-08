import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generatePassphrase, generateUserId, validatePassphrase } from '../lib/passphrase';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
    supabase: {
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
    },
    isSupabaseConfigured: vi.fn(() => true)
}));

describe('Sync Service - Enable Sync', () => {
    let mockSupabase: any;
    let syncService: any;

    beforeEach(async () => {
        vi.clearAllMocks();

        // Import the mocked supabase
        const { supabase } = await import('../lib/supabase');
        mockSupabase = supabase;

        // Import syncService after mocking
        const { syncService: importedSyncService } = await import('../lib/syncService');
        syncService = importedSyncService;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Passphrase Generation and Validation', () => {
        it('should generate a valid BIP39 mnemonic phrase', () => {
            const passphrase = generatePassphrase();

            expect(passphrase).toBeDefined();
            expect(typeof passphrase).toBe('string');
            expect(passphrase.split(' ')).toHaveLength(12);
            expect(validatePassphrase(passphrase)).toBe(true);
        });

        it('should generate different passphrases on each call', () => {
            const passphrase1 = generatePassphrase();
            const passphrase2 = generatePassphrase();

            expect(passphrase1).not.toBe(passphrase2);
        });

        it('should validate correct BIP39 mnemonic phrases', () => {
            const validPhrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
            expect(validatePassphrase(validPhrase)).toBe(true);
        });

        it('should reject invalid mnemonic phrases', () => {
            const invalidPhrases = [
                'invalid phrase here',
                'not enough words',
                'too many words here to be a valid twelve word mnemonic phrase that works',
                '',
                'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon invalid'
            ];

            invalidPhrases.forEach(phrase => {
                expect(validatePassphrase(phrase)).toBe(false);
            });
        });
    });

    describe('User ID Generation', () => {
        it('should generate consistent user IDs from the same passphrase', () => {
            const passphrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
            const userId1 = generateUserId(passphrase);
            const userId2 = generateUserId(passphrase);

            expect(userId1).toBe(userId2);
            expect(userId1).toHaveLength(8);
            expect(userId1).toMatch(/^[a-f0-9]+$/);
        });

        it('should generate different user IDs from different passphrases', () => {
            const passphrase1 = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
            const passphrase2 = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon';

            const userId1 = generateUserId(passphrase1);
            const userId2 = generateUserId(passphrase2);

            expect(userId1).not.toBe(userId2);
        });

        it('should throw error for empty passphrase', () => {
            expect(() => generateUserId('')).toThrow('Passphrase cannot be empty');
            expect(() => generateUserId('   ')).toThrow('Passphrase cannot be empty');
        });

        it('should throw error for invalid passphrase', () => {
            expect(() => generateUserId('invalid phrase')).toThrow('Invalid passphrase');
        });
    });

    describe('User Registration', () => {
        it('should register a new user successfully', async () => {
            const passphrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
            const userId = generateUserId(passphrase);

            // Mock successful user creation
            const mockUser = {
                id: userId,
                passphrase,
                created_at: new Date().toISOString()
            };

            mockSupabase.from().select().eq().single.mockResolvedValueOnce({
                data: null,
                error: { code: 'PGRST116' } // Not found error
            });

            mockSupabase.from().insert().select().single.mockResolvedValueOnce({
                data: mockUser,
                error: null
            });

            const result = await syncService.registerUser(passphrase);

            expect(result).toEqual(mockUser);
            expect(mockSupabase.from).toHaveBeenCalledWith('cardrail_users');
        });

        it('should return existing user with valid passphrase', async () => {
            const passphrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
            const userId = generateUserId(passphrase);

            const existingUser = {
                id: userId,
                passphrase,
                created_at: new Date().toISOString()
            };

            mockSupabase.from().select().eq().single.mockResolvedValueOnce({
                data: existingUser,
                error: null
            });

            const result = await syncService.registerUser(passphrase);

            expect(result).toEqual(existingUser);
        });

        it('should reject existing user with invalid passphrase', async () => {
            const correctPassphrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
            const wrongPassphrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon';
            const userId = generateUserId(correctPassphrase);

            const existingUser = {
                id: userId,
                passphrase: correctPassphrase,
                created_at: new Date().toISOString()
            };

            mockSupabase.from().select().eq().single.mockResolvedValueOnce({
                data: existingUser,
                error: null
            });

            await expect(syncService.registerUser(wrongPassphrase)).rejects.toThrow('Invalid passphrase for existing user');
        });

        it('should handle database table not found error', async () => {
            const passphrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

            mockSupabase.from().select().eq().single.mockResolvedValueOnce({
                data: null,
                error: { message: 'relation "cardrail_users" does not exist' }
            });

            await expect(syncService.registerUser(passphrase)).rejects.toThrow('Database not set up');
        });

        it('should handle Supabase insert error', async () => {
            const passphrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

            mockSupabase.from().select().eq().single.mockResolvedValueOnce({
                data: null,
                error: { code: 'PGRST116' }
            });

            mockSupabase.from().insert().select().single.mockResolvedValueOnce({
                data: null,
                error: { message: 'Database connection failed' }
            });

            await expect(syncService.registerUser(passphrase)).rejects.toThrow('Failed to register user: Database connection failed');
        });

        it('should handle empty data response', async () => {
            const passphrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

            mockSupabase.from().select().eq().single.mockResolvedValueOnce({
                data: null,
                error: { code: 'PGRST116' }
            });

            mockSupabase.from().insert().select().single.mockResolvedValueOnce({
                data: null,
                error: null
            });

            await expect(syncService.registerUser(passphrase)).rejects.toThrow('Failed to register user: No data returned from database');
        });
    });

    describe('Supabase Configuration', () => {
        it('should check Supabase configuration before operations', async () => {
            const { isSupabaseConfigured } = await import('../lib/supabase');

            vi.mocked(isSupabaseConfigured).mockReturnValue(false);

            const passphrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

            await expect(syncService.registerUser(passphrase)).rejects.toThrow('Supabase not configured');
        });
    });
});
