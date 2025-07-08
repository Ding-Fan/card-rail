import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { syncService } from '../lib/syncService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { TEST_PHRASES, EXPECTED_USER_IDS } from './testUtils';

// Skip tests if Supabase is not configured
const skipTests = !isSupabaseConfigured();

describe.skipIf(skipTests)('Real User Creation Flow Test', () => {
    const testUserId = 'test-user-' + Date.now();
    const testPassphrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

    afterEach(async () => {
        if (!skipTests) {
            // Clean up test user
            await supabase.from('cardrail_users').delete().eq('id', testUserId);
            await supabase.from('cardrail_users').delete().like('id', 'test-%');
        }
    });

    it('should create a new user successfully', async () => {
        try {
            // Use syncService to register user
            const result = await syncService.registerUser(testPassphrase);

            console.log('User registration result:', result);

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('passphrase');
            expect(result).toHaveProperty('created_at');
            expect(result.passphrase).toBe(testPassphrase);

            // Verify user was created in database
            const { data: verifyUser, error } = await supabase
                .from('cardrail_users')
                .select('*')
                .eq('id', result.id)
                .single();

            expect(error).toBeNull();
            expect(verifyUser).toMatchObject({
                id: result.id,
                passphrase: testPassphrase
            });

        } catch (error) {
            console.error('User creation failed:', error);
            throw error;
        }
    });

    it('should return existing user when already exists', async () => {
        // First, create a user manually
        const userId = EXPECTED_USER_IDS[testPassphrase];

        const { data: insertData, error: insertError } = await supabase
            .from('cardrail_users')
            .insert({ id: userId, passphrase: testPassphrase })
            .select()
            .single();

        expect(insertError).toBeNull();
        expect(insertData).toMatchObject({ id: userId, passphrase: testPassphrase });

        // Now try to register the same user again
        const result = await syncService.registerUser(testPassphrase);

        expect(result.id).toBe(userId);
        expect(result.passphrase).toBe(testPassphrase);
    });

    it('should handle invalid passphrase', async () => {
        const invalidPassphrase = 'invalid passphrase';

        await expect(syncService.registerUser(invalidPassphrase)).rejects.toThrow();
    });

    it('should validate passphrase length', async () => {
        const shortPassphrase = 'too short';

        await expect(syncService.registerUser(shortPassphrase)).rejects.toThrow();
    });
});

describe('User Creation Flow (No Supabase)', () => {
    it('should show setup instructions when Supabase not configured', () => {
        if (!isSupabaseConfigured()) {
            console.log('Supabase is not configured.');
            console.log('To test real user creation, please:');
            console.log('1. Set up Supabase environment variables');
            console.log('2. Run the database schema setup');
            console.log('3. See SUPABASE_SETUP.md for instructions');

            expect(isSupabaseConfigured()).toBe(false);
        } else {
            console.log('Supabase is configured and ready for testing');
            expect(isSupabaseConfigured()).toBe(true);
        }
    });
});
