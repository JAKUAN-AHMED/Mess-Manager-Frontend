const User = require('../models/User');
const Payment = require('../models/Payment');
const { getMonthlySummary, getUserMonthlyBill, getYearlyMealTrend, getExpenseContributions, getUserAdvanceTotal } = require('../services/reportService');

// Helper: repair null-mess users and return mess user IDs
const getMessUserIds = async (messId) => {
  if (messId) {
    await User.updateMany(
      { $or: [{ mess: { $exists: false } }, { mess: null }] },
      { $set: { mess: messId } }
    );
  }
  return User.find({ mess: messId, isActive: true }).distinct('_id');
};

// GET /api/reports/monthly-summary?month=M&year=Y
exports.getMonthlySummary = async (req, res) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const userIds = await getMessUserIds(req.user.mess);
    const summary = await getMonthlySummary(startDate, endDate, userIds);
    res.json({ success: true, data: { ...summary, month, year } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/reports/user-bill/:userId?month=M&year=Y
exports.getUserBill = async (req, res) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const userIds = await getMessUserIds(req.user.mess);
    const { mealRate } = await getMonthlySummary(startDate, endDate, userIds);
    const [bill, contribs, payment, user] = await Promise.all([
      getUserMonthlyBill(req.params.userId, startDate, endDate, mealRate),
      getExpenseContributions(startDate, endDate, userIds),
      Payment.findOne({ user: req.params.userId, month, year }),
      User.findById(req.params.userId).select('name phone roomNumber'),
    ]);

    const expensePaid = contribs[req.params.userId] || 0;
    const advanceFromBilling = payment?.advanceAmount || 0;
    const advanceFromPage = await getUserAdvanceTotal(req.params.userId, month, year);
    const advance = parseFloat((advanceFromBilling + advanceFromPage).toFixed(2));
    const netBalance = parseFloat((expensePaid + advance - bill.foodCost).toFixed(2));

    res.json({
      success: true,
      data: { user, ...bill, payment, month, year, expensePaid, advance, netBalance },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/reports/all-bills?month=M&year=Y
exports.getAllBills = async (req, res) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const messId = req.user.mess;
    const userIds = await getMessUserIds(messId);

    const [{ totalCost, totalMealsCount, mealRate }, expenseContributions, users] = await Promise.all([
      getMonthlySummary(startDate, endDate, userIds),
      getExpenseContributions(startDate, endDate, userIds),
      User.find({ isActive: true, mess: messId }).select('name phone roomNumber'),
    ]);

    const bills = await Promise.all(
      users.map(async (user) => {
        const bill = await getUserMonthlyBill(user._id, startDate, endDate, mealRate);
        const payment = await Payment.findOne({ user: user._id, month, year });
        const expensePaid = expenseContributions[user._id.toString()] || 0;
        const advanceFromBilling = payment?.advanceAmount || 0;
        const advanceFromPage = await getUserAdvanceTotal(user._id, month, year);
        const advance = parseFloat((advanceFromBilling + advanceFromPage).toFixed(2));
        // netBalance: positive = mess owes member, negative = member owes mess
        const netBalance = parseFloat((expensePaid + advance - bill.foodCost).toFixed(2));
        return { user, ...bill, payment, expensePaid, advance, netBalance };
      })
    );

    res.json({
      success: true,
      data: { summary: { totalCost, totalMealsCount, mealRate, month, year }, bills },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/reports/yearly-trend
exports.getYearlyTrend = async (req, res) => {
  try {
    const userIds = await getMessUserIds(req.user.mess);
    const trend = await getYearlyMealTrend(userIds);
    res.json({ success: true, data: trend });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
