# Autosave & Cross-Tab Sync Implementation

## Feature Overview

The roadmap review page now includes a comprehensive autosave and sync system that allows users to:

- **Auto-expand textarea** - grows/shrinks as user types (160px-400px)
- **Instant localStorage save** - responses saved locally every 500ms while typing
- **Delayed database sync** - synced to database after 3 seconds of inactivity
- **Cross-tab synchronization** - changes in one tab appear immediately in other open tabs
- **Resume capability** - users can close and return later to continue where they left off
- **Visual feedback** - indicators show when data is being saved or synced

## Implementation Details

### Frontend Changes

**File: `app/roadmap/review/page.tsx`**

#### New State & Ref

```typescript
const textareaRef = useRef<HTMLTextAreaElement>(null);
const dbSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
const localStorageSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
const [lastSyncStatus, setLastSyncStatus] = useState<
  "idle" | "saving" | "synced"
>("idle");
const storageKey = roadmapId ? `${STORAGE_KEY_PREFIX}${roadmapId}` : null;
```

#### Constants

```typescript
const LOCALSTORAGE_AUTOSAVE_DELAY = 500; // 500ms for immediate local save
const DB_SYNC_DELAY = 3000; // 3 seconds for DB sync
const STORAGE_KEY_PREFIX = "prepai-review:answers:";
```

#### New Effects

1. **Load from localStorage on Mount**
   - Checks localStorage for previously saved answers
   - Parses and restores them on component load
   - Allows users to resume their work

2. **Auto-Expand Textarea (2 effects)**
   - First effect: Sets up input listener and initial adjustment
   - Second effect: Re-adjusts height when switching questions or answers change
   - Uses `scrollHeight` for accurate sizing
   - Min 160px, max 400px with `overflow-hidden` to prevent scroll

3. **LocalStorage Autosave**
   - Debounced with 500ms delay
   - Triggers on every answer change
   - Clears/sets timeouts to prevent race conditions
   - Catches errors silently to avoid breaking UX

4. **Database Sync**
   - Debounced with 3000ms delay (only after user stops typing for 3s)
   - Calls `/api/autosave-review-answer` endpoint
   - Shows "Saving..." status during sync
   - Shows "Synced" status for 2 seconds after successful save
   - Clears timeouts properly to prevent duplicate requests

5. **Cross-Tab Synchronization**
   - Listens to `storage` events from other tabs
   - When localStorage changes in another tab, immediately updates answers state
   - Doesn't trigger when form is submitted
   - Uses same storage key for coordination

#### UI Updates

```jsx
// Sync status indicator
<div className="flex items-center gap-2">
  {lastSyncStatus === "saving" && (
    <span className="flex items-center gap-1.5 text-xs text-yellow-400/80">
      <span className="animate-pulse">●</span>
      Saving...
    </span>
  )}
  {lastSyncStatus === "synced" && (
    <span className="flex items-center gap-1.5 text-xs text-emerald-400/80">
      <span>✓</span>
      Synced
    </span>
  )}
</div>

// Updated textarea
<textarea
  ref={textareaRef}
  value={answers[currentIndex] ?? ""}
  onChange={(e) => updateAnswer(currentIndex, e.target.value)}
  disabled={submitted}
  placeholder="Begin typing your structured response here..."
  className="w-full rounded-xl border border-white/15 bg-[#0b1224] px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-indigo-400/40 resize-none overflow-hidden"
  style={{
    minHeight: "160px",
    maxHeight: "400px",
  }}
/>

// Updated helper text
<p className="text-xs text-white/50 italic">
  Add diagrams or supporting data (optional) • Auto-saves locally every 500ms, syncs to cloud after 3 seconds
</p>
```

### Backend Changes

**File: `app/api/autosave-review-answer/route.ts` (NEW)**

```typescript
export async function POST(request: Request) {
  // 1. Authenticate user via Supabase
  // 2. Parse roadmapId and answers from request body
  // 3. Check if review_answers record exists for user+roadmap combination
  // 4. Update existing record OR insert new record
  // 5. Return success/error response
}
```

**Key Features:**

