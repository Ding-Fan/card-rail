import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TEST_PHRASES, EXPECTED_USER_IDS } from './testUtils';

// Mock Supabase - define mock objects outside to avoid hoisting issues
vi.mock('../lib/supabase', () => {
    const mockFrom = vi.fn(() => ({
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
    }));

    return {
        supabase: { from: mockFrom },
        isSupabaseConfigured: vi.fn(() => true)
    };
});

// Mock passphrase functions
vi.mock('../lib/passphrase', () => ({
    generateUserId: (passphrase: string) => {
        if (!passphrase || passphrase.trim() === '') {
            throw new Error('Passphrase cannot be empty');
        }
        if (passphrase === TEST_PHRASES.VALID_1) {
            return EXPECTED_USER_IDS[TEST_PHRASES.VALID_1];
        }
        if (passphrase === TEST_PHRASES.VALID_2) {
            return EXPECTED_USER_IDS[TEST_PHRASES.VALID_2];
        }
        // Simple hash for other passphrases
        return 'test1234';
    },
    validatePassphrase: (passphrase: string) => {
        return passphrase === TEST_PHRASES.VALID_1 || passphrase === TEST_PHRASES.VALID_2;
    }
}));

// Import after mocking
import { syncService } from '../lib/syncService';
import { supabase } from '../lib/supabase';

describe('Sync Service with Mocked Passphrase Functions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('User Registration', () => {
        it('should register a new user successfully', async () => {
            const testPassphrase = TEST_PHRASES.VALID_1;
            const expectedUserId = EXPECTED_USER_IDS[testPassphrase];

            const mockUser = {
                id: expectedUserId,
                passphrase: testPassphrase,
                created_at: new Date().toISOString()
            };

            // Mock user not found
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValueOnce({
                            data: null,
                            error: { code: 'PGRST116' }
                        })
                    })
                }),
                insert: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValueOnce({
                            data: mockUser,
                            error: null
                        })
                    })
                })
            } as any);

            const result = await syncService.registerUser(testPassphrase);

            expect(result).toEqual(mockUser);
            expect(supabase.from).toHaveBeenCalledWith('cardrail_users');
        });

        it('should return existing user when user already exists', async () => {
            const testPassphrase = TEST_PHRASES.VALID_1;
            const expectedUserId = EXPECTED_USER_IDS[testPassphrase];

            const existingUser = {
                id: expectedUserId,
                passphrase: testPassphrase,
                created_at: '2024-01-01T00:00:00.000Z'
            };

            // Mock existing user found
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValueOnce({
                            data: existingUser,
                            error: null
                        })
                    })
                })
            } as any);

            const result = await syncService.registerUser(testPassphrase);

            expect(result).toEqual(existingUser);
        });

        it('should handle database setup errors', async () => {
            const testPassphrase = TEST_PHRASES.VALID_1;

            // Mock database table not found
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValueOnce({
                            data: null,
                            error: { message: 'relation "cardrail_users" does not exist' }
                        })
                    })
                })
            } as any);

            await expect(syncService.registerUser(testPassphrase)).rejects.toThrow('Database not set up');
        });
    });

    describe('Test Data Consistency', () => {
        it('should use consistent test data', () => {
            console.log('Test phrases and expected user IDs:');
            console.log(`"${TEST_PHRASES.VALID_1}" -> "${EXPECTED_USER_IDS[TEST_PHRASES.VALID_1]}"`);
            console.log(`"${TEST_PHRASES.VALID_2}" -> "${EXPECTED_USER_IDS[TEST_PHRASES.VALID_2]}"`);

            expect(EXPECTED_USER_IDS[TEST_PHRASES.VALID_1]).toBe('9858eeaf');
            expect(EXPECTED_USER_IDS[TEST_PHRASES.VALID_2]).toBe('8ba1f109');
        });
    });
});
