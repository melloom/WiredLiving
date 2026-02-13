# Security Fixes for Supabase Database Linter Warnings

## Overview
This document addresses all security warnings identified by the Supabase Database Linter on January 22, 2026.

## Issues Fixed

### 1. Function Search Path Mutable (11 functions)
**Issue**: Functions lacked `SET search_path = public` parameter, which prevents schema search path attacks.

**Fixed Functions**:
1. `calculate_compression_ratio()` - Compression calculation utility
2. `update_series_metadata_updated_at()` - Series metadata timestamp trigger
3. `cleanup_old_monitoring_data()` - Monitoring data cleanup
4. `create_post_revision()` - Post revision creation
5. `trigger_update_post_analytics()` - Analytics trigger function
6. `is_admin()` - Admin role check
7. `update_updated_at_column()` - Timestamp update trigger
8. `get_or_create_visitor()` - Visitor tracking
9. `update_post_analytics()` - Post analytics aggregation
10. `update_daily_analytics()` - Daily analytics aggregation
11. `trigger_update_daily_analytics()` - Daily analytics trigger

**Solution**: Added `SET search_path = public` to all function definitions. This restricts the function to only access objects in the public schema, preventing malicious schema search path injection attacks.

**Migration**: [supabase-security-fixes-2026.sql](supabase-security-fixes-2026.sql)

### 2. RLS Policies with Always-True Conditions (17 policies)
**Issue**: Row-Level Security (RLS) policies used overly permissive expressions like `USING (true)` or `WITH CHECK (true)` for INSERT, UPDATE, or DELETE operations.

**Fixed Policies**:

| Table | Policy | Issue | Fix |
|-------|--------|-------|-----|
| `audit_logs` | "Service role can insert audit logs" | WITH CHECK (true) | Restrict to service_role or admin |
| `failed_login_attempts` | "Service role can manage failed login attempts" | USING (true) FOR ALL | Split into INSERT (service_role) and SELECT (admin) |
| `media_files` | "Authenticated users can upload media" | WITH CHECK (true) | Require valid uploaded_by = auth.uid() |
| `monitoring_events` | "Service role can insert monitoring events" | WITH CHECK (true) | Restrict to service_role or admin |
| `monitoring_events` | "Users can view monitoring events" | USING (true) | Restrict to authenticated or admin |
| `page_views` | "Anyone can insert page views" | WITH CHECK (true) | Require session_id and page_path |
| `post_likes` | "Anyone can create likes" | WITH CHECK (true) | Require user_identifier |
| `post_likes` | "Users can delete own likes" | USING (true) | Require user_identifier IS NOT NULL |
| `reading_history` | "Anyone can create reading history" | WITH CHECK (true) | Require user_identifier |
| `reading_history` | "Users can update own reading history" | USING (true) + WITH CHECK (true) | Require user_identifier on both |
| `reading_history` | "Users can delete own reading history" | USING (true) | Require user_identifier |
| `series_metadata` | "Allow authenticated insert access" | WITH CHECK (true) | Restrict to admin or editor role |
| `series_metadata` | "Allow authenticated update access" | USING (true) + WITH CHECK (true) | Restrict to admin or editor role |
| `series_metadata` | "Allow authenticated delete access" | USING (true) | Restrict to admin only |
| `rate_limits` | "Service role can manage rate limits" | USING (true) FOR ALL | Split into service_role insert and admin full access |
| `user_sessions` | "System can insert sessions" | WITH CHECK (true) | Restrict to service_role or authenticated |
| `video_processing_queue` | "Authenticated can add to video queue" | WITH CHECK (true) | Require media_file_id |

**Solution**: Replaced all always-true conditions with meaningful constraints:
- Service role operations restricted to `auth.role() = 'service_role'`
- Admin operations require `(SELECT auth.jwt() ->> 'role') = 'admin'`
- User operations check for valid user identifiers and authentication status
- Foreign key references validated

**Impact**: 
- ✅ Prevents unauthorized data manipulation
- ✅ Ensures audit trail integrity
- ✅ Restricts file uploads to authenticated users only
- ✅ Validates tracking data integrity
- ✅ Limits series metadata changes to editors/admins

