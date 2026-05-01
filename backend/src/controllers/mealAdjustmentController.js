const MealAdjustment = require('../models/MealAdjustment');
const { requireMessId, userBelongsToMess, getMessUserIds } = require('../utils/messTenant');

// POST /api/meal-adjustments
exports.addAdjustment = async (req, res) => {
  try {
    const messId = requireMessId(req);
    if (!messId)
      return res.status(403).json({ success: false, error: 'মেস সংযুক্ত নয়' });

    const { userId, month, year, amount, reason } = req.body;
    if (!userId || !month || !year || amount === undefined) {
      return res.status(400).json({ success: false, error: 'সব তথ্য দিন' });
    }
    if (!(await userBelongsToMess(messId, userId))) {
      return res.status(403).json({ success: false, error: 'এই সদস্যকে আপনার মেসে পাওয়া যায়নি' });
    }
    const adj = await MealAdjustment.create({
      user: userId, month, year,
      amount: parseFloat(amount),
      reason: reason || '',
      createdBy: req.user._id,
    });
    await adj.populate('user', 'name phone');
    res.status(201).json({ success: true, data: adj });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/meal-adjustments?month=M&year=Y
exports.getAdjustments = async (req, res) => {
  try {
    const messId = requireMessId(req);
    if (!messId)
      return res.status(403).json({ success: false, error: 'মেস সংযুক্ত নয়' });

    const messUserIds = await getMessUserIds(messId);
    const filter = { user: { $in: messUserIds } };
    const { month, year } = req.query;
    if (month) filter.month = parseInt(month);
    if (year)  filter.year  = parseInt(year);
    const adjustments = await MealAdjustment.find(filter)
      .populate('user', 'name phone')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: adjustments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/meal-adjustments/:id
exports.deleteAdjustment = async (req, res) => {
  try {
    const messId = requireMessId(req);
    if (!messId)
      return res.status(403).json({ success: false, error: 'মেস সংযুক্ত নয়' });

    const adj = await MealAdjustment.findById(req.params.id);
    if (!adj) return res.status(404).json({ success: false, error: 'পাওয়া যায়নি' });
    if (!(await userBelongsToMess(messId, adj.user))) {
      return res.status(403).json({ success: false, error: 'অনুমতি নেই' });
    }
    await MealAdjustment.deleteOne({ _id: adj._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
