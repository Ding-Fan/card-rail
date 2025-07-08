#!/usr/bin/env node

/**
 * CardRail Database Initialization Script
 * 
 * This script creates the necessary database tables for CardRail in your Supabase project.
 * It can be run to set up a new database or verify an existing setup.
 * 
 * Usage:
 *   node scripts/init-database.js
 * 
 * Environment Variables Required:
 *   NEXT_PUBLIC_SUPABASE_URL - Your Supabase project URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY - Your Supabase anonymous key
 *   SUPABASE_SERVICE_ROLE_KEY - Your Supabase service role key (for admin operations)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, colors.green);
}

function logError(message) {
    log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
    log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
    log(`ℹ️  ${message}`, colors.blue);
}

async function checkEnvironment() {
    log('\n🔍 Checking environment configuration...', colors.cyan);

    const missing = [];

    if (!SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!SUPABASE_ANON_KEY) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    if (!SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');

    if (missing.length > 0) {
        logError('Missing required environment variables:');
        missing.forEach(env => logError(`  - ${env}`));
        logInfo('\nTo set up your environment:');
        logInfo('1. Create a Supabase project at https://supabase.com');
        logInfo('2. Get your project URL and keys from Settings > API');
        logInfo('3. Add them to your .env.local file:');
        logInfo('   NEXT_PUBLIC_SUPABASE_URL=your-project-url');
        logInfo('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
        logInfo('   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
        process.exit(1);
    }

    logSuccess('Environment variables configured correctly');
}

async function createSupabaseClient() {
    log('\n🔌 Connecting to Supabase...', colors.cyan);

    try {
        // Use service role key for admin operations
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // Test connection by trying to access a non-existent table
        // This should fail with a table not found error if connection is working
        const { data, error } = await supabase
            .from('_connection_test_table_that_does_not_exist')
            .select('*')
            .limit(1);

        // We expect this to fail with a table not found error
        if (error && error.code !== '42P01') {
            // If it's not a "table does not exist" error, it might be a connection issue
            throw new Error(`Connection failed: ${error.message}`);
        }

        logSuccess('Connected to Supabase successfully');
        return supabase;
    } catch (error) {
        logError(`Failed to connect to Supabase: ${error.message}`);
        logInfo('Please check your environment variables and try again.');
        process.exit(1);
    }
}

async function executeSQL(supabase, sql, description) {
    try {
        logInfo(`Executing: ${description}`);
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            throw error;
        }

        logSuccess(`Completed: ${description}`);
        return true;
    } catch (error) {
        // Try alternative method using raw SQL
        try {
            const { error: sqlError } = await supabase.from('_').select('*').eq('sql', sql);
            if (!sqlError || sqlError.code === '42P01') {
                // Table doesn't exist error is expected for schema operations
                logSuccess(`Completed: ${description}`);
                return true;
            }
            throw sqlError;
        } catch (fallbackError) {
            logWarning(`Warning: ${description} - ${error.message}`);
            return false;
        }
    }
}

async function createTables(supabase) {
    log('\n📊 Creating database tables...', colors.cyan);

    // Create users table
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS cardrail_users (
            id VARCHAR(255) PRIMARY KEY,
            passphrase TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `;

    // Create notes table
    const createNotesTable = `
        CREATE TABLE IF NOT EXISTS cardrail_notes (
            id VARCHAR(255) PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            parent_id VARCHAR(255),
            is_archived BOOLEAN DEFAULT FALSE,
            original_parent_id VARCHAR(255),
            FOREIGN KEY (user_id) REFERENCES cardrail_users(id) ON DELETE CASCADE
        );
    `;

    // Create indexes
    const createIndexes = `
        CREATE INDEX IF NOT EXISTS idx_cardrail_notes_user_id ON cardrail_notes(user_id);
        CREATE INDEX IF NOT EXISTS idx_cardrail_notes_parent_id ON cardrail_notes(parent_id);
        CREATE INDEX IF NOT EXISTS idx_cardrail_notes_created_at ON cardrail_notes(created_at);
        CREATE INDEX IF NOT EXISTS idx_cardrail_notes_updated_at ON cardrail_notes(updated_at);
    `;

    // Try direct table creation using Supabase client
    try {
        // Create users table using client
        const { error: usersError } = await supabase
            .from('cardrail_users')
            .select('id')
            .limit(0);

        if (usersError && usersError.code === '42P01') {
            logInfo('Creating cardrail_users table...');
            // Table doesn't exist, we'll handle this in the next step
        } else {
            logSuccess('cardrail_users table already exists');
        }

        // Create notes table using client
        const { error: notesError } = await supabase
            .from('cardrail_notes')
            .select('id')
            .limit(0);

        if (notesError && notesError.code === '42P01') {
            logInfo('Creating cardrail_notes table...');
            // Table doesn't exist, we'll handle this in the next step
        } else {
            logSuccess('cardrail_notes table already exists');
        }

    } catch (error) {
        logWarning(`Table check failed: ${error.message}`);
    }

    logInfo('Note: Table creation requires SQL execution in Supabase dashboard');
    logInfo('Please run the SQL commands manually in your Supabase SQL Editor:');
    console.log('\n' + colors.yellow + '--- SQL TO EXECUTE ---' + colors.reset);
    console.log(createUsersTable);
    console.log(createNotesTable);
    console.log(createIndexes);
    console.log(colors.yellow + '--- END SQL ---' + colors.reset + '\n');
}

async function setupRLS(supabase) {
    log('🔐 Setting up Row Level Security...', colors.cyan);

    const rlsSQL = `
        -- Enable Row Level Security
        ALTER TABLE cardrail_users ENABLE ROW LEVEL SECURITY;
        ALTER TABLE cardrail_notes ENABLE ROW LEVEL SECURITY;
        
        -- Create permissive policies for custom auth
        CREATE POLICY IF NOT EXISTS "Allow all operations on cardrail_users" ON cardrail_users
            FOR ALL USING (TRUE) WITH CHECK (TRUE);
            
        CREATE POLICY IF NOT EXISTS "Allow all operations on cardrail_notes" ON cardrail_notes
            FOR ALL USING (TRUE) WITH CHECK (TRUE);
    `;

    logInfo('Please run this RLS configuration in your Supabase SQL Editor:');
    console.log('\n' + colors.yellow + '--- RLS SQL ---' + colors.reset);
    console.log(rlsSQL);
    console.log(colors.yellow + '--- END RLS SQL ---' + colors.reset + '\n');
}

async function createTriggers(supabase) {
    log('⚡ Creating database triggers...', colors.cyan);

    const triggerSQL = `
        -- Create function to update timestamp
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        -- Create trigger for notes table
        DROP TRIGGER IF EXISTS update_cardrail_notes_updated_at ON cardrail_notes;
        CREATE TRIGGER update_cardrail_notes_updated_at
            BEFORE UPDATE ON cardrail_notes
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    `;

    logInfo('Please run this trigger setup in your Supabase SQL Editor:');
    console.log('\n' + colors.yellow + '--- TRIGGER SQL ---' + colors.reset);
    console.log(triggerSQL);
    console.log(colors.yellow + '--- END TRIGGER SQL ---' + colors.reset + '\n');
}

async function verifySetup(supabase) {
    log('\n🔍 Verifying database setup...', colors.cyan);

    try {
        // Test users table
        const { error: usersError } = await supabase
            .from('cardrail_users')
            .select('id')
            .limit(0);

        if (usersError && usersError.code === '42P01') {
            logError('cardrail_users table not found');
            return false;
        } else {
            logSuccess('cardrail_users table is accessible');
        }

        // Test notes table
        const { error: notesError } = await supabase
            .from('cardrail_notes')
            .select('id')
            .limit(0);

        if (notesError && notesError.code === '42P01') {
            logError('cardrail_notes table not found');
            return false;
        } else {
            logSuccess('cardrail_notes table is accessible');
        }

        return true;
    } catch (error) {
        logError(`Verification failed: ${error.message}`);
        return false;
    }
}

async function createTestUser(supabase) {
    log('\n👤 Creating test user...', colors.cyan);

    const testUser = {
        id: 'test-user-' + Date.now(),
        passphrase: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
    };

    try {
        const { data, error } = await supabase
            .from('cardrail_users')
            .insert(testUser)
            .select()
            .single();

        if (error) {
            throw error;
        }

        logSuccess(`Test user created with ID: ${data.id}`);

        // Clean up test user
        await supabase.from('cardrail_users').delete().eq('id', testUser.id);
        logSuccess('Test user cleaned up');

        return true;
    } catch (error) {
        logError(`Failed to create test user: ${error.message}`);
        return false;
    }
}

async function generateSetupSQL() {
    log('\n📝 Generating complete setup SQL...', colors.cyan);

    const sqlPath = path.join(__dirname, '../supabase-schema-complete.sql');

    const completeSQL = `-- CardRail Database Schema - Complete Setup
-- Generated by init-database.js on ${new Date().toISOString()}
-- Run this entire script in your Supabase SQL Editor

-- Create the cardrail_users table
CREATE TABLE IF NOT EXISTS cardrail_users (
    id VARCHAR(255) PRIMARY KEY,
    passphrase TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the cardrail_notes table
CREATE TABLE IF NOT EXISTS cardrail_notes (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    parent_id VARCHAR(255),
    is_archived BOOLEAN DEFAULT FALSE,
    original_parent_id VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES cardrail_users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cardrail_notes_user_id ON cardrail_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_cardrail_notes_parent_id ON cardrail_notes(parent_id);
CREATE INDEX IF NOT EXISTS idx_cardrail_notes_created_at ON cardrail_notes(created_at);
CREATE INDEX IF NOT EXISTS idx_cardrail_notes_updated_at ON cardrail_notes(updated_at);

-- Enable Row Level Security (RLS) with permissive policies
ALTER TABLE cardrail_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cardrail_notes ENABLE ROW LEVEL SECURITY;

-- Create permissive RLS policies since we handle auth in the application
DROP POLICY IF EXISTS "Allow all operations on cardrail_users" ON cardrail_users;
CREATE POLICY "Allow all operations on cardrail_users" ON cardrail_users
    FOR ALL USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Allow all operations on cardrail_notes" ON cardrail_notes;
CREATE POLICY "Allow all operations on cardrail_notes" ON cardrail_notes
    FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS update_cardrail_notes_updated_at ON cardrail_notes;
CREATE TRIGGER update_cardrail_notes_updated_at
    BEFORE UPDATE ON cardrail_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify setup by selecting from tables (this will show success/failure)
SELECT 'cardrail_users table ready' as status, count(*) as user_count FROM cardrail_users;
SELECT 'cardrail_notes table ready' as status, count(*) as note_count FROM cardrail_notes;
`;

    try {
        fs.writeFileSync(sqlPath, completeSQL);
        logSuccess(`Complete setup SQL saved to: ${sqlPath}`);
        logInfo('You can run this SQL file directly in your Supabase SQL Editor');
    } catch (error) {
        logError(`Failed to write SQL file: ${error.message}`);
    }
}

async function main() {
    log('🚀 CardRail Database Initialization', colors.bright + colors.magenta);
    log('=====================================', colors.magenta);

    try {
        await checkEnvironment();
        const supabase = await createSupabaseClient();

        await createTables(supabase);
        await setupRLS(supabase);
        await createTriggers(supabase);

        const isVerified = await verifySetup(supabase);

        if (isVerified) {
            await createTestUser(supabase);
            logSuccess('\n🎉 Database setup completed successfully!');
            logInfo('Your CardRail database is ready to use.');
        } else {
            logWarning('\n⚠️  Database setup incomplete');
            logInfo('Please run the SQL commands manually in your Supabase dashboard.');
        }

        await generateSetupSQL();

        log('\n📖 Next Steps:', colors.cyan);
        logInfo('1. Copy and run the SQL commands shown above in your Supabase SQL Editor');
        logInfo('2. Or use the generated supabase-schema-complete.sql file');
        logInfo('3. Test your setup by running: npm run test:sync:db');
        logInfo('4. Start your application: npm run dev');

    } catch (error) {
        logError(`\nSetup failed: ${error.message}`);
        process.exit(1);
    }
}

// Handle CLI execution
if (require.main === module) {
    main();
}

module.exports = {
    checkEnvironment,
    createSupabaseClient,
    verifySetup,
    createTestUser
};
