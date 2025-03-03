-- Create the ai_queries table for storing user query history
CREATE TABLE IF NOT EXISTS ai_queries (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    data JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ai_queries_user_id ON ai_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_queries_created_at ON ai_queries(created_at);

-- Add row-level security policies
ALTER TABLE ai_queries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own queries
CREATE POLICY ai_queries_select_policy
    ON ai_queries
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can only insert their own queries
CREATE POLICY ai_queries_insert_policy
    ON ai_queries
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own queries
CREATE POLICY ai_queries_update_policy
    ON ai_queries
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own queries
CREATE POLICY ai_queries_delete_policy
    ON ai_queries
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_queries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_queries_updated_at
BEFORE UPDATE ON ai_queries
FOR EACH ROW EXECUTE FUNCTION update_ai_queries_updated_at(); 