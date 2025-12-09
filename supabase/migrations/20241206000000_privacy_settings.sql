-- Privacy Settings Migration
-- Adds granular profile visibility controls (public, friends, custom, private)

-- Privacy settings per user
CREATE TABLE public.privacy_settings (
  user_id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'friends', 'custom', 'private')),
  schedule_visibility TEXT DEFAULT 'friends' CHECK (schedule_visibility IN ('public', 'friends', 'custom', 'private')),
  activity_visibility TEXT DEFAULT 'public' CHECK (activity_visibility IN ('public', 'friends', 'custom', 'private')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Custom visibility list (for 'custom' option)
-- Stores which users are allowed to see specific sections
CREATE TABLE public.custom_visibility (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users NOT NULL,
  allowed_user_id UUID REFERENCES auth.users NOT NULL,
  section TEXT NOT NULL CHECK (section IN ('profile', 'schedule', 'activity')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(owner_id, allowed_user_id, section)
);

-- Enable RLS
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_visibility ENABLE ROW LEVEL SECURITY;

-- Privacy settings policies
CREATE POLICY "Users can view their own privacy settings"
  ON public.privacy_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own privacy settings"
  ON public.privacy_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own privacy settings"
  ON public.privacy_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Anyone can view privacy settings to check visibility (needed for the check function)
CREATE POLICY "Anyone can view privacy settings for visibility checks"
  ON public.privacy_settings FOR SELECT
  USING (true);

-- Custom visibility policies
CREATE POLICY "Users can view their own custom visibility list"
  ON public.custom_visibility FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can manage their own custom visibility list"
  ON public.custom_visibility FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete from their own custom visibility list"
  ON public.custom_visibility FOR DELETE
  USING (auth.uid() = owner_id);

-- Users can check if they're in someone's custom list
CREATE POLICY "Users can check if they are allowed"
  ON public.custom_visibility FOR SELECT
  USING (auth.uid() = allowed_user_id);

-- Function to check if a viewer can see a specific section of a profile
-- Returns true if the viewer has access, false otherwise
CREATE OR REPLACE FUNCTION public.can_view_profile_section(
  viewer_id UUID,
  profile_owner_id UUID,
  section_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  visibility_setting TEXT;
  is_mutual_follow BOOLEAN;
  is_custom_allowed BOOLEAN;
BEGIN
  -- Owner can always see their own profile
  IF viewer_id = profile_owner_id THEN
    RETURN true;
  END IF;

  -- Get the visibility setting for the requested section
  SELECT 
    CASE section_name
      WHEN 'profile' THEN COALESCE(profile_visibility, 'public')
      WHEN 'schedule' THEN COALESCE(schedule_visibility, 'friends')
      WHEN 'activity' THEN COALESCE(activity_visibility, 'public')
      ELSE 'private'
    END
  INTO visibility_setting
  FROM public.privacy_settings
  WHERE user_id = profile_owner_id;

  -- If no settings exist, use defaults
  IF visibility_setting IS NULL THEN
    visibility_setting := CASE section_name
      WHEN 'profile' THEN 'public'
      WHEN 'schedule' THEN 'friends'
      WHEN 'activity' THEN 'public'
      ELSE 'private'
    END;
  END IF;

  -- Check based on visibility level
  CASE visibility_setting
    WHEN 'public' THEN
      RETURN true;
    
    WHEN 'private' THEN
      RETURN false;
    
    WHEN 'friends' THEN
      -- Check for mutual follow (both follow each other)
      SELECT EXISTS (
        SELECT 1 FROM public.follows f1
        WHERE f1.follower_id = viewer_id 
          AND f1.following_id = profile_owner_id
      ) AND EXISTS (
        SELECT 1 FROM public.follows f2
        WHERE f2.follower_id = profile_owner_id 
          AND f2.following_id = viewer_id
      )
      INTO is_mutual_follow;
      
      RETURN is_mutual_follow;
    
    WHEN 'custom' THEN
      -- Check if viewer is in the custom allowed list
      SELECT EXISTS (
        SELECT 1 FROM public.custom_visibility cv
        WHERE cv.owner_id = profile_owner_id
          AND cv.allowed_user_id = viewer_id
          AND cv.section = section_name
      )
      INTO is_custom_allowed;
      
      RETURN is_custom_allowed;
    
    ELSE
      RETURN false;
  END CASE;
END;
$$;

-- Create index for performance
CREATE INDEX idx_custom_visibility_owner ON public.custom_visibility(owner_id);
CREATE INDEX idx_custom_visibility_allowed ON public.custom_visibility(allowed_user_id);
CREATE INDEX idx_custom_visibility_section ON public.custom_visibility(owner_id, section);

-- Function to get all sections a viewer can see for a profile
CREATE OR REPLACE FUNCTION public.get_viewable_sections(
  viewer_id UUID,
  profile_owner_id UUID
)
RETURNS TABLE (
  can_view_profile BOOLEAN,
  can_view_schedule BOOLEAN,
  can_view_activity BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    public.can_view_profile_section(viewer_id, profile_owner_id, 'profile'),
    public.can_view_profile_section(viewer_id, profile_owner_id, 'schedule'),
    public.can_view_profile_section(viewer_id, profile_owner_id, 'activity');
END;
$$;

