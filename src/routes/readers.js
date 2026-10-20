const express = require('express');
const readers = require('../controllers/readers.controller');
const { validateId } = require('../middleware/validate');
const { validateReader } = require('../middleware/validators');

const router = express.Router();

router.get('/', readers.getAll);
router.get('/:id', validateId, readers.getById);
router.post('/', validateReader, readers.create);
router.put('/:id', validateId, validateReader, readers.update);
router.delete('/:id', validateId, readers.remove);

module.exports = router;