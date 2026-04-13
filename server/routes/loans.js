const express = require('express');
const Loan = require('../models/Loan');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/loans
router.get('/', async (req, res) => {
  try {
    const loans = await Loan.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, loans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/loans — apply for loan
router.post('/', async (req, res) => {
  try {
    const { type, amount, term, rate } = req.body;
    if (!type || !amount || !term || !rate)
      return res.status(400).json({ success: false, message: 'All loan fields are required' });

    const loan = await Loan.create({
      user: req.user._id,
      type, amount: parseFloat(amount),
      term: parseInt(term),
      rate: parseFloat(rate),
    });
    res.status(201).json({ success: true, loan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/loans/:id/close
router.put('/:id/close', async (req, res) => {
  try {
    const loan = await Loan.findOne({ _id: req.params.id, user: req.user._id });
    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });
    loan.status = 'Closed';
    loan.outstanding = 0;
    loan.nextDue = null;
    await loan.save();
    res.json({ success: true, loan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
