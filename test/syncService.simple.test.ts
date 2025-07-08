import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncService } from '../lib/syncService';
import { generateUserId } from '../lib/passphrase';

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

// Use constant test phrases
const TEST_PASSPHRASE = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const TEST_USER_ID = generateUserId(TEST_PASSPHRASE);

describe('Sync Service with Constant Phrases', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('User Registration', () => {
        it('should register a new user with constant passphrase', async () => {
            const mockUser = {
                id: TEST_USER_ID,
                passphrase: TEST_PASSPHRASE,
                created_at: new Date().toISOString()
            };

            // Mock user not found
            mockSupabase.from().select().eq().single.mockResolvedValueOnce({
                data: null,
                error: { code: 'PGRST116' }
            });

            // Mock successful user creation
            mockSupabase.from().insert().select().single.mockResolvedValueOnce({
                data: mockUser,
                error: null
            });

            const result = await syncService.registerUser(TEST_PASSPHRASE);

            expect(result).toEqual(mockUser);
            expect(mockSupabase.from).toHaveBeenCalledWith('cardrail_users');
        });

        it('should return existing user with matching passphrase', async () => {
            const existingUser = {
                id: TEST_USER_ID,
                passphrase: TEST_PASSPHRASE,
                created_at: '2024-01-01T00:00:00.000Z'
            };

            mockSupabase.from().select().eq().single.mockResolvedValueOnce({
                data: existingUser,
                error: null
            });

            const result = await syncService.registerUser(TEST_PASSPHRASE);

            expect(result).toEqual(existingUser);
        });

        it('should reject invalid passphrase for existing user', async () => {
            const existingUser = {
                id: TEST_USER_ID,
                passphrase: 'different passphrase',
                created_at: '2024-01-01T00:00:00.000Z'
            };

            mockSupabase.from().select().eq().single.mockResolvedValueOnce({
                data: existingUser,
                error: null
            });

            await expect(syncService.registerUser(TEST_PASSPHRASE)).rejects.toThrow('Invalid passphrase for existing user');
        });

        it('should handle database not found error', async () => {
            mockSupabase.from().select().eq().single.mockResolvedValueOnce({
                data: null,
                error: { message: 'relation "cardrail_users" does not exist' }
            });

            await expect(syncService.registerUser(TEST_PASSPHRASE)).rejects.toThrow('Database not set up');
        });
    });

    describe('User ID Generation', () => {
        it('should generate consistent user ID for test passphrase', () => {
            const userId1 = generateUserId(TEST_PASSPHRASE);
            const userId2 = generateUserId(TEST_PASSPHRASE);

            expect(userId1).toBe(userId2);
            expect(userId1).toBe(TEST_USER_ID);
            console.log('Test User ID:', TEST_USER_ID);
        });
    });
});
