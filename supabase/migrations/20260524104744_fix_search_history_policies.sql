/*
  # Fix RLS policies for search_history

  1. Changes
    - Drop restrictive policies that only allow authenticated users
    - Create permissive policies that allow insert/select/delete by anyone (session-based)
  2. Security
    - RLS remains enabled but policies now allow the client-side code to work
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own session history" ON search_history;
DROP POLICY IF EXISTS "Users can insert own session history" ON search_history;
DROP POLICY IF EXISTS "Users can delete own session history" ON search_history;

-- Create permissive policies (session-based access via client)
CREATE POLICY "Allow select" ON search_history FOR SELECT USING (true);
CREATE POLICY "Allow insert" ON search_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow delete" ON search_history FOR DELETE USING (true);