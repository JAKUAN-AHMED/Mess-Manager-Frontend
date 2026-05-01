const express = require('express');
const router  = express.Router();
const { addAdjustment, getAdjustments, deleteAdjustment } = require('../controllers/mealAdjustmentController');
const { protect, adminOnly } = require('../middlewares/auth');
const requireMess = require('../middlewares/requireMess');

router.use(protect);
router.use(requireMess);
router.get('/',    getAdjustments);
router.post('/',   adminOnly, addAdjustment);
router.delete('/:id', adminOnly, deleteAdjustment);

module.exports = router;
