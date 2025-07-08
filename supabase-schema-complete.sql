-- CardRail Database Schema - Complete Setup
-- Copy and paste this entire script into your Supabase SQL Editor
-- This will create all necessary tables, indexes, and triggers for CardRail

-- =====================================================
-- TABLES
-- =====================================================

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

-- =====================================================
-- INDEXES  
-- =====================================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cardrail_notes_user_id ON cardrail_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_cardrail_notes_parent_id ON cardrail_notes(parent_id);
CREATE INDEX IF NOT EXISTS idx_cardrail_notes_created_at ON cardrail_notes(created_at);
CREATE INDEX IF NOT EXISTS idx_cardrail_notes_updated_at ON cardrail_notes(updated_at);
CREATE INDEX IF NOT EXISTS idx_cardrail_notes_archived ON cardrail_notes(is_archived);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable Row Level Security (RLS) 
ALTER TABLE cardrail_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cardrail_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on cardrail_users" ON cardrail_users;
DROP POLICY IF EXISTS "Allow all operations on cardrail_notes" ON cardrail_notes;

-- Create permissive RLS policies since we handle auth in the application
-- Note: In production, you may want to implement more restrictive policies
CREATE POLICY "Allow all operations on cardrail_users" ON cardrail_users
    FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Allow all operations on cardrail_notes" ON cardrail_notes  
    FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

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

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify the setup by checking tables exist and are accessible
DO $$
DECLARE
    user_count INTEGER;
    note_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM cardrail_users;
    SELECT COUNT(*) INTO note_count FROM cardrail_notes;
    
    RAISE NOTICE '✅ cardrail_users table ready - % users', user_count;
    RAISE NOTICE '✅ cardrail_notes table ready - % notes', note_count;
    RAISE NOTICE '🎉 CardRail database setup completed successfully!';
END $$;

-- Optional: Insert a test user to verify everything works
-- Uncomment the lines below to create a test user
/*
INSERT INTO cardrail_users (id, passphrase) 
VALUES ('test-setup-user', 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about')
ON CONFLICT (id) DO NOTHING;

-- Clean up test user
DELETE FROM cardrail_users WHERE id = 'test-setup-user';
*/

-- Show final status
SELECT 
    'Database Setup Complete' as status,
    NOW() as completed_at,
    version() as database_version;
