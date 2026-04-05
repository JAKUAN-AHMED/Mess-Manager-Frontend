const Payment = require('../models/Payment');

// POST /api/payments
exports.recordPayment = async (req, res) => {
  try {
    const { userId, month, year, totalBill, paidAmount } = req.body;
    const status = paidAmount >= totalBill ? 'পরিশোধিত' : 'বাকি';
    const advanceAmount = paidAmount > totalBill ? parseFloat((paidAmount - totalBill).toFixed(2)) : 0;

    const payment = await Payment.findOneAndUpdate(
      { user: userId, month, year },
      { totalBill, paidAmount, advanceAmount, status, paymentDate: new Date() },
      { new: true, upsert: true }
    ).populate('user', 'name phone');

    res.status(200).json({ success: true, data: payment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/payments?month=M&year=Y
exports.getPayments = async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = {};
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    const payments = await Payment.find(filter).populate('user', 'name phone roomNumber').sort({ createdAt: -1 });
    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
