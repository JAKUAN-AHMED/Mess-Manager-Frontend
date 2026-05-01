/**
 * Multi-tenant isolation smoke test (hits real MongoDB from .env).
 * Run from backend: npm run smoke:tenant
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const request = require('supertest');
const mongoose = require('mongoose');

const User = require('../src/models/User');
const Mess = require('../src/models/Mess');
const Meal = require('../src/models/Meal');
const Payment = require('../src/models/Payment');
const Expense = require('../src/models/Expense');
const AdvancePayment = require('../src/models/AdvancePayment');
const MealAdjustment = require('../src/models/MealAdjustment');
const BillingEmailLog = require('../src/models/BillingEmailLog');
const LedgerContact = require('../src/models/LedgerContact');
const LedgerTransaction = require('../src/models/LedgerTransaction');
const LedgerShare = require('../src/models/LedgerShare');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function cleanupSmoke({ phones, messIds }) {
  const users = await User.find({ phone: { $in: phones } }).select('_id');
  const userIds = users.map((u) => u._id);

  if (messIds.length > 0) {
    await BillingEmailLog.deleteMany({ mess: { $in: messIds } });
  }
  if (userIds.length === 0) {
    if (messIds.length > 0) await Mess.deleteMany({ _id: { $in: messIds } });
    return;
  }

  const contacts = await LedgerContact.find({ owner: { $in: userIds } }).select('_id');
  const contactIds = contacts.map((c) => c._id);
  if (contactIds.length > 0) {
    await LedgerShare.deleteMany({ contact: { $in: contactIds } });
    await LedgerTransaction.deleteMany({ contact: { $in: contactIds } });
    await LedgerContact.deleteMany({ _id: { $in: contactIds } });
  }
  await LedgerShare.deleteMany({
    $or: [{ sharedWith: { $in: userIds } }, { sharedBy: { $in: userIds } }],
  });
  await LedgerTransaction.deleteMany({ owner: { $in: userIds } });
  await LedgerContact.deleteMany({ owner: { $in: userIds } });

  await MealAdjustment.deleteMany({ user: { $in: userIds } });
  await AdvancePayment.deleteMany({ user: { $in: userIds } });
  await Payment.deleteMany({ user: { $in: userIds } });
  await Meal.deleteMany({ user: { $in: userIds } });
  await Expense.deleteMany({
    $or: [{ addedBy: { $in: userIds } }, { paidBy: { $in: userIds } }],
  });

  await User.deleteMany({ _id: { $in: userIds } });
  if (messIds.length > 0) {
    await Mess.deleteMany({ _id: { $in: messIds } });
  }
}

async function main() {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
    console.error('Missing MONGODB_URI or JWT_SECRET in backend/.env');
    process.exit(1);
  }

  const app = require('../server');
  await mongoose.connection.asPromise();

  const ts = Date.now();
  const phoneA = `019999SMOKE${ts}A`;
  const phoneB = `019999SMOKE${ts}B`;
  const phoneMember = `019999SMOKE${ts}M`;
  const messNameA = `SMOKE_MESS_${ts}_A`;
  const messNameB = `SMOKE_MESS_${ts}_B`;

  let messIds = [];

  try {
    const regA = await request(app)
      .post('/api/auth/register-manager')
      .send({
        name: 'Smoke Admin A',
        phone: phoneA,
        password: 'SmokePass1!',
        messName: messNameA,
      })
      .expect(201);

    const tokenA = regA.body.data.user.token;
    const messIdA = String(regA.body.data.user.mess);
    messIds.push(regA.body.data.mess._id || messIdA);

    const regB = await request(app)
      .post('/api/auth/register-manager')
      .send({
        name: 'Smoke Admin B',
        phone: phoneB,
        password: 'SmokePass1!',
        messName: messNameB,
      })
      .expect(201);

    const tokenB = regB.body.data.user.token;
    const messIdB = String(regB.body.data.user.mess);
    messIds.push(regB.body.data.mess._id || messIdB);

    assert(messIdA !== messIdB, 'Expected two distinct mess ids');

    const createMember = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Smoke Member',
        phone: phoneMember,
        password: 'SmokePass1!',
        role: 'member',
      })
      .expect(201);

    const memberId = createMember.body.data._id;
    assert(memberId, 'Expected member id');

    const listB = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    const idsB = (listB.body.data || []).map((u) => String(u._id));
    assert(!idsB.includes(String(memberId)), 'Mess B must not list Mess A member');

    await request(app)
      .get(`/api/reports/user-bill/${memberId}?month=1&year=2025`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(403);

    await request(app)
      .post('/api/meals')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        userId: memberId,
        date: '2025-06-15',
        breakfast: 1,
        lunch: 0,
        dinner: 0,
      })
      .expect(403);

    const mealOk = await request(app)
      .post('/api/meals')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        userId: memberId,
        date: '2025-06-15',
        breakfast: 1,
        lunch: 0,
        dinner: 0,
      })
      .expect(200);

    const mealId = mealOk.body.data._id;
    await request(app)
      .delete(`/api/meals/${mealId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(403);

    await request(app)
      .put(`/api/users/${memberId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: 'Hacked' })
      .expect(404);

    const messDocA = await request(app)
      .get('/api/mess')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    const messDocB = await request(app)
      .get('/api/mess')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    assert(
      String(messDocA.body.data._id) !== String(messDocB.body.data._id),
      'GET /mess must return different mess per tenant'
    );

    const searchB = await request(app)
      .post('/api/ledger/search-users')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ query: phoneMember.slice(-6) })
      .expect(200);

    const searchPhones = (searchB.body.data || []).map((u) => u.phone);
    assert(
      !searchPhones.includes(phoneMember),
      'Ledger user search must not leak other mess phones'
    );

    await request(app)
      .post('/api/reports/cron/send-monthly-bills')
      .expect(401);

    console.log('smoke-multi-tenant: all assertions passed');
  } finally {
    messIds = [...new Set(messIds.map(String))].filter(Boolean).map((id) => new mongoose.Types.ObjectId(id));
    await cleanupSmoke({ phones: [phoneA, phoneB, phoneMember], messIds });
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
