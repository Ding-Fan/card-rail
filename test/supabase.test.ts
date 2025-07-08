import { describe, it, expect, vi } from 'vitest';
import { isSupabaseConfigured } from '../lib/supabase';

describe('Supabase Integration', () => {
    describe('Configuration Check', () => {
        it('should check if Supabase is configured', () => {
            const isConfigured = isSupabaseConfigured();
            expect(typeof isConfigured).toBe('boolean');

            // Log the configuration status for debugging
            console.log('Supabase configured:', isConfigured);

            if (isConfigured) {
                // If configured, environment variables should be present
                expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
                expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
            }
        });

        it('should handle missing environment variables', () => {
            // Test with missing environment variables
            const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            // Temporarily remove environment variables
            delete process.env.NEXT_PUBLIC_SUPABASE_URL;
            delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            const isConfigured = isSupabaseConfigured();
            expect(isConfigured).toBe(false);

            // Restore environment variables
            if (originalUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
            if (originalKey) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
        });
    });

    describe('Database Setup Validation', () => {
        it('should provide setup instructions when database is not ready', () => {
            // This test always passes but provides useful information
            const setupInstructions = `
🔧 To set up the database for testing:

1. Ensure .env.local has your Supabase credentials:
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

2. Run the database schema:
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor
   - Copy and paste the contents of supabase-schema-simple.sql
   - Click Run

3. Run the full test suite:
   npm run test:sync:db

See SUPABASE_SETUP.md for detailed instructions.
      `;

            if (!isSupabaseConfigured()) {
                console.log(setupInstructions);
            }

            expect(true).toBe(true);
        });
    });
});
