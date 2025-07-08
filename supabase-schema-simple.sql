-- CardRail Database Schema - Simplified Version
-- Run this script in your Supabase SQL editor to create the required tables
-- This version uses a custom auth system with passphrases instead of Supabase auth

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

-- Enable Row Level Security (RLS) but with open policies for custom auth
ALTER TABLE cardrail_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cardrail_notes ENABLE ROW LEVEL SECURITY;

-- Create permissive RLS policies since we handle auth in the application
CREATE POLICY "Allow all operations on cardrail_users" ON cardrail_users
    FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Allow all operations on cardrail_notes" ON cardrail_notes
    FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_cardrail_notes_updated_at
    BEFORE UPDATE ON cardrail_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
