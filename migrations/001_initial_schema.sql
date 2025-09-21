-- BagSwap MVP Database Schema Migration
-- Run this in Supabase SQL Editor or via psql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table augmentations (extends Supabase auth.users)
ALTER TABLE auth.users 
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS match_history_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS past_flights_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trust_score int DEFAULT 0;

-- Flights table
CREATE TABLE IF NOT EXISTS flights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airline text,
  flight_no text NOT NULL,
  flight_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(flight_no, flight_date)
);

-- Listings table
CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  flight_id uuid REFERENCES flights(id) ON DELETE CASCADE,
  weight_kg int NOT NULL CHECK (weight_kg > 0),
  price_per_kg int NOT NULL CHECK (price_per_kg > 0), -- in paise/cents
  auto_accept boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE,
  buyer uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  quantity_kg int NOT NULL CHECK (quantity_kg > 0),
  total_amount int NOT NULL CHECK (total_amount > 0), -- in paise
  booking_reference text,
  status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'CONFIRMED', 'RELEASED', 'DISPUTED', 'CANCELLED')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Disputes table for admin resolution
CREATE TABLE IF NOT EXISTS disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text,
  status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RESOLVED', 'DISMISSED')),
  resolution text CHECK (resolution IN ('refund', 'release', 'partial') OR resolution IS NULL),
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Fraud flags table for security monitoring
CREATE TABLE IF NOT EXISTS fraud_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  flag_type text NOT NULL CHECK (flag_type IN ('RAPID_REQUESTS', 'NEW_USER_HIGH_VOLUME', 'SUSPICIOUS_PATTERN', 'DISPUTE_REPORTED')),
  details jsonb DEFAULT '{}',
  reviewed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller);
CREATE INDEX IF NOT EXISTS idx_listings_flight ON listings(flight_id);
CREATE INDEX IF NOT EXISTS idx_listings_active ON listings(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_matches_buyer ON matches(buyer);
CREATE INDEX IF NOT EXISTS idx_matches_listing ON matches(listing_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_flights_lookup ON flights(flight_no, flight_date);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_user ON fraud_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_disputes_match ON disputes(match_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_flags ENABLE ROW LEVEL SECURITY;

-- Flights: Public read access
CREATE POLICY "Public flights read" ON flights
  FOR SELECT USING (true);

CREATE POLICY "Authenticated flights insert" ON flights
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Listings: Sellers can manage their own, public can read active listings
CREATE POLICY "Public active listings read" ON listings
  FOR SELECT USING (active = true);

CREATE POLICY "Sellers manage own listings" ON listings
  FOR ALL USING (auth.uid() = seller);

-- Matches: Users can see matches they're involved in
CREATE POLICY "Users see own matches" ON matches
  FOR SELECT USING (
    auth.uid() = buyer OR 
    auth.uid() IN (SELECT seller FROM listings WHERE id = listing_id)
  );

CREATE POLICY "Buyers create matches" ON matches
  FOR INSERT WITH CHECK (auth.uid() = buyer);

CREATE POLICY "Participants update matches" ON matches
  FOR UPDATE USING (
    auth.uid() = buyer OR 
    auth.uid() IN (SELECT seller FROM listings WHERE id = listing_id)
  );

-- Disputes: Only match participants can create, admins can read all
CREATE POLICY "Participants create disputes" ON disputes
  FOR INSERT WITH CHECK (
    auth.uid() = reporter_id AND
    auth.uid() IN (
      SELECT buyer FROM matches WHERE id = match_id
      UNION
      SELECT seller FROM listings l 
      JOIN matches m ON l.id = m.listing_id 
      WHERE m.id = match_id
    )
  );

CREATE POLICY "Participants read own disputes" ON disputes
  FOR SELECT USING (
    auth.uid() = reporter_id OR
    auth.uid() IN (
      SELECT buyer FROM matches WHERE id = match_id
      UNION
      SELECT seller FROM listings l 
      JOIN matches m ON l.id = m.listing_id 
      WHERE m.id = match_id
    )
  );

-- Fraud flags: Admin only (handled via service role in backend)
CREATE POLICY "Service role fraud flags" ON fraud_flags
  FOR ALL USING (auth.role() = 'service_role');

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for matches updated_at
CREATE TRIGGER update_matches_updated_at 
  BEFORE UPDATE ON matches 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
-- Uncomment if you want test data

/*
-- Sample flight
INSERT INTO flights (airline, flight_no, flight_date) 
VALUES ('Air India', 'AI101', '2024-12-25')
ON CONFLICT (flight_no, flight_date) DO NOTHING;

-- Note: Users will be created via Supabase Auth, so no sample users here
*/

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
