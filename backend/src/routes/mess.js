const express = require('express');
const router = express.Router();
const { getMess, updateMess, regenerateCode } = require('../controllers/messController');
const { protect, adminOnly } = require('../middlewares/auth');
const requireMess = require('../middlewares/requireMess');

router.use(protect);
router.use(requireMess);
router.get('/', getMess);
router.put('/', adminOnly, updateMess);
router.post('/regenerate-code', adminOnly, regenerateCode);

module.exports = router;
