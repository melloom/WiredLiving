# Supabase Security Guide

This guide explains the security features implemented in your Supabase database schema.

## 🔒 Security Features

### 1. Row Level Security (RLS)

All tables have **Row Level Security (RLS)** enabled, which means:
- Users can only access data they're allowed to see
- Policies control read/write/delete access at the database level
- Even if someone bypasses your app, the database enforces security

### 2. Table Security Policies

#### **Posts Table**
- ✅ **Public Access**: Anyone can read published, public posts
- ✅ **Authenticated Access**: Logged-in users can read published + unlisted posts
- ✅ **Admin Access**: Admins can read ALL posts (including drafts and private)
- ✅ **Write Protection**: Only admins/editors can create/update/delete posts
- ✅ **Visibility Control**: Respects `public`, `unlisted`, `private` visibility settings
- ✅ **Premium/Login Protection**: Enforces `is_premium` and `requires_login` flags

#### **Tags Table**
- ✅ **Public Read**: Anyone can read tags
- ✅ **Admin Write**: Only admins/editors can create/update/delete tags

#### **Admin Logs Table**
- ✅ **Admin Only**: Only admins can read admin logs (audit trail)
- ✅ **System Insert**: System can insert logs for audit purposes

#### **Users Table**
- ✅ **Self View**: Users can only see their own profile
- ✅ **Admin Management**: Only admins can manage users

### 3. Authentication & Authorization

#### User Roles
- **admin**: Full access to everything
- **editor**: Can create/edit posts and tags
- **viewer**: Read-only access

#### Session Management
- `user_sessions` table tracks active sessions
- Users can only see/delete their own sessions
- Automatic session expiration

### 4. Data Validation

#### Check Constraints
- `status` must be: `draft`, `scheduled`, or `published`
- `visibility` must be: `public`, `unlisted`, or `private`
- `action` in admin_logs must be valid action type
- `role` in users must be: `admin`, `editor`, or `viewer`

### 5. Indexes for Security Queries

Indexes are created on:
- User email and role (for fast auth checks)
- Post visibility and status (for access control)
- Admin logs by user and action (for audit queries)
- Session tokens (for session validation)

### 6. Automatic Timestamps

- `created_at` and `updated_at` are automatically managed
- Triggers ensure `updated_at` is always current

## 🛡️ Storage Bucket Security

### Recommended Policies for `blog-images` Bucket

Set these up in **Supabase Dashboard → Storage → Policies**:

#### 1. Public Read Policy
```
Policy Name: "Public can read images"
Allowed Operation: SELECT
Target Roles: anon, authenticated
Policy: true
```

#### 2. Admin Upload Policy
```
Policy Name: "Admins can upload images"
Allowed Operation: INSERT
Target Roles: authenticated
Policy: auth.jwt() ->> 'role' = 'admin'
```

#### 3. Admin Update Policy
```
Policy Name: "Admins can update images"
Allowed Operation: UPDATE
Target Roles: authenticated
Policy: auth.jwt() ->> 'role' = 'admin'
```

#### 4. Admin Delete Policy
```
Policy Name: "Admins can delete images"
Allowed Operation: DELETE
Target Roles: authenticated
Policy: auth.jwt() ->> 'role' = 'admin'
```

## 🔐 Service Role Key Usage

**Important**: Your app uses the `SERVICE_ROLE_KEY` for admin operations. This key:
- ✅ Bypasses RLS policies (needed for admin operations)
- ⚠️ **MUST be kept secret** - never expose in client-side code
- ⚠️ Only use in server-side API routes
- ⚠️ Never commit to git

## 📝 Best Practices

### 1. Environment Variables
```env
# Public (safe for client)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Secret (server-only)
SERVICE_ROLE_KEY=your-service-role-key
```

### 2. API Route Protection
Always check authentication in your API routes:
```typescript
const session = await auth();
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### 3. User Management
- Create admin users via SQL or admin interface
- Use strong passwords
- Regularly review admin_logs for suspicious activity
- Deactivate unused accounts

### 4. Audit Trail
The `admin_logs` table tracks:
- All admin actions
- User emails and IPs
- Timestamps
- Action metadata

Review logs regularly for security monitoring.

## 🚨 Security Checklist

- [ ] RLS enabled on all tables ✅
- [ ] Storage bucket policies configured
- [ ] Service role key is secret (not in git)
- [ ] Admin users created and secured
- [ ] Default admin credentials changed
- [ ] AUTH_SECRET is strong and unique
- [ ] HTTPS enabled in production
- [ ] Rate limiting configured (middleware)
- [ ] CORS properly configured
- [ ] Regular security audits

## 🔍 Monitoring

### Check Admin Activity
```sql
SELECT * FROM admin_logs 
ORDER BY created_at DESC 
LIMIT 50;
```

### Check Active Sessions
```sql
SELECT u.email, us.* 
FROM user_sessions us
JOIN users u ON us.user_id = u.id
WHERE us.expires_at > NOW()
ORDER BY us.created_at DESC;
```

### Check Failed Login Attempts
```sql
SELECT * FROM admin_logs 
WHERE action = 'login' 
AND meta->>'success' = 'false'
ORDER BY created_at DESC;
```

## 📚 Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage Policies](https://supabase.com/docs/guides/storage/policies)
- [NextAuth.js Security](https://next-auth.js.org/configuration/options#security)

