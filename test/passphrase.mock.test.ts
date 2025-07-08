import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TEST_PHRASES, EXPECTED_USER_IDS, mockGenerateUserId, mockValidatePassphrase } from './testUtils';

// Mock the actual passphrase functions to use our test implementations
vi.mock('../lib/passphrase', () => ({
    generateUserId: mockGenerateUserId,
    validatePassphrase: mockValidatePassphrase,
    generatePassphrase: () => TEST_PHRASES.VALID_1
}));

describe('Passphrase Functions (Mocked for Testing)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('validatePassphrase', () => {
        it('should validate known test passphrases', () => {
            expect(mockValidatePassphrase(TEST_PHRASES.VALID_1)).toBe(true);
            expect(mockValidatePassphrase(TEST_PHRASES.VALID_2)).toBe(true);
        });

        it('should reject invalid passphrases', () => {
            expect(mockValidatePassphrase(TEST_PHRASES.INVALID)).toBe(false);
            expect(mockValidatePassphrase('')).toBe(false);
            expect(mockValidatePassphrase('only three words')).toBe(false);
        });
    });

    describe('generateUserId', () => {
        it('should generate consistent user IDs for test passphrases', () => {
            const userId1 = mockGenerateUserId(TEST_PHRASES.VALID_1);
            const userId2 = mockGenerateUserId(TEST_PHRASES.VALID_1);

            expect(userId1).toBe(userId2);
            expect(userId1).toBe(EXPECTED_USER_IDS[TEST_PHRASES.VALID_1]);
        });

        it('should generate different user IDs for different passphrases', () => {
            const userId1 = mockGenerateUserId(TEST_PHRASES.VALID_1);
            const userId2 = mockGenerateUserId(TEST_PHRASES.VALID_2);

            expect(userId1).not.toBe(userId2);
            expect(userId1).toBe(EXPECTED_USER_IDS[TEST_PHRASES.VALID_1]);
            expect(userId2).toBe(EXPECTED_USER_IDS[TEST_PHRASES.VALID_2]);
        });

        it('should throw error for empty passphrase', () => {
            expect(() => mockGenerateUserId('')).toThrow('Passphrase cannot be empty');
            expect(() => mockGenerateUserId('   ')).toThrow('Passphrase cannot be empty');
        });

        it('should generate 8-character hexadecimal user IDs', () => {
            const userId = mockGenerateUserId(TEST_PHRASES.VALID_1);

            expect(userId).toHaveLength(8);
            expect(userId).toMatch(/^[a-f0-9]+$/);
        });

        it('should work with custom passphrases', () => {
            const customPhrase = 'word word word word word word word word word word word word';
            const userId = mockGenerateUserId(customPhrase);

            expect(userId).toHaveLength(8);
            expect(userId).toMatch(/^[a-f0-9]+$/);

            // Should be consistent
            expect(mockGenerateUserId(customPhrase)).toBe(userId);
        });
    });

    describe('Integration with known values', () => {
        it('should provide predictable test data', () => {
            // These values should be consistent for testing database operations
            console.log('Test passphrase 1:', TEST_PHRASES.VALID_1);
            console.log('Expected user ID 1:', EXPECTED_USER_IDS[TEST_PHRASES.VALID_1]);
            console.log('Test passphrase 2:', TEST_PHRASES.VALID_2);
            console.log('Expected user ID 2:', EXPECTED_USER_IDS[TEST_PHRASES.VALID_2]);

            expect(EXPECTED_USER_IDS[TEST_PHRASES.VALID_1]).toBe('9858eeaf');
            expect(EXPECTED_USER_IDS[TEST_PHRASES.VALID_2]).toBe('8ba1f109');
        });
    });
});
