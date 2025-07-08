# Supabase Database Schema

This document describes the database schema required for the Card Rail sync functionality.

## Tables

### cardrail_users
```sql
CREATE TABLE cardrail_users (
    id TEXT PRIMARY KEY,
    passphrase TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster passphrase lookups
CREATE INDEX idx_cardrail_users_passphrase ON cardrail_users(passphrase);
```

### cardrail_notes
```sql
CREATE TABLE cardrail_notes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    parent_id TEXT,
    is_archived BOOLEAN DEFAULT FALSE,
    original_parent_id TEXT,
    
    -- Foreign key constraints
    FOREIGN KEY (user_id) REFERENCES cardrail_users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES cardrail_notes(id) ON DELETE SET NULL
);

-- Indexes for better performance
CREATE INDEX idx_cardrail_notes_user_id ON cardrail_notes(user_id);
CREATE INDEX idx_cardrail_notes_parent_id ON cardrail_notes(parent_id);
CREATE INDEX idx_cardrail_notes_created_at ON cardrail_notes(created_at);
CREATE INDEX idx_cardrail_notes_updated_at ON cardrail_notes(updated_at);
```

## Row Level Security (RLS)

Enable RLS and create policies to ensure users can only access their own data:

```sql
-- Enable RLS
ALTER TABLE cardrail_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cardrail_notes ENABLE ROW LEVEL SECURITY;

-- Users can only access their own record
CREATE POLICY "Users can only access their own data" ON cardrail_users
    FOR ALL USING (id = current_setting('app.user_id', true));

-- Notes policies
CREATE POLICY "Users can only access their own notes" ON cardrail_notes
    FOR ALL USING (user_id = current_setting('app.user_id', true));
```

## Setup Instructions

1. **Create a new Supabase project** at https://supabase.com

2. **Run the SQL commands** above in the Supabase SQL editor

3. **Get your project credentials**:
   - Go to Settings > API
   - Copy your Project URL and Anon Key

4. **Configure environment variables**:
   ```bash
   # .env.local
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

5. **Test the connection** by enabling sync in the app settings

## Features

- **Passphrase-based authentication**: No complex OAuth flow
- **Local-first**: All data stored locally, sync is optional
- **Conflict resolution**: Manual conflict resolution UI
- **Offline support**: Full offline capability maintained
- **Automatic sync**: Background sync with configurable intervals

## Data Flow

1. **Local notes** are created with `syncStatus: 'offline'`
2. **Background sync** uploads offline notes to Supabase
3. **Conflicts** are detected and presented to user for resolution
4. **Synced notes** are marked as `syncStatus: 'synced'`
5. **Updates** to synced notes mark them as offline again

## Security Notes

- All data is encrypted in transit via HTTPS
- RLS policies ensure data isolation between users
- Passphrase acts as both identifier and authentication
- No sensitive data is stored in the database (just notes content)
