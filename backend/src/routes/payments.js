const express = require('express');
const router = express.Router();
const { recordPayment, getPayments } = require('../controllers/paymentController');
const { protect, adminOnly } = require('../middlewares/auth');
const requireMess = require('../middlewares/requireMess');

router.use(protect);
router.use(requireMess);
router.get('/', getPayments);
router.post('/', adminOnly, recordPayment);

module.exports = router;
