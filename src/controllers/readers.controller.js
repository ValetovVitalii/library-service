const db = require('../db/database');

const READER_SELECT = `
  SELECT r.*, c.card_number, c.status AS card_status, c.expires_at AS card_expires_at
  FROM readers r
  LEFT JOIN library_cards c ON c.reader_id = r.id
`;

// Оқырман мен билетті бір транзакцияда құрамыз: біреуі сәтсіз болса, екеуі де бас тартылады
const register = db.transaction((r) => {
  const id = db.prepare(
    'INSERT INTO readers (full_name, email, phone, birth_date, address) VALUES (?, ?, ?, ?, ?)'
  ).run(r.full_name, r.email, r.phone ?? null, r.birth_date ?? null, r.address ?? null)
    .lastInsertRowid;

  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 2);

  db.prepare(
    'INSERT INTO library_cards (reader_id, card_number, expires_at) VALUES (?, ?, ?)'
  ).run(id, `LIB-${String(id).padStart(4, '0')}`, expires.toISOString().slice(0, 10));

  return id;
});

function getAll(req, res) {
  res.status(200).json(db.prepare(`${READER_SELECT} ORDER BY r.id`).all());
}

function getById(req, res) {
  const reader = db.prepare(`${READER_SELECT} WHERE r.id = ?`).get(req.params.id);
  if (!reader) return res.status(404).json({ error: 'Оқырман табылмады' });
  res.status(200).json(reader);
}

function create(req, res) {
  const id = register(req.body);
  res.status(201).json(db.prepare(`${READER_SELECT} WHERE r.id = ?`).get(id));
}

function update(req, res) {
  const id = req.params.id;
  if (!db.prepare('SELECT 1 FROM readers WHERE id = ?').get(id)) {
    return res.status(404).json({ error: 'Оқырман табылмады' });
  }
  const { full_name, email, phone, birth_date, address } = req.body;
  db.prepare(`
    UPDATE readers SET full_name = ?, email = ?, phone = ?, birth_date = ?, address = ?
    WHERE id = ?
  `).run(full_name, email, phone ?? null, birth_date ?? null, address ?? null, id);

  res.status(200).json(db.prepare(`${READER_SELECT} WHERE r.id = ?`).get(id));
}

function remove(req, res) {
  const result = db.prepare('DELETE FROM readers WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Оқырман табылмады' });
  res.status(200).json({ message: 'Оқырман өшірілді' });
}

module.exports = { getAll, getById, create, update, remove };