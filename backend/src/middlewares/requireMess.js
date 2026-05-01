const { requireMessId } = require('../utils/messTenant');

/**
 * Every authenticated user of this app must belong to exactly one mess.
 * Blocks legacy/orphan accounts from touching another mess's data.
 */
module.exports = (req, res, next) => {
  if (!requireMessId(req)) {
    return res.status(403).json({
      success: false,
      error: 'আপনার অ্যাকাউন্ট কোনো মেসের সাথে সংযুক্ত নয়। ম্যানেজার হিসেবে নতুন মেস খুলুন বা সদস্য হিসেবে জয়েন কোড দিয়ে যোগ দিন।',
    });
  }
  next();
};