- Gets user from Supabase Auth
- Returns 401 if not authenticated
- Returns 400 if missing required fields
- Uses `maybeSingle()` for safe lookup (doesn't throw if no record)
- Upsert pattern: checks existence, then updates or inserts
- Sets `created_at` on insert, `updated_at` on both insert/update
- Handles database errors gracefully

### Database Schema

**File: `migrations/001_create_review_answers_table.sql` (NEW)**

```sql
CREATE TABLE public.review_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  roadmap_id UUID NOT NULL,
  answers JSONB DEFAULT '{}'::jsonb,
  submitted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  -- Foreign keys + constraints
  -- Unique(user_id, roadmap_id)
)
```

**Features:**

- One row per user per roadmap (enforced by unique constraint)
- JSONB answers format: `{ "0": "answer text", "1": "answer text", ... }`
- Automatic timestamp tracking via trigger
- Row Level Security (RLS) policies ensure users only see their own data
- Indexes on user_id, roadmap_id, and composite (user_id, roadmap_id)
- Foreign keys to auth.users and roadmaps tables
- CASCADE delete so removing user/roadmap cleans up responses

## Data Flow

### Writing Flow

```
User types in textarea
    ↓
onChange handler calls updateAnswer()
    ↓
setState triggers useEffect (500ms debounce)
    ↓
localStorage.setItem(storageKey, JSON.stringify(answers))
setLastSyncStatus("saving")
    ↓
After 500ms of inactivity, also triggers DB sync effect (3s debounce)
    ↓
fetch POST /api/autosave-review-answer
    ↓
Server updates review_answers table
    ↓
setLastSyncStatus("synced")
    ↓
After 2 seconds, setLastSyncStatus("idle")
```

### Reading Flow

```
Component mounts → Fetch review questions from API
    ↓
Load from localStorage using storageKey
    ↓
If found, restore answers, restore cursor position
    ↓
If not found, start with empty answers
```

### Cross-Tab Sync Flow

```
User types in Tab A → localStorage updated in Tab A
    ↓
Tab B listens to storage event
    ↓
Tab B detects storageKey matches its current review
    ↓
Tab B parses new localStorage value
    ↓
Tab B updates local answers state
    ↓
Tab B textarea auto-syncs to new value
```

## Setup Checklist

### Step 1: Database Migration

- [ ] Run the SQL from `migrations/001_create_review_answers_table.sql`
- [ ] Can do this via Supabase SQL Editor, CLI, or psql
- [ ] Verify table was created: `SELECT * FROM review_answers LIMIT 1;` (should work without error)

### Step 2: Verify API Endpoint

- [ ] Endpoints compile without errors
- [ ] API imports are correct
- [ ] Supabase server client available

### Step 3: Test in Browser

- [ ] Open a review page at `/roadmap/review?rid=<roadmapId>`
- [ ] Type in textarea
- [ ] Check DevTools → Application → Local Storage → filter for "prepai-review"
- [ ] Should see key like `prepai-review:answers:abc123...` with JSON value
- [ ] Wait 3 seconds without typing
- [ ] Check DevTools → Network tab → should see POST to `/api/autosave-review-answer`
- [ ] Open SQL Editor: `SELECT * FROM review_answers LIMIT 1;` should show your answers as JSONB

### Step 4: Test Cross-Tab Sync

- [ ] Open same review in Tab A and Tab B
- [ ] Type text in Tab A
- [ ] Switch to Tab B immediately
- [ ] Should see text appear automatically (no page refresh needed)
- [ ] Continue typing in Tab A
- [ ] Tab B continues to sync in real-time

### Step 5: Test Resume Capability

- [ ] Open review page, type some answers
- [ ] Refresh the page (Cmd+R or Ctrl+R)
- [ ] Answers should reappear in textarea
- [ ] Close tab
- [ ] Open same review again
- [ ] Answers persist from localStorage

## Performance Characteristics

| Aspect                  | Value  | Reasoning                              |
| ----------------------- | ------ | -------------------------------------- |
| localStorage save delay | 500ms  | Fast response, groups rapid keypresses |
| DB sync delay           | 3000ms | Server efficiency, avoid DB hammering  |
| Textarea min height     | 160px  | Visible area for 8 rows of text        |
| Textarea max height     | 400px  | Prevent consuming entire screen        |
| Sync status display     | 2 sec  | User sees confirmation without clutter |

## Error Handling

### localStorage Errors

- Try-catch around `localStorage.setItem()`
- Logged to console but doesn't break UX
- User just won't have local backup

### Database Sync Errors

- Try-catch around fetch
- Logged to console
- Status shows "idle" instead of "synced"
- User can manually retry or keep typing (next sync will try again)

### Missing User

- API returns 401
- localStorage save still works locally
- DB sync fails but retries on next change

### Missing Table

- First sync attempt will fail
- Run migration (see DATABASE_SETUP.md)
- Subsequent syncs will work

## Browser Compatibility

| Feature                        | Support                    |
| ------------------------------ | -------------------------- |
| localStorage                   | All modern browsers, IE 8+ |
| Storage events (cross-tab)     | All modern browsers, IE 9+ |
| JSONB parsing                  | All modern browsers        |
| textarea scrollHeight          | All modern browsers        |
| requestAnimationFrame optional | All modern browsers        |

## Security Considerations

1. **localStorage is local-only** - no data sent over network until DB sync
2. **RLS policies prevent data leakage** - server enforces user can only see own data
3. **JSONB format is type-safe** - malformed answers JSON handled gracefully
4. **Timestamp tracking** - can see when records were created/updated
5. **submitted flag** - prevents accidental overwrites after submission

## Future Enhancements

1. **Encryption** - encrypt localStorage data in case of device theft
2. **Conflict resolution** - handle simultaneous edits in multiple tabs
3. **Historical versions** - keep snapshots of previous saves
4. **Offline mode** - queue syncs when offline, replay when online
5. **Selective sync** - only sync changed answers, not full payload
6. **Analytics** - track time spent per question, save frequency

## Debugging

### Check localStorage

```javascript
// In DevTools console
localStorage.getItem("prepai-review:answers:YOUR_ROADMAP_ID");
JSON.parse(localStorage.getItem("prepai-review:answers:YOUR_ROADMAP_ID"));
```

### Check API calls

```
DevTools → Network tab → filter for "autosave-review-answer"
Look for POST requests, check Response and Status Code
```

### Check database

```sql
-- In Supabase SQL Editor
SELECT user_id, roadmap_id, answers, updated_at
FROM review_answers
ORDER BY updated_at DESC
LIMIT 5;
```

### Monitor sync status

Textarea shows visual indicators:

- No indicator = idle
- Yellow pulsing dot + "Saving..." = localStorage or DB syncing
- Green checkmark + "Synced" = DB sync succeeded
