const express = require('express');
const authors = require('../controllers/authors.controller');
const { validateId } = require('../middleware/validate');
const { validateAuthor } = require('../middleware/validators');

const router = express.Router();

router.get('/', authors.getAll);
router.get('/:id', validateId, authors.getById);
router.post('/', validateAuthor, authors.create);
router.put('/:id', validateId, validateAuthor, authors.update);
router.delete('/:id', validateId, authors.remove);

module.exports = router;