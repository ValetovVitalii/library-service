const db = require('../db/database');

const isInt = (v) => typeof v === 'number' && Number.isInteger(v);
const isStr = (v) => typeof v === 'string';
const missing = (v) =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

// :id параметрін тексеру
function validateId(req, res, next) {
  if (!/^\d+$/.test(req.params.id) || Number(req.params.id) < 1) {
    return res.status(400).json({ error: 'ID оң бүтін сан болуы керек' });
  }
  next();
}

function validateFormat(req, res, next) {
  const f = req.query.format;
  if (f !== undefined && !['json', 'xml'].includes(f)) {
    return res.status(400).json({ error: 'format тек json немесе xml болуы керек' });
  }
  next();
}

// POST және PUT үшін кітап деректерін тексеру
function validateBook(req, res, next) {
  const b = req.body;
  if (!b || typeof b !== 'object' || Array.isArray(b)) {
    return res.status(400).json({ error: 'Сұраныс денесі JSON объект болуы керек' });
  }

  const errors = [];
  const add = (field, message) => errors.push({ field, message });

  // 1) Міндетті өрістер
  if (missing(b.title)) add('title', 'Міндетті өріс');
  else if (!isStr(b.title)) add('title', 'Мәтін болуы керек');
  else if (b.title.trim().length > 200) add('title', 'Ұзындығы 200 символдан аспауы керек');

  if (missing(b.isbn)) add('isbn', 'Міндетті өріс');
  else if (!isStr(b.isbn) || !/^[0-9-]{10,17}$/.test(b.isbn.trim()))
    add('isbn', 'ISBN форматы дұрыс емес (тек сандар мен сызықша, 10–17 символ)');

  if (missing(b.author_id)) add('author_id', 'Міндетті өріс');
  else if (!isInt(b.author_id) || b.author_id < 1) add('author_id', 'Оң бүтін сан болуы керек');
  else if (!db.prepare('SELECT 1 FROM authors WHERE id = ?').get(b.author_id))
    add('author_id', 'Мұндай автор жоқ');

  // 2) Дұрыс емес деректер типі (міндетті емес сандық өрістер)
  const intRules = {
    publish_year: [1000, 2100],
    pages: [1, 100000],
    total_copies: [0, 100000],
  };
  for (const [field, [min, max]] of Object.entries(intRules)) {
    const v = b[field];
    if (v === undefined || v === null) continue;
    if (!isInt(v)) add(field, 'Бүтін сан болуы керек');
    else if (v < min || v > max) add(field, `${min} мен ${max} аралығында болуы керек`);
  }

  // Міндетті емес мәтіндік өрістер
  for (const field of ['genre', 'publisher', 'language', 'description']) {
    const v = b[field];
    if (v !== undefined && v !== null && !isStr(v)) add(field, 'Мәтін болуы керек');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Валидация қатесі', details: errors });
  }

  // Тексеруден өткен мәтіндерді тазалау
  b.title = b.title.trim();
  b.isbn = b.isbn.trim();
  next();
}

module.exports = { validateId, validateBook, validateFormat };