-- Migrations para PostgreSQL
-- Crie um banco chamado "membersdb" (ou use DATABASE_URL)
-- Tabelas: users, refresh_tokens, courses, modules, progress, audit_logs

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS modules (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
  completed_at TIMESTAMP,
  UNIQUE (user_id, course_id, module_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  action TEXT,
  details TEXT,
  created_at TIMESTAMP
);

-- Inserir um admin de exemplo (senha: admin123) - troque em produção
INSERT INTO users (name, email, password, role, blocked, created_at)
SELECT 'Admin', 'admin@local', crypt('admin123', gen_salt('bf')), 'admin', false, NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='admin@local');
