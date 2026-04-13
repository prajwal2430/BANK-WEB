const express = require('express');
const Account = require('../models/Account');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const RATE_MAP = { Savings: 3.5, Checking: 0, 'Fixed Deposit': 5.8, Investment: 6.8 };

// GET /api/accounts — list user's accounts
router.get('/', async (req, res) => {
  try {
    const accounts = await Account.find({ user: req.user._id }).sort({ createdAt: 1 });
    res.json({ success: true, accounts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/accounts — open new account
router.post('/', async (req, res) => {
  try {
    const { type } = req.body;
    if (!type) return res.status(400).json({ success: false, message: 'Account type required' });
    const account = await Account.create({
      user: req.user._id,
      type,
      balance: 0,
      interestRate: RATE_MAP[type] || 0,
    });
    res.status(201).json({ success: true, account });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/accounts/deposit
router.post('/deposit', async (req, res) => {
  try {
    const { accountId, amount, note } = req.body;
    const amt = parseFloat(amount);
    if (!accountId || !amt || amt <= 0)
      return res.status(400).json({ success: false, message: 'Invalid account or amount' });

    const account = await Account.findOne({ _id: accountId, user: req.user._id });
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

    account.balance = +(account.balance + amt).toFixed(2);
    await account.save();

    const txn = await Transaction.create({
      user: req.user._id,
      account: accountId,
      desc: note || 'Cash Deposit',
      type: 'credit',
      amount: amt,
      category: 'Deposit',
      status: 'Completed',
      balanceAfter: account.balance,
    });

    res.json({ success: true, account, transaction: txn });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/accounts/withdraw
router.post('/withdraw', async (req, res) => {
  try {
    const { accountId, amount, note } = req.body;
    const amt = parseFloat(amount);
    if (!accountId || !amt || amt <= 0)
      return res.status(400).json({ success: false, message: 'Invalid account or amount' });

    const account = await Account.findOne({ _id: accountId, user: req.user._id });
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    if (account.balance < amt)
      return res.status(400).json({ success: false, message: 'Insufficient balance' });

    account.balance = +(account.balance - amt).toFixed(2);
    await account.save();

    const txn = await Transaction.create({
      user: req.user._id,
      account: accountId,
      desc: note || 'Cash Withdrawal',
      type: 'debit',
      amount: amt,
      category: 'Withdrawal',
      status: 'Completed',
      balanceAfter: account.balance,
    });

    res.json({ success: true, account, transaction: txn });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/accounts/transfer — transfer between OWN accounts
router.post('/transfer', async (req, res) => {
  try {
    const { fromId, toId, amount, note } = req.body;
    const amt = parseFloat(amount);
    if (!fromId || !toId || !amt || amt <= 0)
      return res.status(400).json({ success: false, message: 'Invalid transfer details' });
    if (fromId === toId)
      return res.status(400).json({ success: false, message: 'Cannot transfer to same account' });

    const from = await Account.findOne({ _id: fromId, user: req.user._id });
    const to   = await Account.findOne({ _id: toId,   user: req.user._id });
    if (!from || !to) return res.status(404).json({ success: false, message: 'Account not found' });
    if (from.balance < amt)
      return res.status(400).json({ success: false, message: 'Insufficient balance' });

    from.balance = +(from.balance - amt).toFixed(2);
    to.balance   = +(to.balance   + amt).toFixed(2);
    await from.save();
    await to.save();

    const desc = note || 'Fund Transfer';
    const [t1, t2] = await Promise.all([
      Transaction.create({ user: req.user._id, account: fromId, desc: `${desc} → ${to.type}`, type: 'debit',  amount: amt, category: 'Transfer', status: 'Completed', balanceAfter: from.balance }),
      Transaction.create({ user: req.user._id, account: toId,   desc: `${desc} ← ${from.type}`, type: 'credit', amount: amt, category: 'Transfer', status: 'Completed', balanceAfter: to.balance }),
    ]);

    res.json({ success: true, from, to, transactions: [t1, t2] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── NEW: GET /api/accounts/lookup?phone=9876543210
// Look up another user by mobile number (for UPI-style send money)
router.get('/lookup', async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone || phone.trim().length < 10)
      return res.status(400).json({ success: false, message: 'Enter a valid 10-digit mobile number' });

    const recipient = await User.findOne({ phone: phone.trim() }).select('name avatar phone kycStatus');
    if (!recipient)
      return res.status(404).json({ success: false, message: `No NexaBank account found for ${phone}` });

    if (recipient._id.toString() === req.user._id.toString())
      return res.status(400).json({ success: false, message: 'You cannot send money to your own mobile number' });

    // Find their primary (first savings/checking) account
    const recipientAccount = await Account.findOne({ user: recipient._id, status: 'Active' }).sort({ createdAt: 1 });
    if (!recipientAccount)
      return res.status(404).json({ success: false, message: 'Recipient has no active account' });

    res.json({
      success: true,
      recipient: {
        id:        recipient._id,
        name:      recipient.name,
        avatar:    recipient.avatar,
        phone:     recipient.phone,
        kycStatus: recipient.kycStatus,
        accountId: recipientAccount._id,
        accountType: recipientAccount.type,
        accountNum:  recipientAccount.number,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── NEW: POST /api/accounts/send
// Send money to another NexaBank user
router.post('/send', async (req, res) => {
  try {
    const { fromId, recipientAccountId, amount, note, recipientName } = req.body;
    const amt = parseFloat(amount);

    if (!fromId || !recipientAccountId || !amt || amt <= 0)
      return res.status(400).json({ success: false, message: 'Invalid send details' });

    // Sender account (must belong to the logged-in user)
    const from = await Account.findOne({ _id: fromId, user: req.user._id });
    if (!from) return res.status(404).json({ success: false, message: 'Your account not found' });
    if (from.balance < amt)
      return res.status(400).json({ success: false, message: `Insufficient balance. Available: ₹${from.balance.toLocaleString('en-IN')}` });

    // Recipient account (must belong to a DIFFERENT user)
    const to = await Account.findOne({ _id: recipientAccountId });
    if (!to) return res.status(404).json({ success: false, message: 'Recipient account not found' });
    if (to.user.toString() === req.user._id.toString())
      return res.status(400).json({ success: false, message: 'Use self-transfer for your own accounts' });

    // Debit sender
    from.balance = +(from.balance - amt).toFixed(2);
    await from.save();

    // Credit recipient
    to.balance = +(to.balance + amt).toFixed(2);
    await to.save();

    const desc = note || `Sent to ${recipientName || 'NexaBank User'}`;

    // Create transactions for both sides
    const [senderTxn, recipientTxn] = await Promise.all([
      Transaction.create({
        user: req.user._id,
        account: fromId,
        desc: `${desc} → ${to.number}`,
        type: 'debit',
        amount: amt,
        category: 'Transfer',
        status: 'Completed',
        balanceAfter: from.balance,
      }),
      Transaction.create({
        user: to.user,
        account: recipientAccountId,
        desc: `Received from ${req.user.name} (${from.number})`,
        type: 'credit',
        amount: amt,
        category: 'Transfer',
        status: 'Completed',
        balanceAfter: to.balance,
      }),
    ]);

    res.json({
      success: true,
      message: `₹${amt.toLocaleString('en-IN')} sent to ${recipientName || 'recipient'}`,
      from,
      transaction: senderTxn,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
