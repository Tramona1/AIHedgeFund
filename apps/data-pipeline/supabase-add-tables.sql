-- Create analyst_ratings table
CREATE TABLE IF NOT EXISTS public.analyst_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL,
    company_name TEXT NOT NULL,
    firm TEXT NOT NULL,
    analyst TEXT,
    rating_date DATE NOT NULL,
    old_rating TEXT,
    new_rating TEXT,
    rating_change TEXT NOT NULL,
    old_price_target DECIMAL(10, 2),
    new_price_target DECIMAL(10, 2),
    price_target_change_percent DECIMAL(10, 2),
    current_price DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for analyst_ratings
CREATE INDEX IF NOT EXISTS idx_analyst_ratings_symbol ON public.analyst_ratings(symbol);
CREATE INDEX IF NOT EXISTS idx_analyst_ratings_firm ON public.analyst_ratings(firm);
CREATE INDEX IF NOT EXISTS idx_analyst_ratings_rating_date ON public.analyst_ratings(rating_date);
CREATE INDEX IF NOT EXISTS idx_analyst_ratings_rating_change ON public.analyst_ratings(rating_change);

-- Enable Row Level Security for analyst_ratings
ALTER TABLE public.analyst_ratings ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for analyst_ratings
CREATE POLICY "Allow read access for all authenticated users for analyst_ratings"
ON public.analyst_ratings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow insert access for service role only for analyst_ratings"
ON public.analyst_ratings FOR INSERT
TO service_role
USING (true);

CREATE POLICY "Allow update access for service role only for analyst_ratings"
ON public.analyst_ratings FOR UPDATE
TO service_role
USING (true);

CREATE POLICY "Allow delete access for service role only for analyst_ratings"
ON public.analyst_ratings FOR DELETE
TO service_role
USING (true); 