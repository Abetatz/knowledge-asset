-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Knowledge entries table
CREATE TABLE IF NOT EXISTS knowledge_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  phenomenon TEXT NOT NULL,
  background TEXT NOT NULL,
  judgment TEXT NOT NULL,
  judgment_reason TEXT NOT NULL,
  alternative_options TEXT,
  future_verification TEXT,
  additional_1 TEXT,
  additional_2 TEXT,
  additional_3 TEXT,
  additional_4 TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  color VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Knowledge entry tags junction table
CREATE TABLE IF NOT EXISTS knowledge_entry_tags (
  knowledge_entry_id INTEGER NOT NULL REFERENCES knowledge_entries(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (knowledge_entry_id, tag_id)
);

-- Google Drive tokens table
CREATE TABLE IF NOT EXISTS google_drive_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_user_id ON knowledge_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_entry_tags_knowledge_entry_id ON knowledge_entry_tags(knowledge_entry_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_entry_tags_tag_id ON knowledge_entry_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_google_drive_tokens_user_id ON google_drive_tokens(user_id);
