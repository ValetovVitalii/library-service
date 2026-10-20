const express = require('express');
const borrowings = require('../controllers/borrowings.controller');
const { validateId } = require('../middleware/validate');
const { validateBorrowing } = require('../middleware/validators');

const router = express.Router();

router.get('/', borrowings.getAll);
router.get('/:id', validateId, borrowings.getById);
router.post('/', validateBorrowing, borrowings.create);
router.put('/:id/return', validateId, borrowings.giveBack);

module.exports = router;