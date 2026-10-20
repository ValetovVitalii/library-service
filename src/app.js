const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const { notFound, errorHandler } = require('./middleware/errorHandler');

// JSON және форма деректерін оқу
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/api/books', require('./routes/books'));

app.use('/api/books', require('./routes/books'));
app.use('/api/authors', require('./routes/authors'));
app.use('/api/readers', require('./routes/readers'));
app.use('/api/borrowings', require('./routes/borrowings'));

app.use('/api/borrowings', require('./routes/borrowings'));
app.use('/', require('./routes/views'));

app.use(notFound);
app.use(errorHandler);

app.use(notFound);
app.use(errorHandler);

app.use(notFound);
app.use(errorHandler);
// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Тексеру үшін қарапайым endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'library-service' });
});

app.listen(PORT, () => {
  console.log(`Сервер іске қосылды: http://localhost:${PORT}`);
});