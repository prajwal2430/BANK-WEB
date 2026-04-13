const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:     { type: String, required: true },
  address:   { type: String, default: '' },
  password:  { type: String, required: true, minlength: 8 },
  kycStatus: { type: String, enum: ['Pending', 'Verified'], default: 'Verified' },
  avatar:    { type: String, default: '' },
}, { timestamps: true });

/**
 * Mongoose v8 — async pre-save hooks must NOT use next().
 * Just return the async promise; Mongoose handles it automatically.
 */
UserSchema.pre('save', async function () {
  // Hash password only if it was changed
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  // Auto-generate avatar initials from name
  if (!this.avatar && this.name) {
    this.avatar = this.name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
});

// Compare entered password with hashed password
UserSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', UserSchema);
