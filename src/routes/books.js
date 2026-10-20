const express = require('express');
const books = require('../controllers/books.controller');
const { validateId, validateBook, validateFormat } = require('../middleware/validate');

const router = express.Router();

router.get('/', validateFormat, books.getAll);
router.get('/:id', validateId, validateFormat, books.getById);
router.post('/', validateBook, books.create);
router.put('/:id', validateId, validateBook, books.update);
router.delete('/:id', validateId, books.remove);

module.exports = router;
