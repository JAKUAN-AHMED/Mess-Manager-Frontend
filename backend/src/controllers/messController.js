const crypto = require('crypto');
const Mess = require('../models/Mess');
const { requireMessId } = require('../utils/messTenant');

// GET /api/mess — current user's mess only (never another mess)
exports.getMess = async (req, res) => {
  try {
    const messId = requireMessId(req);
    if (!messId)
      return res.status(403).json({ success: false, error: 'মেস সংযুক্ত নয়' });

    const mess = await Mess.findById(messId).populate('admin', 'name phone');
    if (!mess) return res.status(404).json({ success: false, error: 'মেস পাওয়া যায়নি' });
    res.json({ success: true, data: mess });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/mess — update name for this mess only
exports.updateMess = async (req, res) => {
  try {
    const messId = requireMessId(req);
    if (!messId)
      return res.status(403).json({ success: false, error: 'মেস সংযুক্ত নয়' });

    const { name } = req.body;
    const mess = await Mess.findOneAndUpdate({ _id: messId }, { name }, { returnDocument: 'after' });
    if (!mess) return res.status(404).json({ success: false, error: 'মেস পাওয়া যায়নি' });
    res.json({ success: true, data: mess });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/mess/regenerate-code — only this mess's join code
exports.regenerateCode = async (req, res) => {
  try {
    const messId = requireMessId(req);
    if (!messId)
      return res.status(403).json({ success: false, error: 'মেস সংযুক্ত নয়' });

    const newCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    const mess = await Mess.findOneAndUpdate({ _id: messId }, { joinCode: newCode }, { returnDocument: 'after' });
    if (!mess) return res.status(404).json({ success: false, error: 'মেস পাওয়া যায়নি' });
    res.json({ success: true, data: { joinCode: mess.joinCode } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
