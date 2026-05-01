const User = require('../models/User');

/** Current user's mess ObjectId — required for all tenant-scoped APIs. */
function requireMessId(req) {
  const id = req.user?.mess;
  if (!id)
    return null;
  return id;
}

async function userBelongsToMess(messId, userId) {
  if (!messId || !userId) return false;
  const doc = await User.findOne({ _id: userId, mess: messId }).select('_id').lean();
  return !!doc;
}

async function getMessUserIds(messId) {
  if (!messId) return [];
  return User.find({ mess: messId }).distinct('_id');
}

module.exports = { requireMessId, userBelongsToMess, getMessUserIds };
