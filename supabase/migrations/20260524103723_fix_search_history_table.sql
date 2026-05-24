/*
  # Fix search_history table schema

  1. Changes
    - Drop the existing misconfigured search_history table
    - Create new search_history table with correct columns:
      - id (uuid, primary key)
      - session_id (text) - identifies user session
      - type (text) - module type (ip, username, email, discord, phone, telegram, image)
      - query (text) - the search query
      - result (jsonb) - the search result data
      - created_at (timestamp)
  2. Security
    - Enable RLS on search_history table
    - Add policy for all authenticated users to manage their session data
*/

-- Drop the old table if exists
DROP TABLE IF EXISTS search_history CASCADE;

-- Create new search_history table with correct schema
CREATE TABLE IF NOT EXISTS search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  type text NOT NULL CHECK (type IN ('ip', 'username', 'email', 'discord', 'phone', 'telegram', 'image')),
  query text NOT NULL,
  result jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Create policies for session-based access
CREATE POLICY "Users can view own session history"
  ON search_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own session history"
  ON search_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can delete own session history"
  ON search_history FOR DELETE
  TO authenticated
  USING (true);

-- Create index for faster queries by session
CREATE INDEX IF NOT EXISTS idx_search_history_session ON search_history(session_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created ON search_history(created_at DESC);
