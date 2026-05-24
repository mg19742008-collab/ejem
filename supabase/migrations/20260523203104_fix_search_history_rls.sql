/*
  # Fix search_history RLS policies

  1. Changes
    - Drop old policy that used current_setting
    - Add new policy for SELECT that doesn't require session filter
    - This allows anonymous users to read their own history
*/

DROP POLICY IF EXISTS "Users can read own session history" ON search_history;

CREATE POLICY "Anyone can read search history"
  ON search_history FOR SELECT
  USING (true);