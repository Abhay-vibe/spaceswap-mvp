-- Create logs table for application logging and error tracking
-- This helps us monitor Supabase operations and catch issues

CREATE TABLE IF NOT EXISTS public.logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'critical')),
  message text NOT NULL,
  payload jsonb DEFAULT '{}',
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_logs_level ON public.logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON public.logs(created_at);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON public.logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_logs_level_created_at ON public.logs(level, created_at);

-- Enable RLS (only service role can write, admins can read)
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Only service role can insert logs (from API routes)
CREATE POLICY "Service role can insert logs" ON public.logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Only service role can read logs (for admin dashboard)
CREATE POLICY "Service role can read logs" ON public.logs
  FOR SELECT USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON public.logs TO service_role;

-- Create a function to clean up old logs (optional, for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
  -- Keep only logs from the last 30 days
  DELETE FROM public.logs 
  WHERE created_at < now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- You can run this manually or set up a cron job:
-- SELECT cron.schedule('cleanup-logs', '0 2 * * *', 'SELECT cleanup_old_logs();');
