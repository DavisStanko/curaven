-- Run this query to verify your Supabase setup is correct.
-- If any of the columns return FALSE (f), rerunning the schema.sql script is recommended.

select 
  exists(select 1 from pg_tables where schemaname = 'public' and tablename = 'profiles') as profiles_table_exists,
  exists(select 1 from pg_tables where schemaname = 'public' and tablename = 'matches') as matches_table_exists,
  exists(select 1 from pg_tables where schemaname = 'public' and tablename = 'messages') as messages_table_exists,
  exists(select 1 from pg_proc where proname = 'find_match') as find_match_function_exists;
