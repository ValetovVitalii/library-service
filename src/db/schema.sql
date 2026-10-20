CREATE TABLE IF NOT EXISTS authors (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name   TEXT NOT NULL,
  birth_year  INTEGER CHECK (birth_year BETWEEN 1 AND 2100),
  country     TEXT,
  biography   TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS books (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  title            TEXT NOT NULL,
  isbn             TEXT NOT NULL UNIQUE,
  author_id        INTEGER NOT NULL,
  genre            TEXT,
  publisher        TEXT,
  publish_year     INTEGER CHECK (publish_year BETWEEN 1000 AND 2100),
  pages            INTEGER CHECK (pages > 0),
  language         TEXT DEFAULT 'kk',
  total_copies     INTEGER NOT NULL DEFAULT 1 CHECK (total_copies >= 0),
  available_copies INTEGER NOT NULL DEFAULT 1,
  description      TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (available_copies >= 0 AND available_copies <= total_copies),
  FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS readers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  phone       TEXT,
  birth_date  TEXT,
  address     TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS library_cards (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  reader_id    INTEGER NOT NULL UNIQUE,
  card_number  TEXT NOT NULL UNIQUE,
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'expired')),
  issued_at    TEXT NOT NULL DEFAULT (date('now')),
  expires_at   TEXT NOT NULL,
  FOREIGN KEY (reader_id) REFERENCES readers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS borrowings (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id      INTEGER NOT NULL,
  reader_id    INTEGER NOT NULL,
  borrowed_at  TEXT NOT NULL DEFAULT (date('now')),
  due_date     TEXT NOT NULL,
  returned_at  TEXT,
  status       TEXT NOT NULL DEFAULT 'borrowed' CHECK (status IN ('borrowed', 'returned')),
  FOREIGN KEY (book_id)   REFERENCES books(id)   ON DELETE RESTRICT,
  FOREIGN KEY (reader_id) REFERENCES readers(id) ON DELETE RESTRICT
);