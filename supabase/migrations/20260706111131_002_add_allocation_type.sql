/*
# Add allocation_type column to delegates table

1. Modified Tables
- `delegates`: Added `allocation_type` column
  - Type: text, nullable
  - Values: '1st Preference', '2nd Preference', '3rd Preference', or 'Random'
  - Tracks which preference was matched during allocation

2. Security
- RLS already enabled, no changes needed
*/

ALTER TABLE delegates ADD COLUMN IF NOT EXISTS allocation_type text;