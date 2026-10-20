const db = require('../db/database');
const { itemToXml, listToXml, wantsXml, sendXml } = require('../utils/xml');

// Кітапты автордың атымен бірге қайтару үшін ортақ сұраныс
const BOOK_SELECT = `
  SELECT b.*, a.full_name AS author_name
  FROM books b
  JOIN authors a ON a.id = b.author_id
`;

// GET /api/books
function getAll(req, res) {
  const { search, genre, author_id } = req.query;
  const where = [];
  const params = [];

  if (search) {
    const q = `%${String(search).toLowerCase()}%`;
    where.push('(lower_utf(b.title) LIKE ? OR lower_utf(a.full_name) LIKE ? OR b.isbn LIKE ?)');
    params.push(q, q, `%${search}%`);
  }
  if (genre) {
    where.push('lower_utf(b.genre) = ?');
    params.push(String(genre).toLowerCase());
  }
  if (author_id !== undefined) {
    if (!/^\d+$/.test(author_id)) {
      return res.status(400).json({ error: 'author_id оң бүтін сан болуы керек' });
    }
    where.push('b.author_id = ?');
    params.push(Number(author_id));
  }

  const sql = `${BOOK_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY b.id`;
  const books = db.prepare(sql).all(...params);
  if (wantsXml(req)) {
    return sendXml(res, 200, listToXml('books', 'book', books));
  }
  res.status(200).json(books);
}

// GET /api/books/:id
function getById(req, res) {
  const book = db.prepare(`${BOOK_SELECT} WHERE b.id = ?`).get(req.params.id);
  if (!book) {
    return res.status(404).json({ error: 'Кітап табылмады' });
  }
  if (wantsXml(req)) {
  return sendXml(res, 200, itemToXml('book', book));
  }
  res.status(200).json(book);
}

// POST /api/books
function create(req, res) {
  const {
    title, isbn, author_id, genre, publisher,
    publish_year, pages, language, total_copies, description,
  } = req.body;

  const copies = total_copies ?? 1;

  const result = db.prepare(`
    INSERT INTO books
      (title, isbn, author_id, genre, publisher, publish_year, pages,
       language, total_copies, available_copies, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title ?? null, isbn ?? null, author_id ?? null, genre ?? null,
    publisher ?? null, publish_year ?? null, pages ?? null,
    language ?? 'kk', copies, copies, description ?? null
  );

  const created = db.prepare(`${BOOK_SELECT} WHERE b.id = ?`).get(result.lastInsertRowid);
  res.status(201).json(created);
}

// PUT /api/books/:id
function update(req, res) {
  const id = req.params.id;
  const old = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
  if (!old) {
    return res.status(404).json({ error: 'Кітап табылмады' });
  }

  const {
    title, isbn, author_id, genre, publisher,
    publish_year, pages, language, total_copies, description,
  } = req.body;

  // Жалпы даналар саны өзгерсе, қолжетімді даналар да сол айырмаға өзгереді
  const newTotal = total_copies ?? old.total_copies;
  const newAvailable = old.available_copies + (newTotal - old.total_copies);

  db.prepare(`
    UPDATE books SET
      title = ?, isbn = ?, author_id = ?, genre = ?, publisher = ?,
      publish_year = ?, pages = ?, language = ?,
      total_copies = ?, available_copies = ?, description = ?
    WHERE id = ?
  `).run(
    title ?? null, isbn ?? null, author_id ?? null, genre ?? null,
    publisher ?? null, publish_year ?? null, pages ?? null,
    language ?? 'kk', newTotal, newAvailable, description ?? null, id
  );

  const updated = db.prepare(`${BOOK_SELECT} WHERE b.id = ?`).get(id);
  res.status(200).json(updated);
}

// DELETE /api/books/:id
function remove(req, res) {
  const result = db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Кітап табылмады' });
  }
  res.status(200).json({ message: 'Кітап өшірілді' });
}

module.exports = { getAll, getById, create, update, remove };