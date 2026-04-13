const express = require('express');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/transactions?page=1&limit=20&type=&category=&accountId=&search=
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, type, category, accountId, search } = req.query;
    const filter = { user: req.user._id };
    if (type && type !== 'all') filter.type = type;
    if (category && category !== 'All') filter.category = category;
    if (accountId && accountId !== 'all') filter.account = accountId;
    if (search) filter.desc = { $regex: search, $options: 'i' };

    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .populate('account', 'type number');

    res.json({ success: true, total, page: +page, transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/transactions/stats  — aggregate KPIs for dashboard/reports
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Current month
    const curMonthAgg = await Transaction.aggregate([
      { $match: { user: req.user._id, createdAt: { $gte: startOfMonth }, status: 'Completed' } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);
    // Prev month
    const prevMonthAgg = await Transaction.aggregate([
      { $match: { user: req.user._id, createdAt: { $gte: startOfPrevMonth, $lte: endOfPrevMonth }, status: 'Completed' } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]);

    // Monthly data last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0,0,0,0);
    const monthlyAgg = await Transaction.aggregate([
      { $match: { user: req.user._id, createdAt: { $gte: sixMonthsAgo }, status: 'Completed' } },
      { $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, type: '$type' },
          total: { $sum: '$amount' },
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Spending by category (current month, debit)
    const spendCatAgg = await Transaction.aggregate([
      { $match: { user: req.user._id, type: 'debit', createdAt: { $gte: startOfMonth }, status: 'Completed' } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]);

    const toMap = (arr) => arr.reduce((m, item) => { m[item._id] = item.total; return m; }, {});
    const curMap  = toMap(curMonthAgg);
    const prevMap = toMap(prevMonthAgg);

    res.json({
      success: true,
      currentMonth: {
        credit: curMap.credit || 0,
        debit:  curMap.debit  || 0,
        txnCount: (curMonthAgg.find(x=>x._id==='credit')?.count||0) + (curMonthAgg.find(x=>x._id==='debit')?.count||0),
      },
      prevMonth: {
        credit: prevMap.credit || 0,
        debit:  prevMap.debit  || 0,
      },
      monthlyData: monthlyAgg,
      spendByCategory: spendCatAgg.map(c => ({ name: c._id || 'Other', value: +c.total.toFixed(2) })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
