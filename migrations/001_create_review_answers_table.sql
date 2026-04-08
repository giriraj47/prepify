-- Create review_answers table for autosaving review responses
CREATE TABLE IF NOT EXISTS public.review_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  roadmap_id UUID NOT NULL,
  answers JSONB DEFAULT '{}'::jsonb,
  submitted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Foreign keys
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_roadmap_id FOREIGN KEY (roadmap_id) REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  
  -- Unique constraint: one review per user per roadmap
  CONSTRAINT unique_user_roadmap UNIQUE (user_id, roadmap_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_review_answers_user_id ON public.review_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_review_answers_roadmap_id ON public.review_answers(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_review_answers_user_roadmap ON public.review_answers(user_id, roadmap_id);
CREATE INDEX IF NOT EXISTS idx_review_answers_submitted ON public.review_answers(submitted, user_id);

-- Enable Row Level Security
ALTER TABLE public.review_answers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy 1: Users can only see their own review answers
CREATE POLICY "users_can_view_own_review_answers" 
ON public.review_answers FOR SELECT 
USING (auth.uid() = user_id);

-- Policy 2: Users can only insert their own review answers
CREATE POLICY "users_can_insert_review_answers" 
ON public.review_answers FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can only update their own review answers
CREATE POLICY "users_can_update_own_review_answers" 
ON public.review_answers FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can only delete their own review answers
CREATE POLICY "users_can_delete_own_review_answers" 
ON public.review_answers FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_review_answers_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_review_answers_timestamp_trigger
BEFORE UPDATE ON public.review_answers
FOR EACH ROW
EXECUTE FUNCTION public.update_review_answers_timestamp();
