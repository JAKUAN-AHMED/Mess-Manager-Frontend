const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middlewares/auth');
const requireMess = require('../middlewares/requireMess');
const { getAdvancePayments, addAdvancePayment, deleteAdvancePayment } = require('../controllers/advancePaymentController');

router.use(protect);
router.use(requireMess);
router.get('/', getAdvancePayments);
router.post('/', adminOnly, addAdvancePayment);
router.delete('/:id', adminOnly, deleteAdvancePayment);

module.exports = router;
