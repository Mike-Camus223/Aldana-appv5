# Admin User Setup Guide

## How to Create Admin Users in Supabase

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project dashboard
2. Go to **Authentication** > **Users**
3. Find the user you want to make admin

### Step 2: Run SQL Command
Go to **SQL Editor** and run:

```sql
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'), 
  '{role}', 
  '"admin"'
) 
WHERE email = 'user-email@example.com';
```

**Replace `user-email@example.com` with the actual email address.**

### Step 3: Verify
- User will be redirected to `/dashboard` on next login
- Can access all admin routes and features

### Notes
- Default role for new users is 'user'
- Users go to `/user-panel`, admins go to `/dashboard`
- No UI for role management yet - must use SQL
