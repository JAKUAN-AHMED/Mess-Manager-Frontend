const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { requireMessId } = require('../utils/messTenant');

function generateMemberCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars (0/O, 1/I/L)
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function uniqueMemberCode() {
  let code, exists = true;
  while (exists) {
    code = generateMemberCode();
    exists = await User.findOne({ memberCode: code });
  }
  return code;
}

// GET /api/users?archived=1
exports.getUsers = async (req, res) => {
  try {
    const messId = requireMessId(req);
    if (!messId)
      return res.status(403).json({ success: false, error: 'মেস সংযুক্ত নয়' });

    const archivedParam = String(req.query.archived ?? '0').toLowerCase();
    const filter = { mess: messId };
    if (archivedParam === '1' || archivedParam === 'true') {
      filter.isArchived = true;
    } else if (archivedParam !== 'all') {
      filter.isArchived = { $ne: true };
    }

    const users = await User.find(filter).select('-password').sort({ name: 1 });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/users
exports.createUser = async (req, res) => {
  try {
    const messId = requireMessId(req);
    if (!messId)
      return res.status(403).json({ success: false, error: 'মেস সংযুক্ত নয়' });

    const { name, phone, email, password, role, roomNumber, canInputMeals } = req.body;
    const exists = await User.findOne({ phone });
    if (exists)
      return res.status(400).json({ success: false, error: 'এই ফোন নম্বরে অ্যাকাউন্ট আছে' });

    const memberCode = role === 'member' ? await uniqueMemberCode() : undefined;
    const user = await User.create({
      name,
      phone,
      email: email?.trim() || '',
      password: password || '1234',
      role,
      roomNumber,
      canInputMeals,
      memberCode,
      mess: messId,
    });
    const { password: _, ...userObj } = user.toObject();
    res.status(201).json({ success: true, data: userObj });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/users/:id — only users in the same mess
exports.updateUser = async (req, res) => {
  try {
    const messId = requireMessId(req);
    if (!messId)
      return res.status(403).json({ success: false, error: 'মেস সংযুক্ত নয়' });

    const { password, mess: _messFromBody, ...updateData } = req.body;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    if (typeof updateData.email === 'string') {
      updateData.email = updateData.email.trim().toLowerCase();
    }

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, mess: messId },
      updateData,
      { returnDocument: 'after', runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, error: 'সদস্য পাওয়া যায়নি' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.regenerateMemberCode = async (req, res) => {
  try {
    const messId = requireMessId(req);
    if (!messId)
      return res.status(403).json({ success: false, error: 'মেস সংযুক্ত নয়' });

    const user = await User.findOne({ _id: req.params.id, mess: messId });
    if (!user) return res.status(404).json({ success: false, error: 'সদস্য পাওয়া যায়নি' });
    const memberCode = await uniqueMemberCode();
    user.memberCode = memberCode;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, data: { memberCode } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const messId = requireMessId(req);
    if (!messId)
      return res.status(403).json({ success: false, error: 'মেস সংযুক্ত নয়' });

    const target = await User.findOne({ _id: req.params.id, mess: messId });
    if (!target) return res.status(404).json({ success: false, error: 'সদস্য পাওয়া যায়নি' });

    if (target.role === 'admin') {
      const adminCount = await User.countDocuments({
        role: 'admin',
        isArchived: { $ne: true },
        mess: messId,
      });
      if (adminCount <= 1)
        return res.status(400).json({ success: false, error: 'একমাত্র অ্যাডমিনকে মুছে ফেলা যাবে না' });
    }

    target.isArchived = true;
    target.isActive = false;
    target.archivedAt = new Date();
    await target.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'সদস্য আর্কাইভ করা হয়েছে। তার পুরোনো তথ্য সংরক্ষিত আছে।',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.restoreUser = async (req, res) => {
  try {
    const messId = requireMessId(req);
    if (!messId)
      return res.status(403).json({ success: false, error: 'মেস সংযুক্ত নয়' });

    const user = await User.findOne({ _id: req.params.id, mess: messId });
    if (!user) return res.status(404).json({ success: false, error: 'সদস্য পাওয়া যায়নি' });
    user.isArchived = false;
    user.isActive = true;
    user.archivedAt = null;
    await user.save({ validateBeforeSave: false });
    const { password: _, ...obj } = user.toObject();
    res.json({ success: true, data: obj, message: 'সদস্য পুনরুদ্ধার হয়েছে' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
