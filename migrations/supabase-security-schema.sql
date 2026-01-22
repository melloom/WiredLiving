-- Security and Monitoring Tables
-- Run this in your Supabase SQL editor to add security features

-- Audit logs table for tracking admin actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Monitoring events table for tracking application health
CREATE TABLE IF NOT EXISTS monitoring_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('api_call', 'database_query', 'authentication', 'error', 'performance', 'security', 'user_action')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  message TEXT NOT NULL,
  metadata JSONB,
  user_id TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_monitoring_events_type ON monitoring_events(type);
CREATE INDEX IF NOT EXISTS idx_monitoring_events_severity ON monitoring_events(severity);
CREATE INDEX IF NOT EXISTS idx_monitoring_events_timestamp ON monitoring_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_events_user_id ON monitoring_events(user_id);

-- Row Level Security (RLS) policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_events ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read their own audit logs
DROP POLICY IF EXISTS "Users can view their own audit logs" ON audit_logs;
CREATE POLICY "Users can view their own audit logs"
  ON audit_logs
  FOR SELECT
  USING ((SELECT auth.uid())::text = user_id);

-- Only service role can insert audit logs (handled by API)
DROP POLICY IF EXISTS "Service role can insert audit logs" ON audit_logs;
CREATE POLICY "Service role can insert audit logs"
  ON audit_logs
  FOR INSERT
  WITH CHECK (current_user_id() IS NOT NULL OR (SELECT auth.role()) = 'service_role');

-- Only authenticated users can read monitoring events (admins can see all)
DROP POLICY IF EXISTS "Users can view monitoring events" ON monitoring_events;
CREATE POLICY "Users can view monitoring events"
  ON monitoring_events
  FOR SELECT
  USING (true);

-- Only service role can insert monitoring events
DROP POLICY IF EXISTS "Service role can insert monitoring events" ON monitoring_events;
CREATE POLICY "Service role can insert monitoring events"
  ON monitoring_events
  FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'service_role');

-- Failed login attempts tracking table
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_failed_login_email ON failed_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_failed_login_ip ON failed_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempted_at ON failed_login_attempts(attempted_at DESC);

ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- Admins can read failed login attempts
DROP POLICY IF EXISTS "Admins can read failed login attempts" ON failed_login_attempts;
CREATE POLICY "Admins can read failed login attempts"
  ON failed_login_attempts FOR SELECT
  USING ((SELECT auth.jwt() ->> 'role') = 'admin');

-- Service role can insert/update/delete failed login attempts
DROP POLICY IF EXISTS "Service role can manage failed login attempts" ON failed_login_attempts;
CREATE POLICY "Service role can manage failed login attempts"
  ON failed_login_attempts FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'service_role');

DROP POLICY IF EXISTS "Service role can update failed login attempts" ON failed_login_attempts;
CREATE POLICY "Service role can update failed login attempts"
  ON failed_login_attempts FOR UPDATE
  USING ((SELECT auth.role()) = 'service_role');

DROP POLICY IF EXISTS "Service role can delete failed login attempts" ON failed_login_attempts;
CREATE POLICY "Service role can delete failed login attempts"
  ON failed_login_attempts FOR DELETE
  USING ((SELECT auth.role()) = 'service_role');

-- Rate limiting table (optional, if not using Upstash)
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- IP address or user ID
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_request TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Admins and service role can manage rate limits
DROP POLICY IF EXISTS "Admins can manage rate limits" ON rate_limits;
DROP POLICY IF EXISTS "Service role can manage rate limits" ON rate_limits;
DROP POLICY IF EXISTS "Anyone can manage rate limits" ON rate_limits;
CREATE POLICY "Service role can manage rate limits"
  ON rate_limits FOR ALL
  USING ((SELECT auth.role()) = 'service_role');

-- Function to clean up old monitoring data (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_monitoring_data()
RETURNS void
SET search_path = public
AS $$
BEGIN
  -- Keep audit logs for 1 year
  DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '1 year';
  
  -- Keep monitoring events for 90 days
  DELETE FROM monitoring_events WHERE timestamp < NOW() - INTERVAL '90 days';
  
  -- Keep failed login attempts for 30 days
  DELETE FROM failed_login_attempts WHERE attempted_at < NOW() - INTERVAL '30 days';
  
  -- Keep rate limits for 1 day
  DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to clean up old data (run daily at 2 AM)
-- Note: You may need to use pg_cron extension or handle this in your application
-- SELECT cron.schedule('cleanup-monitoring-data', '0 2 * * *', 'SELECT cleanup_old_monitoring_data()');

COMMENT ON TABLE audit_logs IS 'Audit trail for sensitive operations';
COMMENT ON TABLE monitoring_events IS 'Application monitoring and health events';
COMMENT ON TABLE failed_login_attempts IS 'Track failed authentication attempts for security';
COMMENT ON TABLE rate_limits IS 'Rate limiting data (alternative to Upstash Redis)';
