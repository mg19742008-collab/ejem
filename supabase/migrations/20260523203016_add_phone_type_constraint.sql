/*
  # Add phone to search_history type constraint

  1. Changes
    - Drop existing check constraint
    - Add new constraint including 'phone' type
*/

ALTER TABLE search_history DROP CONSTRAINT IF EXISTS search_history_type_check;
ALTER TABLE search_history ADD CONSTRAINT search_history_type_check 
  CHECK (type IN ('ip', 'username', 'email', 'discord', 'phone'));