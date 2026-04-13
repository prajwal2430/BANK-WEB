const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:        { type: String, required: true },
  amount:      { type: Number, required: true, min: 1000 },
  outstanding: { type: Number },
  emi:         { type: Number },
  rate:        { type: Number, required: true },
  term:        { type: Number, required: true },  // months
  nextDue:     { type: Date },
  status:      { type: String, enum: ['Active', 'Closed', 'Pending'], default: 'Active' },
}, { timestamps: true });

// Mongoose v8 — async pre-save without next()
LoanSchema.pre('save', async function () {
  if (this.isNew) {
    this.outstanding = this.amount;

    const r = this.rate / 100 / 12;
    const n = this.term;
    this.emi = r
      ? +(this.amount * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)).toFixed(2)
      : +(this.amount / n).toFixed(2);

    const due = new Date();
    due.setMonth(due.getMonth() + 1);
    this.nextDue = due;
  }
});

module.exports = mongoose.model('Loan', LoanSchema);