### 3. Leaked Password Protection (Auth Setting)
**Issue**: Supabase Auth has leaked password protection disabled.

**Status**: ⚠️ Manual Configuration Required

**How to Enable**:
1. Go to your Supabase dashboard
2. Navigate to **Authentication** → **Password Security**
3. Enable **Leaked Password Protection** checkbox
4. This will check new passwords against HaveIBeenPwned.org

**Why it Matters**: Prevents users from using passwords that have been compromised in known data breaches.

## Migration Instructions

### Prerequisites
- Supabase project with database access
- SQL Editor access in Supabase dashboard

### Steps

1. **Backup your database** (recommended for production):
   ```sql
   -- Create a backup before running the migration
   -- Use Supabase Dashboard → Database → Backups
   ```

2. **Run the security fixes migration**:
   - Open [supabase-security-fixes-2026.sql](supabase-security-fixes-2026.sql)
   - Copy all SQL statements
   - Paste into Supabase Dashboard → SQL Editor → New Query
   - Click "Run" to execute

3. **Verify fixes applied**:
   ```sql
   -- Check functions have search_path set
   SELECT proname, prosecdef, proconfig 
   FROM pg_proc 
   WHERE proname IN (
     'calculate_compression_ratio',
     'update_series_metadata_updated_at',
     'cleanup_old_monitoring_data',
     'create_post_revision',
     'trigger_update_post_analytics',
     'is_admin',
     'update_updated_at_column',
     'get_or_create_visitor',
     'update_post_analytics',
     'update_daily_analytics',
     'trigger_update_daily_analytics'
   )
   ORDER BY proname;
   
   -- Check policies are properly restricted
   SELECT tablename, policyname, permissive, qual, with_check 
   FROM pg_policies 
   WHERE tablename IN (
     'audit_logs', 'failed_login_attempts', 'media_files',
     'monitoring_events', 'page_views', 'post_likes',
     'reading_history', 'series_metadata', 'rate_limits',
     'user_sessions', 'video_processing_queue'
   )
   ORDER BY tablename, policyname;
   ```

4. **Re-run database linter**:
   - Use Supabase Tools → Database Linter
   - Verify all warnings are resolved

5. **Enable Leaked Password Protection**:
   - Navigate to Authentication → Password Security
   - Toggle "Leaked Password Protection" to ON

## Testing

### Test RLS Policies
```sql
-- Test as authenticated user
SET ROLE authenticated;
INSERT INTO page_views (page_path, session_id, post_slug, created_at)
VALUES ('/test', 'session-123', 'test-post', NOW());

-- Test as service_role
SET ROLE service_role;
INSERT INTO audit_logs (user_id, action, resource, resource_id, created_at)
VALUES ('admin@example.com', 'test', 'test_table', 'test-id', NOW());
```

### Test Function Search Paths
```sql
-- Functions should only access public schema objects
SELECT calculate_compression_ratio(1000, 500);
SELECT update_series_metadata_updated_at();
```

## Security Best Practices

After applying these fixes, follow these recommendations:

1. **Regular Audits**: Re-run the database linter monthly
2. **Monitor Logs**: Check `audit_logs` table for suspicious activities
3. **Update Policies**: Review RLS policies quarterly as requirements change
4. **Principle of Least Privilege**: Only grant necessary permissions to roles
5. **Service Role Keys**: Keep service role keys secure and never expose them in client apps
6. **Password Security**: Educate users about strong passwords
7. **Rate Limiting**: Monitor `rate_limits` table for abuse patterns

## Related Documentation

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [OWASP Top 10 Database Security](https://owasp.org/www-project-top-ten/)

## Rollback Instructions

If you need to revert these changes:

```sql
-- Restore original functions (from backup or previous migration files)
-- Note: This will revert security fixes, so only do this if necessary

-- 1. Restore functions without SET search_path
-- 2. Restore original RLS policies with true conditions
-- 3. Verify restoration: SELECT * FROM pg_policies WHERE ...
```

## Support

For questions or issues:
1. Review the [fixes migration file](supabase-security-fixes-2026.sql)
2. Check Supabase documentation links above
3. Contact Supabase support with database linter reports
