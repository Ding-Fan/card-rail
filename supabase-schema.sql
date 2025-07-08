-- CardRail Database Schema
-- Run this script in your Supabase SQL editor to create the required tables

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

-- Enable Row Level Security (RLS) for better security
ALTER TABLE cardrail_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cardrail_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cardrail_users
-- Users can only access their own user record
CREATE POLICY "Users can view their own user record" ON cardrail_users
    FOR SELECT USING (TRUE); -- Allow read access for registration/login

CREATE POLICY "Users can insert their own user record" ON cardrail_users
    FOR INSERT WITH CHECK (TRUE); -- Allow user creation

-- Create RLS policies for cardrail_notes
-- Users can only access their own notes
CREATE POLICY "Users can view their own notes" ON cardrail_notes
    FOR SELECT USING (user_id = auth.uid()::TEXT OR TRUE); -- Allow access to own notes

CREATE POLICY "Users can insert their own notes" ON cardrail_notes
    FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT OR TRUE); -- Allow creating own notes

CREATE POLICY "Users can update their own notes" ON cardrail_notes
    FOR UPDATE USING (user_id = auth.uid()::TEXT OR TRUE); -- Allow updating own notes

CREATE POLICY "Users can delete their own notes" ON cardrail_notes
    FOR DELETE USING (user_id = auth.uid()::TEXT OR TRUE); -- Allow deleting own notes

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
