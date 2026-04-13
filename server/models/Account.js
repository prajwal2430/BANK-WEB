const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:         { type: String, enum: ['Savings', 'Checking', 'Fixed Deposit', 'Investment'], required: true },
  number:       { type: String, unique: true },
  balance:      { type: Number, default: 0, min: 0 },
  currency:     { type: String, default: 'INR' },
  status:       { type: String, enum: ['Active', 'Inactive', 'Frozen'], default: 'Active' },
  interestRate: { type: Number, default: 0 },
}, { timestamps: true });

// Mongoose v8 — async pre-save without next()
AccountSchema.pre('save', async function () {
  if (!this.number) {
    const rand = Math.floor(1000 + Math.random() * 9000);
    this.number = `****${rand}`;
  }
});

module.exports = mongoose.model('Account', AccountSchema);
