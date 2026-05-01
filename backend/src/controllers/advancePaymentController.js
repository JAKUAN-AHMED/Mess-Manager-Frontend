const AdvancePayment = require('../models/AdvancePayment');
const { requireMessId, userBelongsToMess, getMessUserIds } = require('../utils/messTenant');

// GET /api/advance-payments?month=M&year=Y
exports.getAdvancePayments = async (req, res) => {
  try {
    const messId = requireMessId(req);
    if (!messId)
      return res.status(403).json({ success: false, error: 'মেস সংযুক্ত নয়' });

    const messUserIds = await getMessUserIds(messId);
    const filter = { user: { $in: messUserIds } };
    const { month, year } = req.query;
    if (month) filter.month = parseInt(month);
    if (year)  filter.year  = parseInt(year);

    const advances = await AdvancePayment.find(filter)
      .populate('user', 'name phone roomNumber')
      .populate('recordedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: advances });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/advance-payments
exports.addAdvancePayment = async (req, res) => {
  try {
    const messId = requireMessId(req);
    if (!messId)
      return res.status(403).json({ success: false, error: 'মেস সংযুক্ত নয়' });

    const { userId, month, year, amount, note } = req.body;
    if (!userId || !month || !year || amount === undefined || amount <= 0) {
      return res.status(400).json({ success: false, error: 'সব তথ্য সঠিকভাবে দিন' });
    }
    if (!(await userBelongsToMess(messId, userId))) {
      return res.status(403).json({ success: false, error: 'এই সদস্যকে আপনার মেসে পাওয়া যায়নি' });
    }

    const advance = await AdvancePayment.create({
      user: userId,
      month: parseInt(month),
      year: parseInt(year),
      amount: parseFloat(amount),
      note: note?.trim() || '',
      recordedBy: req.user._id,
    });

    await advance.populate('user', 'name phone roomNumber');
    await advance.populate('recordedBy', 'name');

    res.status(201).json({ success: true, data: advance });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/advance-payments/:id
exports.deleteAdvancePayment = async (req, res) => {
  try {
    const messId = requireMessId(req);
    if (!messId)
      return res.status(403).json({ success: false, error: 'মেস সংযুক্ত নয়' });

    const advance = await AdvancePayment.findById(req.params.id);
    if (!advance) return res.status(404).json({ success: false, error: 'পাওয়া যায়নি' });
    if (!(await userBelongsToMess(messId, advance.user))) {
      return res.status(403).json({ success: false, error: 'অনুমতি নেই' });
    }
    await AdvancePayment.deleteOne({ _id: advance._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
