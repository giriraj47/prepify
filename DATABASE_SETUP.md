# Database Setup for Autosave Feature

## Overview

The autosave feature requires a `review_answers` table to store user responses while working on roadmap reviews.

## Setup Instructions

### Step 1: Run the Migration

You have two options:

#### Option A: Using Supabase SQL Editor (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/projects)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **"New query"**
5. Copy the entire contents of `migrations/001_create_review_answers_table.sql`
6. Paste it into the SQL editor
7. Click **"Run"** (or press `Cmd+Enter` / `Ctrl+Enter`)
8. You should see: "Success. No rows returned."

#### Option B: Using Supabase CLI

```bash
# Install Supabase CLI if you haven't already
brew install supabase/tap/supabase  # macOS
# or npm install -g supabase

# Link your project
supabase link --project-ref YOUR_PROJECT_ID

# Run migrations
supabase db push
```

#### Option C: Direct SQL Client (psql)

```bash
# Get your database connection string from Supabase dashboard
psql "YOUR_DATABASE_URL" < migrations/001_create_review_answers_table.sql
```

### Step 2: Verify the Setup

After running the migration, verify the table was created by running this query in Supabase SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'review_answers';
```

You should see one row with `review_answers`.

### Step 3: Verify RLS Policies

Check that RLS policies are enabled:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'review_answers';
```

Should show: `review_answers | on`

## What the Migration Does

1. **Creates `review_answers` table** with columns:
   - `id` (UUID primary key)
   - `user_id` (UUID, foreign key to auth.users)
   - `roadmap_id` (UUID, foreign key to roadmaps)
   - `answers` (JSONB, stores all Q&A pairs)
   - `submitted` (boolean, marks if review is submitted)
   - `created_at` & `updated_at` (timestamps)

2. **Sets up automatic timestamp updates** via a trigger

3. **Creates composite index** on (user_id, roadmap_id) for fast lookups

4. **Enables Row Level Security (RLS)** with policies:
   - Users can only view/edit/delete their own review answers
   - Ensures data privacy and security

## Rollback (if needed)

If you need to remove the table and reset, run in Supabase SQL Editor:

```sql
-- Drop the table (this will cascade delete all rows)
DROP TABLE IF EXISTS public.review_answers CASCADE;

-- Drop the trigger function
DROP FUNCTION IF EXISTS public.update_review_answers_timestamp() CASCADE;
```

## Testing the Feature

After migration is complete:

1. Open a roadmap review page
2. Type in the textarea
3. Check browser DevTools → Application → Local Storage → look for `prepai-review:answers:*`
4. Wait 3 seconds and check Supabase SQL Editor:
   ```sql
   SELECT * FROM public.review_answers LIMIT 1;
   ```
   You should see your answers in JSON format.

## Troubleshooting

### Error: "relation 'review_answers' does not exist"

- The migration hasn't been run yet. Follow Step 1 above.

### Error: "permission denied"

- Make sure RLS is enabled and you're testing with a logged-in user
- Your user's UUID must match `user_id` in the record

### Autosave not working in browser

- Check Network tab in DevTools → look for POST requests to `/api/autosave-review-answer`
- Check browser console for errors
- Verify API returns success: `{ success: true, message: "Answers saved successfully" }`

### Data not appearing in database

- Check if localStorage is saving (DevTools → Storage → Local Storage)
- Verify network requests are being made
- Check Supabase logs for any database errors
