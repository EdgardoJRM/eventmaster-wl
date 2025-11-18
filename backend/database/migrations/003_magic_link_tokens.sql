-- Migration: Magic Link Tokens Table
-- Description: Table to store magic link tokens for passwordless authentication
-- Date: 2025-11-18

-- Create magic_link_tokens table
CREATE TABLE IF NOT EXISTS magic_link_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_token ON magic_link_tokens(token);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_email ON magic_link_tokens(email);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_expires_at ON magic_link_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_email_created ON magic_link_tokens(email, created_at DESC);

-- Add comments
COMMENT ON TABLE magic_link_tokens IS 'Stores magic link tokens for passwordless authentication';
COMMENT ON COLUMN magic_link_tokens.id IS 'Unique identifier for the token record';
COMMENT ON COLUMN magic_link_tokens.email IS 'Email address associated with the magic link';
COMMENT ON COLUMN magic_link_tokens.token IS 'Secure random token sent in magic link email';
COMMENT ON COLUMN magic_link_tokens.expires_at IS 'Timestamp when the token expires (usually 15 minutes)';
COMMENT ON COLUMN magic_link_tokens.used IS 'Whether the token has been used';
COMMENT ON COLUMN magic_link_tokens.created_at IS 'Timestamp when the token was created';
COMMENT ON COLUMN magic_link_tokens.updated_at IS 'Timestamp when the token was last updated';

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_magic_link_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
CREATE TRIGGER trigger_update_magic_link_tokens_updated_at
  BEFORE UPDATE ON magic_link_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_magic_link_tokens_updated_at();

-- Insert migration record
INSERT INTO schema_migrations (version, description, applied_at)
VALUES ('003', 'Create magic_link_tokens table', NOW())
ON CONFLICT (version) DO NOTHING;

