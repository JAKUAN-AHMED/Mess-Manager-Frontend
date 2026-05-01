const Meal = require('../models/Meal');
const User = require('../models/User');
const { requireMessId, userBelongsToMess, getMessUserIds } = require('../utils/messTenant');

// POST /api/meals — add or update a daily meal entry (user must belong to caller's mess)
exports.addOrUpdateMeal = async (req, res) => {
  try {
    const messId = requireMessId(req);
    if (!messId)
      return res.status(403).json({ success: false, error: 'মেস সংযুক্ত নয়' });

    const { userId, date, breakfast, lunch, dinner } = req.body;
    if (!(await userBelongsToMess(messId, userId))) {
      return res.status(403).json({ success: false, error: 'এই সদস্যকে আপনার মেসে পাওয়া যায়নি' });
    }

    const totalMeals = (breakfast || 0) + (lunch || 0) + (dinner || 0);
    const [y, m, d] = String(date).slice(0, 10).split('-').map(Number);
    const mealDate = new Date(Date.UTC(y, m - 1, d));

    const meal = await Meal.findOneAndUpdate(
      { user: userId, date: mealDate },
      { breakfast: breakfast || 0, lunch: lunch || 0, dinner: dinner || 0, totalMeals },
      { returnDocument: 'after', upsert: true, runValidators: true }
    ).populate('user', 'name phone');

    res.status(200).json({ success: true, data: meal, message: 'মিল সফলভাবে সেভ হয়েছে' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/meals?month=M&year=Y&userId=id
exports.getMeals = async (req, res) => {
  try {
    const messId = requireMessId(req);
    if (!messId)
      return res.status(403).json({ success: false, error: 'মেস সংযুক্ত নয়' });

    const { month, year, userId } = req.query;
    const filter = {};

    if (month && year) {
      const start = new Date(Date.UTC(year, month - 1, 1));
      const end   = new Date(Date.UTC(year, month,     0, 23, 59, 59));
      filter.date = { $gte: start, $lte: end };
    }

    if (userId) {
      if (!(await userBelongsToMess(messId, userId))) {
        return res.status(403).json({ success: false, error: 'এই সদস্যকে আপনার মেসে পাওয়া যায়নি' });
      }
      filter.user = userId;
    } else {
      const messUserIds = await getMessUserIds(messId);
      filter.user = { $in: messUserIds };
    }

    const meals = await Meal.find(filter)
      .populate('user', 'name phone roomNumber')
      .sort({ date: -1 });

    res.json({ success: true, data: meals });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/meals/:id
exports.deleteMeal = async (req, res) => {
  try {
    const messId = requireMessId(req);
    if (!messId)
      return res.status(403).json({ success: false, error: 'মেস সংযুক্ত নয়' });

    const meal = await Meal.findById(req.params.id);
    if (!meal) return res.status(404).json({ success: false, error: 'মিল পাওয়া যায়নি' });
    if (!(await userBelongsToMess(messId, meal.user))) {
      return res.status(403).json({ success: false, error: 'অনুমতি নেই' });
    }
    await Meal.deleteOne({ _id: meal._id });
    res.json({ success: true, message: 'মিল মুছে ফেলা হয়েছে' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
