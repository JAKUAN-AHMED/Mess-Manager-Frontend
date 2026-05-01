const Payment = require('../models/Payment');
const AdvancePayment = require('../models/AdvancePayment');
const { requireMessId, userBelongsToMess, getMessUserIds } = require('../utils/messTenant');

// POST /api/payments
exports.recordPayment = async (req, res) => {
  try {
    const messId = requireMessId(req);
    if (!messId)
      return res.status(403).json({ success: false, error: 'মেস সংযুক্ত নয়' });

    const { userId, month, year, totalBill, paidAmount, isMessOwesMember } = req.body;
    if (!(await userBelongsToMess(messId, userId))) {
      return res.status(403).json({ success: false, error: 'এই সদস্যকে আপনার মেসে পাওয়া যায়নি' });
    }

    let status, advanceAmount;

    if (isMessOwesMember) {
      status = 'পরিশোধিত';
      advanceAmount = 0;

      let remainingToDeduct = paidAmount;
      const userAdvances = await AdvancePayment.find({ user: userId, month, year }).sort({ createdAt: 1 });

      for (const adv of userAdvances) {
        if (remainingToDeduct <= 0) break;

        const deductAmount = Math.min(adv.amount, remainingToDeduct);
        adv.amount -= deductAmount;
        remainingToDeduct -= deductAmount;

        if (adv.amount <= 0) {
          await AdvancePayment.deleteOne({ _id: adv._id });
        } else {
          await adv.save();
        }
      }
    } else {
      status = paidAmount >= totalBill ? 'পরিশোধিত' : 'বাকি';
      advanceAmount = paidAmount > totalBill ? parseFloat((paidAmount - totalBill).toFixed(2)) : 0;
    }

    const payment = await Payment.findOneAndUpdate(
      { user: userId, month, year },
      { totalBill, paidAmount, advanceAmount, status, paymentDate: new Date() },
      { returnDocument: 'after', upsert: true }
    ).populate('user', 'name phone');

    res.status(200).json({ success: true, data: payment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/payments?month=M&year=Y — only payments for users in this mess
exports.getPayments = async (req, res) => {
  try {
    const messId = requireMessId(req);
    if (!messId)
      return res.status(403).json({ success: false, error: 'মেস সংযুক্ত নয়' });

    const messUserIds = await getMessUserIds(messId);
    const filter = { user: { $in: messUserIds } };
    const { month, year } = req.query;
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);

    const payments = await Payment.find(filter).populate('user', 'name phone roomNumber').sort({ createdAt: -1 });
    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
