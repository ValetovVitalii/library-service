const db = require('../db/database');

function getAll(req, res) {
  const authors = db.prepare(`
    SELECT a.*, COUNT(b.id) AS books_count
    FROM authors a
    LEFT JOIN books b ON b.author_id = a.id
    GROUP BY a.id
    ORDER BY a.id
  `).all();
  res.status(200).json(authors);
}

function getById(req, res) {
  const author = db.prepare('SELECT * FROM authors WHERE id = ?').get(req.params.id);
  if (!author) return res.status(404).json({ error: 'Автор табылмады' });

  const books = db.prepare(
    'SELECT id, title, isbn, publish_year FROM books WHERE author_id = ? ORDER BY id'
  ).all(author.id);
  res.status(200).json({ ...author, books });
}

function create(req, res) {
  const { full_name, birth_year, country, biography } = req.body;
  const result = db.prepare(
    'INSERT INTO authors (full_name, birth_year, country, biography) VALUES (?, ?, ?, ?)'
  ).run(full_name, birth_year ?? null, country ?? null, biography ?? null);

  const created = db.prepare('SELECT * FROM authors WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
}

function update(req, res) {
  const id = req.params.id;
  if (!db.prepare('SELECT 1 FROM authors WHERE id = ?').get(id)) {
    return res.status(404).json({ error: 'Автор табылмады' });
  }
  const { full_name, birth_year, country, biography } = req.body;
  db.prepare(
    'UPDATE authors SET full_name = ?, birth_year = ?, country = ?, biography = ? WHERE id = ?'
  ).run(full_name, birth_year ?? null, country ?? null, biography ?? null, id);

  res.status(200).json(db.prepare('SELECT * FROM authors WHERE id = ?').get(id));
}

function remove(req, res) {
  const result = db.prepare('DELETE FROM authors WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Автор табылмады' });
  res.status(200).json({ message: 'Автор өшірілді' });
}

module.exports = { getAll, getById, create, update, remove };