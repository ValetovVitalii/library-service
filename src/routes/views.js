const express = require('express');
const db = require('../db/database');

const router = express.Router();

const BOOK_SELECT = `
  SELECT b.*, a.full_name AS author_name
  FROM books b
  JOIN authors a ON a.id = b.author_id
`;

const count = (table) => db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get().c;

// GET / : басты бет (кітаптар тізімі және іздеу)
router.get('/', (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

  let books;
  if (search) {
    const q = `%${search.toLowerCase()}%`;
    books = db.prepare(`
      ${BOOK_SELECT}
      WHERE lower_utf(b.title) LIKE ? OR lower_utf(a.full_name) LIKE ? OR b.isbn LIKE ?
      ORDER BY b.id
    `).all(q, q, `%${search}%`);
  } else {
    books = db.prepare(`${BOOK_SELECT} ORDER BY b.id`).all();
  }

  const stats = {
    books: count('books'),
    authors: count('authors'),
    readers: count('readers'),
    active: db.prepare("SELECT COUNT(*) AS c FROM borrowings WHERE status = 'borrowed'").get().c,
  };

  res.render('index', { title: 'Басты бет', books, search, stats });
});

// GET /books/:id : жеке кітап беті
router.get('/books/:id', (req, res) => {
  const notFoundPage = () => res.status(404).render('404', { title: 'Бет табылмады' });

  if (!/^\d+$/.test(req.params.id)) return notFoundPage();

  const book = db.prepare(`${BOOK_SELECT} WHERE b.id = ?`).get(req.params.id);
  if (!book) return notFoundPage();

  const history = db.prepare(`
    SELECT br.*, r.full_name AS reader_name
    FROM borrowings br
    JOIN readers r ON r.id = br.reader_id
    WHERE br.book_id = ?
    ORDER BY br.id DESC
  `).all(book.id);

  res.render('book', { title: book.title, book, history });
});

module.exports = router;