-- Add author_name and is_system_message to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS author_name text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_system_message boolean DEFAULT false;

-- Backfill existing messages with current profile usernames
UPDATE messages 
SET author_name = (
  SELECT username 
  FROM profiles 
  WHERE profiles.id = messages.user_id
)
WHERE author_name IS NULL;
