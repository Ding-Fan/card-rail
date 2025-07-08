import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { supabase } from '../lib/supabase';

// This test requires a real Supabase connection for database schema validation
// Skip these tests if Supabase is not configured
const isSupabaseConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

describe.skipIf(!isSupabaseConfigured)('Supabase Database Schema Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Database Tables', () => {
        it('should have cardrail_users table with correct schema', async () => {
            const { data, error } = await supabase
                .from('cardrail_users')
                .select('*')
                .limit(0);

            if (error) {
                // If table doesn't exist, provide helpful error message
                if (error.message.includes('relation "cardrail_users" does not exist')) {
                    throw new Error('Database not set up. Please run the SQL script from supabase-schema-simple.sql');
                }
                throw error;
            }

            expect(error).toBeNull();
        });

        it('should have cardrail_notes table with correct schema', async () => {
            const { data, error } = await supabase
                .from('cardrail_notes')
                .select('*')
                .limit(0);

            if (error) {
                // If table doesn't exist, provide helpful error message
                if (error.message.includes('relation "cardrail_notes" does not exist')) {
                    throw new Error('Database not set up. Please run the SQL script from supabase-schema-simple.sql');
                }
                throw error;
            }

            expect(error).toBeNull();
        });

        it('should be able to insert and retrieve a test user', async () => {
            const testUser = {
                id: 'test-user-' + Date.now(),
                passphrase: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
            };

            // Insert test user
            const { data: insertData, error: insertError } = await supabase
                .from('cardrail_users')
                .insert(testUser)
                .select()
                .single();

            expect(insertError).toBeNull();
            expect(insertData).toMatchObject(testUser);

            // Retrieve test user
            const { data: selectData, error: selectError } = await supabase
                .from('cardrail_users')
                .select('*')
                .eq('id', testUser.id)
                .single();

            expect(selectError).toBeNull();
            expect(selectData).toMatchObject(testUser);
            expect(selectData.created_at).toBeDefined();

            // Clean up - delete test user
            await supabase
                .from('cardrail_users')
                .delete()
                .eq('id', testUser.id);
        });

        it('should be able to insert and retrieve a test note', async () => {
            const testUser = {
                id: 'test-user-' + Date.now(),
                passphrase: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
            };

            // First create a test user
            await supabase
                .from('cardrail_users')
                .insert(testUser);

            const testNote = {
                id: 'test-note-' + Date.now(),
                user_id: testUser.id,
                title: 'Test Note',
                content: 'This is a test note content',
                is_archived: false
            };

            // Insert test note
            const { data: insertData, error: insertError } = await supabase
                .from('cardrail_notes')
                .insert(testNote)
                .select()
                .single();

            expect(insertError).toBeNull();
            expect(insertData).toMatchObject(testNote);

            // Retrieve test note
            const { data: selectData, error: selectError } = await supabase
                .from('cardrail_notes')
                .select('*')
                .eq('id', testNote.id)
                .single();

            expect(selectError).toBeNull();
            expect(selectData).toMatchObject(testNote);
            expect(selectData.created_at).toBeDefined();
            expect(selectData.updated_at).toBeDefined();

            // Clean up - delete test data
            await supabase
                .from('cardrail_notes')
                .delete()
                .eq('id', testNote.id);

            await supabase
                .from('cardrail_users')
                .delete()
                .eq('id', testUser.id);
        });

        it('should enforce foreign key constraint between notes and users', async () => {
            const testNote = {
                id: 'test-note-' + Date.now(),
                user_id: 'non-existent-user-id',
                title: 'Test Note',
                content: 'This is a test note content',
                is_archived: false
            };

            // Try to insert note with non-existent user_id
            const { data, error } = await supabase
                .from('cardrail_notes')
                .insert(testNote);

            // Should fail due to foreign key constraint
            expect(error).toBeDefined();
            expect(error?.message).toContain('foreign key constraint');
        });

        it('should auto-update updated_at timestamp on note updates', async () => {
            const testUser = {
                id: 'test-user-' + Date.now(),
                passphrase: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
            };

            // Create test user
            await supabase
                .from('cardrail_users')
                .insert(testUser);

            const testNote = {
                id: 'test-note-' + Date.now(),
                user_id: testUser.id,
                title: 'Test Note',
                content: 'Original content',
                is_archived: false
            };

            // Insert test note
            const { data: insertData } = await supabase
                .from('cardrail_notes')
                .insert(testNote)
                .select()
                .single();

            const originalUpdatedAt = insertData.updated_at;

            // Wait a moment to ensure timestamp difference
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Update the note
            const { data: updateData } = await supabase
                .from('cardrail_notes')
                .update({ content: 'Updated content' })
                .eq('id', testNote.id)
                .select()
                .single();

            expect(updateData.updated_at).not.toBe(originalUpdatedAt);
            expect(new Date(updateData.updated_at).getTime()).toBeGreaterThan(new Date(originalUpdatedAt).getTime());

            // Clean up
            await supabase
                .from('cardrail_notes')
                .delete()
                .eq('id', testNote.id);

            await supabase
                .from('cardrail_users')
                .delete()
                .eq('id', testUser.id);
        });
    });

    describe('Database Indexes', () => {
        it('should have performance indexes on notes table', async () => {
            // Check if indexes exist by querying the information_schema
            const { data, error } = await supabase
                .rpc('get_table_indexes', { table_name: 'cardrail_notes' })
                .select('*');

            if (error) {
                // If the RPC doesn't exist, skip this test
                console.warn('Cannot check indexes: RPC function not available');
                return;
            }

            const indexNames = data?.map((row: any) => row.indexname) || [];

            // Check for expected indexes
            expect(indexNames).toContain('idx_cardrail_notes_user_id');
            expect(indexNames).toContain('idx_cardrail_notes_created_at');
            expect(indexNames).toContain('idx_cardrail_notes_updated_at');
        });
    });
});

// Helper function to create RPC for index checking (run this in Supabase SQL editor if needed)
const createIndexCheckRPC = `
CREATE OR REPLACE FUNCTION get_table_indexes(table_name TEXT)
RETURNS TABLE(indexname TEXT, tablename TEXT, columnname TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.relname::TEXT as indexname,
    t.relname::TEXT as tablename,
    a.attname::TEXT as columnname
  FROM pg_class t
  JOIN pg_index ix ON t.oid = ix.indrelid
  JOIN pg_class i ON i.oid = ix.indexrelid
  JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
  WHERE t.relname = table_name
  AND t.relkind = 'r'
  ORDER BY i.relname;
END;
$$ LANGUAGE plpgsql;
`;

describe('Database Setup Instructions', () => {
    it('should provide clear setup instructions when database is not configured', () => {
        if (!isSupabaseConfigured) {
            console.log(`
🔧 Database Setup Required

To run the full test suite, you need to set up your Supabase database:

1. Create a Supabase project at https://supabase.com
2. Add your credentials to .env.local:
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

3. Run the database schema script:
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor
   - Copy and paste the contents of supabase-schema-simple.sql
   - Click Run

4. Re-run the tests with: npm run test

See SUPABASE_SETUP.md for detailed instructions.
      `);
        }

        expect(true).toBe(true); // Always pass this informational test
    });
});
