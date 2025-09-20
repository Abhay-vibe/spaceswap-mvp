-- Add profiles table for user profile data separate from auth.users
-- This allows us to store additional profile info and handle Google OAuth properly

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text NOT NULL,
  full_name text,
  phone text,
  avatar_url text,
  verified boolean DEFAULT false,
  match_history_count int DEFAULT 0,
  past_flights_count int DEFAULT 0,
  trust_score int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint on email to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (lower(email));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON public.profiles(verified);
CREATE INDEX IF NOT EXISTS idx_profiles_trust_score ON public.profiles(trust_score);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
-- Users can read their own profile and profiles of users they're matched with
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view profiles of matched users" ON public.profiles
  FOR SELECT USING (
    id IN (
      -- Users they're buying from (seller profiles)
      SELECT l.seller FROM listings l 
      JOIN matches m ON l.id = m.listing_id 
      WHERE m.buyer = auth.uid()
      UNION
      -- Users buying from them (buyer profiles)  
      SELECT m.buyer FROM matches m
      JOIN listings l ON m.listing_id = l.id
      WHERE l.seller = auth.uid()
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (for OAuth signup)
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Update the updated_at column automatically
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Backfill existing auth.users data into profiles
-- This safely migrates any existing users to the new profiles system
INSERT INTO public.profiles (id, email, full_name, phone, verified, match_history_count, past_flights_count, trust_score)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name') as full_name,
  raw_user_meta_data->>'phone' as phone,
  COALESCE((raw_user_meta_data->>'verified')::boolean, false) as verified,
  COALESCE((raw_user_meta_data->>'match_history_count')::int, 0) as match_history_count,
  COALESCE((raw_user_meta_data->>'past_flights_count')::int, 0) as past_flights_count,
  COALESCE((raw_user_meta_data->>'trust_score')::int, 0) as trust_score
FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Update foreign key references to use profiles instead of auth.users
-- Note: We'll keep the existing references for now but add new ones to profiles

-- Add profile references to listings (optional, for easier joins)
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS seller_profile uuid REFERENCES public.profiles(id);

-- Update existing listings to reference profiles
UPDATE public.listings 
SET seller_profile = seller 
WHERE seller_profile IS NULL AND seller IS NOT NULL;

-- Add profile references to matches (optional, for easier joins)
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS buyer_profile uuid REFERENCES public.profiles(id);

-- Update existing matches to reference profiles  
UPDATE public.matches 
SET buyer_profile = buyer 
WHERE buyer_profile IS NULL AND buyer IS NOT NULL;

-- Grant permissions
GRANT ALL ON public.profiles TO anon, authenticated;
