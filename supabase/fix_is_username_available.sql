-- Fix: is_username_available function
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor)

CREATE OR REPLACE FUNCTION is_username_available(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1
    FROM profiles
    WHERE username = p_username
  );
END;
$$;
