import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TEST_PHRASES, EXPECTED_USER_IDS } from './testUtils';

// Mock Supabase with detailed user table operations
vi.mock('../lib/supabase', () => {
    const mockFrom = vi.fn();
    const mockSupabase = { from: mockFrom };

    return {
        supabase: mockSupabase,
        isSupabaseConfigured: vi.fn(() => true)
    };
});

// Mock passphrase functions with deterministic results
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
        // Generate a simple hash for other passphrases
        return 'test' + passphrase.split(' ').length.toString().padStart(4, '0');
    },
    validatePassphrase: (passphrase: string) => {
        return passphrase === TEST_PHRASES.VALID_1 ||
            passphrase === TEST_PHRASES.VALID_2 ||
            passphrase.split(' ').length === 12; // Valid BIP39 length
    }
}));

// Import after mocking
import { syncService } from '../lib/syncService';
import { supabase } from '../lib/supabase';

describe('CardRail User Database Table - New User Flow', () => {
    let mockFromResult: any;
    let mockSelect: any;
    let mockEq: any;
    let mockSingle: any;
    let mockInsert: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Set up mock chain for database operations
        mockSingle = vi.fn();
        mockEq = vi.fn(() => ({ single: mockSingle }));
        mockSelect = vi.fn(() => ({ eq: mockEq, single: mockSingle }));
        mockInsert = vi.fn(() => ({ select: mockSelect }));

        mockFromResult = {
            select: mockSelect,
            insert: mockInsert
        };

        vi.mocked(supabase.from).mockReturnValue(mockFromResult);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('User Registration - New User Flow', () => {
        it('should successfully register a new user with valid passphrase', async () => {
            const testPassphrase = TEST_PHRASES.VALID_1;
            const expectedUserId = EXPECTED_USER_IDS[testPassphrase];
            const mockTimestamp = '2024-01-01T00:00:00.000Z';

            const expectedUser = {
                id: expectedUserId,
                passphrase: testPassphrase,
                created_at: mockTimestamp
            };

            // Mock user doesn't exist (first select call)
            mockSelect.mockReturnValueOnce({ eq: mockEq });
            mockEq.mockReturnValueOnce({ single: mockSingle });
            mockSingle.mockResolvedValueOnce({
                data: null,
                error: { code: 'PGRST116' } // Not found error
            });

            // Mock successful user creation (insert call)
            mockInsert.mockReturnValueOnce({ select: mockSelect });
            mockSelect.mockReturnValueOnce({ single: mockSingle });
            mockSingle.mockResolvedValueOnce({
                data: expectedUser,
                error: null
            });

            const result = await syncService.registerUser(testPassphrase);

            expect(result).toEqual(expectedUser);
            expect(supabase.from).toHaveBeenCalledWith('cardrail_users');
            expect(mockInsert).toHaveBeenCalledWith({
                id: expectedUserId,
                passphrase: testPassphrase
            });
        });

        it('should generate correct user ID from passphrase', async () => {
            const testPassphrase = TEST_PHRASES.VALID_1;
            const expectedUserId = EXPECTED_USER_IDS[testPassphrase];

            // Mock user doesn't exist
            mockSingle.mockResolvedValueOnce({
                data: null,
                error: { code: 'PGRST116' }
            });

            // Mock successful creation
            mockSingle.mockResolvedValueOnce({
                data: { id: expectedUserId, passphrase: testPassphrase },
                error: null
            });

            await syncService.registerUser(testPassphrase);

            expect(mockEq).toHaveBeenCalledWith('id', expectedUserId);
            expect(mockInsert).toHaveBeenCalledWith({
                id: expectedUserId,
                passphrase: testPassphrase
            });
        });

        it('should handle concurrent user registration attempts', async () => {
            const testPassphrase = TEST_PHRASES.VALID_1;
            const expectedUserId = EXPECTED_USER_IDS[testPassphrase];
            const existingUser = {
                id: expectedUserId,
                passphrase: testPassphrase,
                created_at: '2024-01-01T00:00:00.000Z'
            };

            // First call: user doesn't exist
            mockSingle.mockResolvedValueOnce({
                data: null,
                error: { code: 'PGRST116' }
            });

            // Insert fails due to unique constraint (concurrent creation)
            mockSingle.mockResolvedValueOnce({
                data: null,
                error: {
                    code: '23505',
                    message: 'duplicate key value violates unique constraint "cardrail_users_pkey"'
                }
            });

            // First attempt should handle the unique constraint error
            await expect(syncService.registerUser(testPassphrase)).rejects.toThrow('Failed to register user');
        });

        it('should validate passphrase before creating user', async () => {
            const invalidPassphrase = 'invalid phrase';

            // This should fail at the passphrase validation level
            await expect(syncService.registerUser(invalidPassphrase)).rejects.toThrow();
        });

        it('should handle empty or null passphrase', async () => {
            await expect(syncService.registerUser('')).rejects.toThrow('Passphrase cannot be empty');
            await expect(syncService.registerUser('   ')).rejects.toThrow('Passphrase cannot be empty');
        });

        it('should create user with proper database schema', async () => {
            const testPassphrase = TEST_PHRASES.VALID_2;
            const expectedUserId = EXPECTED_USER_IDS[testPassphrase];

            // Mock user doesn't exist
            mockSingle.mockResolvedValueOnce({
                data: null,
                error: { code: 'PGRST116' }
            });

            // Mock successful creation with schema validation
            const createdUser = {
                id: expectedUserId,
                passphrase: testPassphrase,
                created_at: '2024-01-01T00:00:00.000Z'
            };

            mockSingle.mockResolvedValueOnce({
                data: createdUser,
                error: null
            });

            const result = await syncService.registerUser(testPassphrase);

            // Verify user object structure matches database schema
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('passphrase');
            expect(result).toHaveProperty('created_at');
            expect(typeof result.id).toBe('string');
            expect(typeof result.passphrase).toBe('string');
            expect(typeof result.created_at).toBe('string');
            expect(result.id).toMatch(/^[a-f0-9]{8}$/); // 8-character hex user ID
        });
    });

    describe('User Table Operations', () => {
        it('should check for existing user before creation', async () => {
            const testPassphrase = TEST_PHRASES.VALID_1;
            const expectedUserId = EXPECTED_USER_IDS[testPassphrase];

            // Mock user doesn't exist
            mockSingle.mockResolvedValueOnce({
                data: null,
                error: { code: 'PGRST116' }
            });

            // Mock successful creation
            mockSingle.mockResolvedValueOnce({
                data: { id: expectedUserId, passphrase: testPassphrase },
                error: null
            });

            await syncService.registerUser(testPassphrase);

            // Verify the select operation was called first
            expect(mockSelect).toHaveBeenCalledWith('*');
            expect(mockEq).toHaveBeenCalledWith('id', expectedUserId);
            expect(mockSingle).toHaveBeenCalledTimes(2); // Once for select, once for insert
        });

        it('should return existing user when found', async () => {
            const testPassphrase = TEST_PHRASES.VALID_1;
            const expectedUserId = EXPECTED_USER_IDS[testPassphrase];
            const existingUser = {
                id: expectedUserId,
                passphrase: testPassphrase,
                created_at: '2024-01-01T00:00:00.000Z'
            };

            // Mock existing user found
            mockSingle.mockResolvedValueOnce({
                data: existingUser,
                error: null
            });

            const result = await syncService.registerUser(testPassphrase);

            expect(result).toEqual(existingUser);
            expect(mockInsert).not.toHaveBeenCalled(); // Should not attempt to insert
        });

        it('should validate passphrase for existing user', async () => {
            const testPassphrase = TEST_PHRASES.VALID_1;
            const wrongPassphrase = TEST_PHRASES.VALID_2;
            const expectedUserId = EXPECTED_USER_IDS[testPassphrase];
            const existingUser = {
                id: expectedUserId,
                passphrase: testPassphrase,
                created_at: '2024-01-01T00:00:00.000Z'
            };

            // Mock existing user found
            mockSingle.mockResolvedValueOnce({
                data: existingUser,
                error: null
            });

            // Should throw error for wrong passphrase
            await expect(syncService.registerUser(wrongPassphrase)).rejects.toThrow('Invalid passphrase for existing user');
        });

        it('should handle database connection errors', async () => {
            const testPassphrase = TEST_PHRASES.VALID_1;

            // Mock database connection error
            mockSingle.mockRejectedValueOnce({
                code: 'ECONNREFUSED',
                message: 'Connection refused'
            });

            await expect(syncService.registerUser(testPassphrase)).rejects.toThrow();
        });

        it('should handle missing database table error', async () => {
            const testPassphrase = TEST_PHRASES.VALID_1;

            // Mock table doesn't exist error
            mockSingle.mockResolvedValueOnce({
                data: null,
                error: {
                    code: '42P01',
                    message: 'relation "cardrail_users" does not exist'
                }
            });

            await expect(syncService.registerUser(testPassphrase)).rejects.toThrow('Database not set up');
        });
    });

    describe('User ID Generation', () => {
        it('should generate consistent user IDs for same passphrase', async () => {
            const testPassphrase = TEST_PHRASES.VALID_1;
            const expectedUserId = EXPECTED_USER_IDS[testPassphrase];

            // Mock user doesn't exist
            mockSingle.mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' }
            });

            // Mock successful creation
            mockSingle.mockResolvedValue({
                data: { id: expectedUserId, passphrase: testPassphrase },
                error: null
            });

            // Call multiple times with same passphrase
            await syncService.registerUser(testPassphrase);
            await syncService.registerUser(testPassphrase);

            // Should always use the same user ID
            expect(mockEq).toHaveBeenCalledWith('id', expectedUserId);
        });

        it('should generate different user IDs for different passphrases', async () => {
            const phrase1 = TEST_PHRASES.VALID_1;
            const phrase2 = TEST_PHRASES.VALID_2;
            const userId1 = EXPECTED_USER_IDS[phrase1];
            const userId2 = EXPECTED_USER_IDS[phrase2];

            expect(userId1).not.toBe(userId2);
            expect(userId1).toBe('9858eeaf');
            expect(userId2).toBe('8ba1f109');
        });

        it('should generate 8-character hexadecimal user IDs', async () => {
            const testPassphrase = TEST_PHRASES.VALID_1;
            const expectedUserId = EXPECTED_USER_IDS[testPassphrase];

            expect(expectedUserId).toMatch(/^[a-f0-9]{8}$/);
            expect(expectedUserId).toHaveLength(8);
        });
    });

    describe('Test Data Integrity', () => {
        it('should use consistent test data across all tests', () => {
            expect(TEST_PHRASES.VALID_1).toBe('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
            expect(TEST_PHRASES.VALID_2).toBe('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon');
            expect(EXPECTED_USER_IDS[TEST_PHRASES.VALID_1]).toBe('9858eeaf');
            expect(EXPECTED_USER_IDS[TEST_PHRASES.VALID_2]).toBe('8ba1f109');
        });

        it('should provide predictable test scenarios', () => {
            // This test documents the expected behavior for debugging
            const scenarios = [
                { passphrase: TEST_PHRASES.VALID_1, expectedUserId: '9858eeaf' },
                { passphrase: TEST_PHRASES.VALID_2, expectedUserId: '8ba1f109' }
            ];

            scenarios.forEach(({ passphrase, expectedUserId }) => {
                expect(EXPECTED_USER_IDS[passphrase]).toBe(expectedUserId);
            });
        });
    });
});
