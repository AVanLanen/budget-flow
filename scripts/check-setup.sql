-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'accounts', 'transactions', 'scenarios');

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'accounts', 'transactions', 'scenarios');

-- Count policies
SELECT COUNT(*) as policy_count 
FROM pg_policies 
WHERE schemaname = 'public';
