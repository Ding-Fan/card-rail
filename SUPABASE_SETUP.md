# Supabase Database Setup for CardRail

## Prerequisites

1. You should have a Supabase project created
2. Your `.env.local` file should have the correct Supabase URL and API key

## Database Schema Setup

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor** tab
3. Click **New Query**
4. Copy and paste the contents of `supabase-schema-simple.sql` into the query editor
5. Click **Run** to execute the SQL

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Initialize Supabase in your project
supabase init

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run the migration
supabase db push
```

## Verification

After running the SQL script, you should see two new tables in your Supabase database:

1. `cardrail_users` - Stores user accounts with their passphrases
2. `cardrail_notes` - Stores the synced notes

## Testing the Setup

1. Start your development server: `npm run dev`
2. Go to the Settings page
3. Try to generate a new passphrase and enable sync
4. Check your Supabase dashboard to see if the user and notes are being created

## Troubleshooting

### Common Issues

1. **"relation 'cardrail_users' does not exist"**
   - Make sure you ran the SQL script in the correct database
   - Check that you're connected to the right Supabase project

2. **"RLS policy violation"**
   - The simple schema includes permissive RLS policies
   - If you're still getting RLS errors, you can temporarily disable RLS:
     ```sql
     ALTER TABLE cardrail_users DISABLE ROW LEVEL SECURITY;
     ALTER TABLE cardrail_notes DISABLE ROW LEVEL SECURITY;
     ```

3. **"Failed to register user"**
   - Check your Supabase URL and API key in `.env.local`
   - Make sure your Supabase project is active and not paused

### Checking Table Structure

You can verify the tables were created correctly by running this query in the SQL editor:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('cardrail_users', 'cardrail_notes');

-- Check table structure
\d cardrail_users;
\d cardrail_notes;
```

## Security Notes

The current setup uses permissive RLS policies for simplicity. In a production environment, you should:

1. Implement proper user authentication
2. Create more restrictive RLS policies
3. Use proper user session management
4. Consider encrypting sensitive data

For now, the passphrase-based system provides basic security, but it's not recommended for production use with sensitive data.
