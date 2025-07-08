import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { TEST_PHRASES, EXPECTED_USER_IDS, mockGenerateUserId } from './testUtils';

// Use constant test phrases
const TEST_PASSPHRASE = TEST_PHRASES.VALID_1;
const TEST_USER_ID = EXPECTED_USER_IDS[TEST_PASSPHRASE];

// Skip tests if Supabase is not configured
const skipTests = !isSupabaseConfigured();

describe.skipIf(skipTests)('Supabase Integration Tests', () => {
    // Clean up any test data
    afterEach(async () => {
        if (!skipTests) {
            // Clean up test data
            await supabase.from('cardrail_notes').delete().like('id', 'test-%');
            await supabase.from('cardrail_users').delete().like('id', 'test-%');
        }
    });

    describe('Database Schema', () => {
        it('should have cardrail_users table', async () => {
            const { error } = await supabase
                .from('cardrail_users')
                .select('*')
                .limit(0);

            if (error?.message?.includes('relation "cardrail_users" does not exist')) {
                throw new Error('Database not set up. Please run: npm run db:setup');
            }

            expect(error).toBeNull();
        });

        it('should have cardrail_notes table', async () => {
            const { error } = await supabase
                .from('cardrail_notes')
                .select('*')
                .limit(0);

            if (error?.message?.includes('relation "cardrail_notes" does not exist')) {
                throw new Error('Database not set up. Please run: npm run db:setup');
            }

            expect(error).toBeNull();
        });
    });

    describe('User Operations', () => {
        it('should insert and retrieve a test user', async () => {
            const testUser = {
                id: 'test-user-' + Date.now(),
                passphrase: TEST_PASSPHRASE
            };

            // Insert user
            const { data: insertData, error: insertError } = await supabase
                .from('cardrail_users')
                .insert(testUser)
                .select()
                .single();

            expect(insertError).toBeNull();
            expect(insertData).toMatchObject(testUser);

            // Retrieve user
            const { data: selectData, error: selectError } = await supabase
                .from('cardrail_users')
                .select('*')
                .eq('id', testUser.id)
                .single();

            expect(selectError).toBeNull();
            expect(selectData).toMatchObject(testUser);
        });

        it('should work with the constant test passphrase', async () => {
            const testUser = {
                id: 'test-' + TEST_USER_ID,
                passphrase: TEST_PASSPHRASE
            };

            // Insert user
            const { data, error } = await supabase
                .from('cardrail_users')
                .insert(testUser)
                .select()
                .single();

            expect(error).toBeNull();
            expect(data.id).toBe(testUser.id);
            expect(data.passphrase).toBe(TEST_PASSPHRASE);

            console.log('Successfully tested with constant passphrase');
            console.log('User ID:', data.id);
        });
    });

    describe('Note Operations', () => {
        it('should insert and retrieve a test note', async () => {
            // First create a test user
            const testUser = {
                id: 'test-user-' + Date.now(),
                passphrase: TEST_PASSPHRASE
            };

            await supabase.from('cardrail_users').insert(testUser);

            // Create a test note
            const testNote = {
                id: 'test-note-' + Date.now(),
                user_id: testUser.id,
                title: 'Test Note',
                content: 'Test content',
                is_archived: false
            };

            // Insert note
            const { data: insertData, error: insertError } = await supabase
                .from('cardrail_notes')
                .insert(testNote)
                .select()
                .single();

            expect(insertError).toBeNull();
            expect(insertData).toMatchObject(testNote);

            // Retrieve note
            const { data: selectData, error: selectError } = await supabase
                .from('cardrail_notes')
                .select('*')
                .eq('id', testNote.id)
                .single();

            expect(selectError).toBeNull();
            expect(selectData).toMatchObject(testNote);
        });
    });
});

describe.skipIf(!skipTests)('Supabase Not Configured', () => {
    it('should provide setup instructions', () => {
        if (skipTests) {
            console.log(`
🔧 Supabase Database Setup Required

To run database integration tests:

1. Create a Supabase project at https://supabase.com
2. Add your credentials to .env.local:
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
3. Run the database schema:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the script from supabase-schema-simple.sql
4. Run tests: npm run test:db

See SUPABASE_SETUP.md for detailed instructions.
      `);
        }

        expect(true).toBe(true); // Always pass
    });
});
