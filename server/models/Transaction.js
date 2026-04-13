const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  account:  { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  desc:     { type: String, required: true },
  type:     { type: String, enum: ['credit', 'debit'], required: true },
  amount:   { type: Number, required: true, min: 0.01 },
  category: { type: String, default: 'Other' },
  status:   { type: String, enum: ['Completed', 'Pending', 'Failed'], default: 'Completed' },
  balanceAfter: { type: Number },  // snapshot of account balance after txn
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);
