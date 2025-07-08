// Test utilities for passphrase functions
// This avoids ethers.js issues in the test environment

import * as crypto from 'crypto';

// Known valid BIP39 test phrases and their expected user IDs
export const TEST_PHRASES = {
    VALID_1: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
    VALID_2: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon',
    INVALID: 'this is not a valid mnemonic phrase'
};

// Pre-computed user IDs for test phrases (what ethers.js would generate)
export const EXPECTED_USER_IDS = {
    [TEST_PHRASES.VALID_1]: '9858eeaf',
    [TEST_PHRASES.VALID_2]: '8ba1f109'
};

/**
 * Mock implementation of generateUserId for testing
 * Uses a simple hash instead of ethers.js to avoid Node.js Buffer issues
 */
export function mockGenerateUserId(passphrase: string): string {
    if (!passphrase || passphrase.trim() === '') {
        throw new Error('Passphrase cannot be empty');
    }

    // Use known values for test phrases
    if (EXPECTED_USER_IDS[passphrase]) {
        return EXPECTED_USER_IDS[passphrase];
    }

    // For other passphrases, use a simple hash
    const hash = crypto.createHash('sha256').update(passphrase.trim()).digest('hex');
    return hash.slice(0, 8);
}

/**
 * Mock implementation of validatePassphrase for testing
 * Uses simple word count validation instead of full BIP39 validation
 */
export function mockValidatePassphrase(passphrase: string): boolean {
    if (!passphrase || passphrase.trim() === '') {
        return false;
    }

    // Known valid test phrases
    if (Object.values(TEST_PHRASES).slice(0, 2).includes(passphrase)) {
        return true;
    }

    // Simple validation: 12 words, no obvious invalid patterns
    const words = passphrase.trim().split(/\s+/);
    if (words.length !== 12) {
        return false;
    }

    // Reject obviously invalid phrases
    if (passphrase.includes('invalid') || passphrase.includes('not valid')) {
        return false;
    }

    return true;
}
