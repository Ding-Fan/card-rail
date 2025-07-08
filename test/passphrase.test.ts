import { describe, it, expect } from 'vitest';
import { generateUserId, validatePassphrase } from '../lib/passphrase';

// Use constant test phrases that are valid BIP39 mnemonics
const TEST_PASSPHRASE = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const INVALID_PASSPHRASE = 'this is not a valid mnemonic phrase';

describe('Passphrase Functions', () => {
    describe('validatePassphrase', () => {
        it('should validate a correct BIP39 mnemonic', () => {
            expect(validatePassphrase(TEST_PASSPHRASE)).toBe(true);
        });

        it('should reject an invalid mnemonic', () => {
            expect(validatePassphrase(INVALID_PASSPHRASE)).toBe(false);
        });

        it('should reject empty string', () => {
            expect(validatePassphrase('')).toBe(false);
        });

        it('should reject string with wrong word count', () => {
            expect(validatePassphrase('abandon abandon abandon')).toBe(false);
        });
    });

    describe('generateUserId', () => {
        it('should generate consistent user ID from the same passphrase', () => {
            const userId1 = generateUserId(TEST_PASSPHRASE);
            const userId2 = generateUserId(TEST_PASSPHRASE);

            expect(userId1).toBe(userId2);
            expect(userId1).toHaveLength(8);
            expect(userId1).toMatch(/^[a-f0-9]+$/);
        });

        it('should generate different user IDs for different passphrases', () => {
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
            expect(() => generateUserId(INVALID_PASSPHRASE)).toThrow('Invalid passphrase');
        });

        it('should generate expected user ID for test passphrase', () => {
            // This test ensures the user ID generation is deterministic
            const userId = generateUserId(TEST_PASSPHRASE);

            // The user ID should be 8 characters long and hexadecimal
            expect(userId).toHaveLength(8);
            expect(userId).toMatch(/^[a-f0-9]+$/);

            // Since we're using a fixed passphrase, the user ID should always be the same
            // This is useful for testing database operations
            console.log('Generated user ID for test passphrase:', userId);
        });
    });
});

it('should validate generated passphrases', () => {
    for (let i = 0; i < 10; i++) {
        const passphrase = generatePassphrase();
        expect(validatePassphrase(passphrase)).toBe(true);
    }
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

    it('should generate user IDs for all generated passphrases', () => {
        for (let i = 0; i < 5; i++) {
            const passphrase = generatePassphrase();
            const userId = generateUserId(passphrase);

            expect(userId).toBeDefined();
            expect(userId).toHaveLength(8);
            expect(userId).toMatch(/^[a-f0-9]+$/);
        }
    });
});

describe('End-to-End Passphrase Flow', () => {
    it('should complete full passphrase workflow', () => {
        // Generate a new passphrase
        const passphrase = generatePassphrase();

        // Validate it
        expect(validatePassphrase(passphrase)).toBe(true);

        // Generate user ID
        const userId = generateUserId(passphrase);

        // Verify user ID format
        expect(userId).toHaveLength(8);
        expect(userId).toMatch(/^[a-f0-9]+$/);

        // Verify consistency
        const userId2 = generateUserId(passphrase);
        expect(userId).toBe(userId2);
    });

    it('should handle multiple users with different passphrases', () => {
        const users = [];

        for (let i = 0; i < 3; i++) {
            const passphrase = generatePassphrase();
            const userId = generateUserId(passphrase);

            users.push({ passphrase, userId });
        }

        // All passphrases should be different
        const passphrases = users.map(u => u.passphrase);
        const uniquePassphrases = [...new Set(passphrases)];
        expect(uniquePassphrases).toHaveLength(3);

        // All user IDs should be different
        const userIds = users.map(u => u.userId);
        const uniqueUserIds = [...new Set(userIds)];
        expect(uniqueUserIds).toHaveLength(3);
    });
});
});
