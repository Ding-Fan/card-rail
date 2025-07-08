import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { syncService } from '../lib/syncService';
import { generatePassphrase, generateUserId } from '../lib/passphrase';
import { isSupabaseConfigured } from '../lib/supabase';

// Skip these tests if Supabase is not configured
const isConfigured = isSupabaseConfigured();

describe.skipIf(!isConfigured)('Sync Service Integration Tests', () => {
    let testUsers: string[] = [];

    beforeEach(() => {
        testUsers = [];
    });

    afterEach(async () => {
        // Clean up test users
        if (isConfigured) {
            const { supabase } = await import('../lib/supabase');

            for (const userId of testUsers) {
                try {
                    await supabase.from('cardrail_users').delete().eq('id', userId);
                } catch (error) {
                    console.warn(`Failed to clean up test user ${userId}:`, error);
                }
            }
        }
    });

    describe('User Registration', () => {
        it('should register a new user successfully', async () => {
            const passphrase = generatePassphrase();
            const userId = generateUserId(passphrase);
            testUsers.push(userId);

            const user = await syncService.registerUser(passphrase);

            expect(user).toBeDefined();
            expect(user.id).toBe(userId);
            expect(user.passphrase).toBe(passphrase);
            expect(user.created_at).toBeDefined();
        });

        it('should return existing user with correct passphrase', async () => {
            const passphrase = generatePassphrase();
            const userId = generateUserId(passphrase);
            testUsers.push(userId);

            // Register user first time
            const user1 = await syncService.registerUser(passphrase);

            // Try to register same user again
            const user2 = await syncService.registerUser(passphrase);

            expect(user1.id).toBe(user2.id);
            expect(user1.passphrase).toBe(user2.passphrase);
            expect(user1.created_at).toBe(user2.created_at);
        });

        it('should reject wrong passphrase for existing user', async () => {
            const correctPassphrase = generatePassphrase();
            const wrongPassphrase = generatePassphrase();
            const userId = generateUserId(correctPassphrase);
            testUsers.push(userId);

            // Register user with correct passphrase
            await syncService.registerUser(correctPassphrase);

            // Try to access with wrong passphrase
            await expect(syncService.registerUser(wrongPassphrase)).rejects.toThrow('Invalid passphrase for existing user');
        });

        it('should handle multiple users', async () => {
            const users = [];

            for (let i = 0; i < 3; i++) {
                const passphrase = generatePassphrase();
                const userId = generateUserId(passphrase);
                testUsers.push(userId);

                const user = await syncService.registerUser(passphrase);
                users.push(user);
            }

            // All users should have unique IDs
            const userIds = users.map(u => u.id);
            const uniqueUserIds = [...new Set(userIds)];
            expect(uniqueUserIds).toHaveLength(3);
        });
    });

    describe('Sync Service Configuration', () => {
        it('should initialize sync service', async () => {
            const passphrase = generatePassphrase();
            const userId = generateUserId(passphrase);
            testUsers.push(userId);

            const user = await syncService.registerUser(passphrase);

            const settings = {
                enabled: true,
                user,
                autoSync: true,
                syncInterval: 30000
            };

            // This should not throw an error
            await expect(syncService.initialize(settings)).resolves.toBeUndefined();
        });

        it('should handle sync operations', async () => {
            const passphrase = generatePassphrase();
            const userId = generateUserId(passphrase);
            testUsers.push(userId);

            const user = await syncService.registerUser(passphrase);

            // Test sync notes operation
            const result = await syncService.syncNotes();

            expect(result).toBeDefined();
            expect(typeof result.success).toBe('boolean');
            expect(Array.isArray(result.conflicts)).toBe(true);
        });
    });
});

describe.skipIf(isConfigured)('Sync Service - No Supabase', () => {
    it('should provide setup instructions when Supabase is not configured', () => {
        const setupMessage = `
🔧 Supabase Integration Tests Skipped

To run the full sync integration tests:

1. Set up Supabase:
   - Create a project at https://supabase.com
   - Add credentials to .env.local:
     NEXT_PUBLIC_SUPABASE_URL=your-project-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

2. Set up the database:
   - Run the SQL script from supabase-schema-simple.sql
   - See SUPABASE_SETUP.md for detailed instructions

3. Run the tests:
   npm run test:sync:integration

Current configuration status: ${isSupabaseConfigured() ? 'configured' : 'not configured'}
    `;

        console.log(setupMessage);
        expect(true).toBe(true);
    });
});
