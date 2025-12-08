-- Enable required extensions for scheduling
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Grant usage to postgres role (usually default, but good to ensure)
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- Schedule the function (Example - User needs to replace KEY)
-- Note: We cannot execute the http_post here directly with a placeholder key.
-- The user must run the schedule command manually with their actual key.
