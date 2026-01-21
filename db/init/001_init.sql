-- Chats (группы/супергруппы)
CREATE TABLE IF NOT EXISTS chats (
  id BIGSERIAL PRIMARY KEY,
  tg_chat_id BIGINT NOT NULL UNIQUE,
  title TEXT,
  type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  tg_user_id BIGINT NOT NULL UNIQUE,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  chat_id BIGINT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tg_message_id BIGINT,
  text TEXT NOT NULL,
  message_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индексы под будущие stats/analyze
CREATE INDEX IF NOT EXISTS idx_messages_chat_date ON messages(chat_id, message_date DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user_date ON messages(user_id, message_date DESC);
CREATE INDEX IF NOT EXISTS idx_messages_chat_user_date ON messages(chat_id, user_id, message_date DESC);

-- Триггер на updated_at (чтобы upsert обновлял updated_at красиво)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_chats_updated_at') THEN
    CREATE TRIGGER trg_chats_updated_at
    BEFORE UPDATE ON chats
    FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_updated_at') THEN
    CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
  END IF;
END $$;
