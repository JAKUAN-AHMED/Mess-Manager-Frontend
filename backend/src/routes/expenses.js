const express = require('express');
const router = express.Router();
const { addExpense, getExpenses, updateExpense, deleteExpense } = require('../controllers/expenseController');
const { protect, adminOnly } = require('../middlewares/auth');
const requireMess = require('../middlewares/requireMess');

router.use(protect);
router.use(requireMess);
router.get('/', getExpenses);
router.post('/', addExpense);
router.put('/:id',    adminOnly, updateExpense);
router.delete('/:id', adminOnly, deleteExpense);

module.exports = router;
