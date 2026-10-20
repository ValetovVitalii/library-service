const isInt = (v) => Number.isInteger(v);
const isStr = (v) => typeof v === 'string';
const blank = (v) => v === undefined || v === null || (isStr(v) && v.trim() === '');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function checkBody(req, res) {
  const b = req.body;
  if (!b || typeof b !== 'object' || Array.isArray(b)) {
    res.status(400).json({ error: 'Сұраныс денесі JSON объект болуы керек' });
    return false;
  }
  return true;
}

function finish(errors, res, next) {
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Валидация қатесі', details: errors });
  }
  next();
}

function validateAuthor(req, res, next) {
  if (!checkBody(req, res)) return;
  const b = req.body;
  const errors = [];
  const add = (field, message) => errors.push({ field, message });

  if (blank(b.full_name)) add('full_name', 'Міндетті өріс');
  else if (!isStr(b.full_name) || b.full_name.trim().length > 150)
    add('full_name', 'Мәтін болуы керек, ұзындығы 150 символдан аспауы керек');

  if (b.birth_year != null) {
    if (!isInt(b.birth_year)) add('birth_year', 'Бүтін сан болуы керек');
    else if (b.birth_year < 1 || b.birth_year > 2100)
      add('birth_year', '1 мен 2100 аралығында болуы керек');
  }
  for (const f of ['country', 'biography']) {
    if (b[f] != null && !isStr(b[f])) add(f, 'Мәтін болуы керек');
  }

  if (errors.length === 0) b.full_name = b.full_name.trim();
  finish(errors, res, next);
}

function validateReader(req, res, next) {
  if (!checkBody(req, res)) return;
  const b = req.body;
  const errors = [];
  const add = (field, message) => errors.push({ field, message });

  if (blank(b.full_name)) add('full_name', 'Міндетті өріс');
  else if (!isStr(b.full_name) || b.full_name.trim().length > 150)
    add('full_name', 'Мәтін болуы керек, ұзындығы 150 символдан аспауы керек');

  if (blank(b.email)) add('email', 'Міндетті өріс');
  else if (!isStr(b.email) || !EMAIL_RE.test(b.email.trim()))
    add('email', 'Email форматы дұрыс емес');

  if (b.phone != null && (!isStr(b.phone) || !/^\+?[0-9\s()-]{7,20}$/.test(b.phone)))
    add('phone', 'Телефон форматы дұрыс емес');

  if (b.birth_date != null) {
    const ok =
      isStr(b.birth_date) &&
      /^\d{4}-\d{2}-\d{2}$/.test(b.birth_date) &&
      !Number.isNaN(Date.parse(b.birth_date)) &&
      b.birth_date <= new Date().toISOString().slice(0, 10);
    if (!ok) add('birth_date', 'Формат YYYY-MM-DD болуы керек, болашақ күн болмауы керек');
  }

  if (b.address != null && !isStr(b.address)) add('address', 'Мәтін болуы керек');

  if (errors.length === 0) {
    b.full_name = b.full_name.trim();
    b.email = b.email.trim().toLowerCase();
  }
  finish(errors, res, next);
}

function validateBorrowing(req, res, next) {
  if (!checkBody(req, res)) return;
  const b = req.body;
  const errors = [];
  const add = (field, message) => errors.push({ field, message });

  for (const f of ['book_id', 'reader_id']) {
    if (blank(b[f])) add(f, 'Міндетті өріс');
    else if (!isInt(b[f]) || b[f] < 1) add(f, 'Оң бүтін сан болуы керек');
  }
  if (b.days != null && (!isInt(b.days) || b.days < 1 || b.days > 60))
    add('days', '1 мен 60 аралығындағы бүтін сан болуы керек');

  finish(errors, res, next);
}

module.exports = { validateAuthor, validateReader, validateBorrowing };