const express = require('express');
const router = express.Router();
const { addOrUpdateMeal, getMeals, deleteMeal } = require('../controllers/mealController');
const { protect, adminOnly } = require('../middlewares/auth');
const requireMess = require('../middlewares/requireMess');

router.use(protect);
router.use(requireMess);
router.get('/', getMeals);
router.post('/', addOrUpdateMeal);
router.delete('/:id', adminOnly, deleteMeal);

module.exports = router;
