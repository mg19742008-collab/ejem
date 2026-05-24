/*
  # Create search_history table

  1. New Tables
    - `search_history`
      - `id` (uuid, primary key)
      - `search_type` (text) - ip, username, email, phone, discord, telegram
      - `query` (text) - the search query
      - `result` (jsonb) - full result data
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS
    - Allow all authenticated and anonymous inserts/selects (public tool)
*/

CREATE TABLE IF NOT EXISTS search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_type text NOT NULL,
  query text NOT NULL,
  result jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert search history"
  ON search_history FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read search history"
  ON search_history FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can delete search history"
  ON search_history FOR DELETE
  TO anon, authenticated
  USING (true);
