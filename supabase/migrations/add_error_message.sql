-- Add error_message column to reviews table
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS error_message text;

-- Add index for faster error queries
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_user_created ON reviews(user_id, created_at DESC);

