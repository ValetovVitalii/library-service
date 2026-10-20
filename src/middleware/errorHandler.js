// Табылмаған маршрут
function notFound(req, res) {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ error: `Маршрут табылмады: ${req.method} ${req.originalUrl}` });
  }
  res.status(404).render('404', { title: 'Бет табылмады' });
}

// Орталық қате өңдегіш (4 аргумент болуы міндетті)
function errorHandler(err, req, res, next) {
  // Бұзылған JSON келсе
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON форматы дұрыс емес' });
  }

  // SQLite шектеулерінің қателері
  switch (err.code) {
    case 'SQLITE_CONSTRAINT_UNIQUE': {
      const field = err.message.split('.').pop().trim();
      return res.status(409).json({ error: 'Бұл мән бұрыннан бар', field });
    }
    case 'SQLITE_CONSTRAINT_FOREIGNKEY':
      return res.status(409).json({
        error: 'Байланысты жазбалар бар, әрекетті орындау мүмкін емес',
      });
    case 'SQLITE_CONSTRAINT_CHECK':
    case 'SQLITE_CONSTRAINT_NOTNULL':
      return res.status(400).json({ error: 'Деректер шектеуге сәйкес келмейді' });
  }

  // Қалған күтпеген қателер
  console.error(err);
  res.status(500).json({ error: 'Сервер қатесі' });
}

module.exports = { notFound, errorHandler };