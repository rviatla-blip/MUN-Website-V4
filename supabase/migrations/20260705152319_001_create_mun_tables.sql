/*
# Create MUN Registration Tables

1. New Tables
- `matrix`: Stores all available committee/country slots
  - id (uuid, primary key)
  - committee (text, not null) - e.g., "DISEC", "UNSC", "ECOSOC"
  - country (text, not null) - e.g., "France", "USA", "China"
  - is_assigned (boolean, default false)
  - created_at (timestamp)
- `delegates`: Stores delegate registration information
  - id (uuid, primary key)
  - name (text, not null)
  - email (text, unique, not null)
  - school (text, not null)
  - phone (text, not null)
  - preference_1_committee (text, not null)
  - preference_1_country (text, not null)
  - preference_2_committee (text, not null)
  - preference_2_country (text, not null)
  - preference_3_committee (text, not null)
  - preference_3_country (text, not null)
  - assigned_committee (text, nullable)
  - assigned_country (text, nullable)
  - assigned_matrix_id (uuid, nullable, references matrix)
  - registration_status (text, default 'pending')
  - created_at (timestamp)

2. Security
- Enable RLS on both tables
- Allow anon + authenticated CRUD since this is a public registration system
- Admin access controlled through separate mechanism

3. Important Notes
- The matrix table is pre-populated with all committee/country combinations
- When a delegate registers, the allocation engine checks preferences and assigns
- The assigned_matrix_id creates a link to the specific slot taken
*/

-- Create matrix table for committee/country slots
CREATE TABLE IF NOT EXISTS matrix (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  committee text NOT NULL,
  country text NOT NULL,
  is_assigned boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(committee, country)
);

-- Create delegates table
CREATE TABLE IF NOT EXISTS delegates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  school text NOT NULL,
  phone text NOT NULL,
  preference_1_committee text NOT NULL,
  preference_1_country text NOT NULL,
  preference_2_committee text NOT NULL,
  preference_2_country text NOT NULL,
  preference_3_committee text NOT NULL,
  preference_3_country text NOT NULL,
  assigned_committee text,
  assigned_country text,
  assigned_matrix_id uuid REFERENCES matrix(id) ON DELETE SET NULL,
  registration_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegates ENABLE ROW LEVEL SECURITY;

-- Matrix policies (public read, controlled write)
DROP POLICY IF EXISTS "anon_read_matrix" ON matrix;
CREATE POLICY "anon_read_matrix" ON matrix FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_matrix" ON matrix;
CREATE POLICY "anon_insert_matrix" ON matrix FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_matrix" ON matrix;
CREATE POLICY "anon_update_matrix" ON matrix FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Delegates policies (public CRUD for registration)
DROP POLICY IF EXISTS "anon_read_delegates" ON delegates;
CREATE POLICY "anon_read_delegates" ON delegates FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_delegates" ON delegates;
CREATE POLICY "anon_insert_delegates" ON delegates FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_delegates" ON delegates;
CREATE POLICY "anon_update_delegates" ON delegates FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_matrix_committee ON matrix(committee);
CREATE INDEX IF NOT EXISTS idx_matrix_assigned ON matrix(is_assigned);
CREATE INDEX IF NOT EXISTS idx_delegates_email ON delegates(email);
CREATE INDEX IF NOT EXISTS idx_delegates_status ON delegates(registration_status);