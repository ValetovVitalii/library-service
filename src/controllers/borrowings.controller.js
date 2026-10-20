const db = require('../db/database');

const BORROWING_SELECT = `
  SELECT br.*, b.title AS book_title, r.full_name AS reader_name
  FROM borrowings br
  JOIN books b ON b.id = br.book_id
  JOIN readers r ON r.id = br.reader_id
`;

const today = () => new Date().toISOString().slice(0, 10);
function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// GET /api/borrowings?status=borrowed&reader_id=1
function getAll(req, res) {
  const { status, reader_id } = req.query;
  const where = [];
  const params = [];

  if (status !== undefined) {
    if (!['borrowed', 'returned'].includes(status)) {
      return res.status(400).json({ error: 'status тек borrowed немесе returned болуы керек' });
    }
    where.push('br.status = ?');
    params.push(status);
  }
  if (reader_id !== undefined) {
    if (!/^\d+$/.test(reader_id)) {
      return res.status(400).json({ error: 'reader_id оң бүтін сан болуы керек' });
    }
    where.push('br.reader_id = ?');
    params.push(Number(reader_id));
  }

  const sql = `${BORROWING_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY br.id`;
  res.status(200).json(db.prepare(sql).all(...params));
}

function getById(req, res) {
  const row = db.prepare(`${BORROWING_SELECT} WHERE br.id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Жазба табылмады' });
  res.status(200).json(row);
}

// POST /api/borrowings : кітап беру
function create(req, res) {
  const { book_id, reader_id } = req.body;
  const days = req.body.days ?? 14;

  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(book_id);
  if (!book) return res.status(404).json({ error: 'Кітап табылмады' });

  if (!db.prepare('SELECT 1 FROM readers WHERE id = ?').get(reader_id)) {
    return res.status(404).json({ error: 'Оқырман табылмады' });
  }

  const card = db.prepare('SELECT * FROM library_cards WHERE reader_id = ?').get(reader_id);
  if (!card || card.status !== 'active' || card.expires_at < today()) {
    return res.status(403).json({ error: 'Оқырман билеті белсенді емес немесе мерзімі өткен' });
  }

  if (book.available_copies < 1) {
    return res.status(409).json({ error: 'Кітаптың бос даналары жоқ' });
  }

  const alreadyHas = db.prepare(
    "SELECT 1 FROM borrowings WHERE book_id = ? AND reader_id = ? AND status = 'borrowed'"
  ).get(book_id, reader_id);
  if (alreadyHas) {
    return res.status(409).json({ error: 'Оқырман бұл кітапты әлі қайтармаған' });
  }

  // Екі әрекет бір транзакцияда: жазба қосу және бос даналарды азайту
  const borrow = db.transaction(() => {
    const id = db.prepare(
      'INSERT INTO borrowings (book_id, reader_id, due_date) VALUES (?, ?, ?)'
    ).run(book_id, reader_id, addDays(days)).lastInsertRowid;
    db.prepare('UPDATE books SET available_copies = available_copies - 1 WHERE id = ?').run(book_id);
    return id;
  });

  const id = borrow();
  res.status(201).json(db.prepare(`${BORROWING_SELECT} WHERE br.id = ?`).get(id));
}

// PUT /api/borrowings/:id/return : кітап қайтару
function giveBack(req, res) {
  const id = req.params.id;
  const row = db.prepare('SELECT * FROM borrowings WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ error: 'Жазба табылмады' });
  if (row.status === 'returned') {
    return res.status(409).json({ error: 'Кітап бұрын қайтарылған' });
  }

  const giveBackTx = db.transaction(() => {
    db.prepare("UPDATE borrowings SET status = 'returned', returned_at = ? WHERE id = ?")
      .run(today(), id);
    db.prepare('UPDATE books SET available_copies = available_copies + 1 WHERE id = ?')
      .run(row.book_id);
  });
  giveBackTx();

  res.status(200).json(db.prepare(`${BORROWING_SELECT} WHERE br.id = ?`).get(id));
}

module.exports = { getAll, getById, create, giveBack };