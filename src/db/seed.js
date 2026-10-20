const db = require('./database');

const existing = db.prepare('SELECT COUNT(*) AS c FROM authors').get().c;
if (existing > 0) {
  console.log('Деректер бұрыннан бар, seed өткізілді.');
  process.exit(0);
}

const insertAuthor = db.prepare(
  'INSERT INTO authors (full_name, birth_year, country, biography) VALUES (?, ?, ?, ?)'
);
const insertBook = db.prepare(`
  INSERT INTO books (title, isbn, author_id, genre, publisher, publish_year, pages, language, total_copies, available_copies, description)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertReader = db.prepare(
  'INSERT INTO readers (full_name, email, phone, birth_date, address) VALUES (?, ?, ?, ?, ?)'
);
const insertCard = db.prepare(
  'INSERT INTO library_cards (reader_id, card_number, expires_at) VALUES (?, ?, ?)'
);
const insertBorrowing = db.prepare(
  'INSERT INTO borrowings (book_id, reader_id, due_date) VALUES (?, ?, ?)'
);

const seed = db.transaction(() => {
  const abai = insertAuthor.run('Абай Құнанбайұлы', 1845, 'Қазақстан', 'Қазақ ақыны, ағартушы.').lastInsertRowid;
  const auezov = insertAuthor.run('Мұхтар Әуезов', 1897, 'Қазақстан', 'Жазушы, драматург, ғалым.').lastInsertRowid;
  const esenberlin = insertAuthor.run('Ілияс Есенберлин', 1915, 'Қазақстан', 'Жазушы, тарихи романдар авторы.').lastInsertRowid;

  insertBook.run('Қара сөздер', '978-601-0000-01-1', abai, 'Философия', 'Жазушы', 1990, 180, 'kk', 3, 3, 'Абайдың қара сөздері.');
  const abaiJoly = insertBook.run('Абай жолы', '978-601-0000-02-8', auezov, 'Роман', 'Жазушы', 1995, 720, 'kk', 5, 4, 'Роман-эпопея.').lastInsertRowid;
  insertBook.run('Қилы заман', '978-601-0000-03-5', auezov, 'Повесть', 'Атамұра', 2005, 150, 'kk', 2, 2, 'Тарихи повесть.');
  insertBook.run('Көшпенділер', '978-601-0000-04-2', esenberlin, 'Тарихи роман', 'Жазушы', 2000, 640, 'kk', 4, 4, 'Тарихи роман-трилогия.');

  const r1 = insertReader.run('Айгүл Серікова', 'aigul@example.com', '+77010000001', '2003-05-14', 'Алматы').lastInsertRowid;
  const r2 = insertReader.run('Нұрлан Ахметов', 'nurlan@example.com', '+77010000002', '2002-11-30', 'Алматы').lastInsertRowid;
  insertCard.run(r1, 'LIB-0001', '2027-12-31');
  insertCard.run(r2, 'LIB-0002', '2027-12-31');

  insertBorrowing.run(abaiJoly, r1, '2026-11-01');
});

seed();

const count = (t) => db.prepare(`SELECT COUNT(*) AS c FROM ${t}`).get().c;
console.log(
  `Дайын: authors=${count('authors')}, books=${count('books')}, readers=${count('readers')}, borrowings=${count('borrowings')}`
);