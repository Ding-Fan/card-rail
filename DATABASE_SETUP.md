# CardRail Database Setup Guide

This guide will help you set up the CardRail database in Supabase.

## Quick Setup (Recommended)

### Option 1: Copy-Paste SQL (Easiest)

1. **Open Supabase Dashboard**
   - Go to [supabase.com](https://supabase.com) and sign in
   - Navigate to your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Setup SQL**
   - Copy the entire contents of `supabase-schema-complete.sql`
   - Paste it into the SQL Editor
   - Click "Run" or press `Ctrl+Enter`

4. **Verify Success**
   - You should see success messages in the Results panel
   - Check that `cardrail_users` and `cardrail_notes` tables appear in the Database section

### Option 2: Interactive Setup Script

1. **Set Environment Variables**
   ```bash
   # Create .env.local file with your Supabase credentials
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. **Run Setup Script**
   ```bash
   npm run db:init
   ```

3. **Follow Instructions**
   - The script will generate SQL commands for you to run
   - Copy and paste them into your Supabase SQL Editor

## Manual Setup (Step by Step)

If you prefer to understand each step:

### 1. Create Users Table

```sql
CREATE TABLE IF NOT EXISTS cardrail_users (
    id VARCHAR(255) PRIMARY KEY,
    passphrase TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Create Notes Table

```sql
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
```

### 3. Create Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_cardrail_notes_user_id ON cardrail_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_cardrail_notes_parent_id ON cardrail_notes(parent_id);
CREATE INDEX IF NOT EXISTS idx_cardrail_notes_created_at ON cardrail_notes(created_at);
CREATE INDEX IF NOT EXISTS idx_cardrail_notes_updated_at ON cardrail_notes(updated_at);
```

### 4. Set Up Row Level Security

```sql
ALTER TABLE cardrail_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cardrail_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on cardrail_users" ON cardrail_users
    FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Allow all operations on cardrail_notes" ON cardrail_notes
    FOR ALL USING (TRUE) WITH CHECK (TRUE);
```

### 5. Create Auto-Update Trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cardrail_notes_updated_at
    BEFORE UPDATE ON cardrail_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## Environment Variables

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: For admin operations
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### How to Find Your Supabase Keys

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the values:
   - **URL**: Your project URL
   - **anon/public key**: Use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key**: Use as `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

## Testing Your Setup

### 1. Test Database Connection
```bash
npm run db:test
```

### 2. Test Sync Functionality
```bash
npm run test:sync
```

### 3. Test in Development
```bash
npm run dev
```
Then go to `/settings` and try enabling sync.

## Troubleshooting

### Common Issues

**❌ "relation 'cardrail_users' does not exist"**
- Solution: Run the SQL setup commands in your Supabase dashboard

**❌ "Invalid API key"**
- Solution: Check your environment variables are correct

**❌ "Row Level Security violation"**
- Solution: Make sure RLS policies are created correctly

**❌ "Buffer errors in tests"**
- Solution: Use the mock tests instead: `npm run test:sync:passphrase`

### Getting Help

1. Check the [Supabase documentation](https://supabase.com/docs)
2. Verify your environment variables
3. Make sure all SQL commands ran successfully
4. Check the browser console for detailed error messages

## Database Schema Overview

### Tables

- **cardrail_users**: Stores user accounts with BIP39 passphrases
- **cardrail_notes**: Stores notes with hierarchical relationships

### Key Features

- 🔐 **Row Level Security**: Enabled with permissive policies
- 🔄 **Auto-timestamps**: `updated_at` automatically updated on changes
- 🗂️ **Hierarchical notes**: Support for parent-child relationships
- 📁 **Archive support**: Notes can be archived
- 🔗 **Foreign keys**: Ensures data integrity

### Security Model

CardRail uses a custom authentication system based on BIP39 mnemonic phrases instead of traditional email/password. The database policies are currently permissive to support this custom auth model.

## Files Reference

- `supabase-schema-complete.sql` - Complete setup SQL (recommended)
- `supabase-schema-simple.sql` - Basic schema only
- `scripts/init-database.js` - Interactive setup script
- `SUPABASE_SETUP.md` - This guide
