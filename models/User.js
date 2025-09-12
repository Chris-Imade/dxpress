const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    required: false,
  },
  role: {
    type: String,
    enum: ["admin", "staff", "user"],
    default: "user",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  resetToken: {
    type: String,
    default: null,
  },
  resetTokenExpiry: {
    type: Date,
    default: null,
  },
  shippingRates: {
    dhl: {
      baseRate: { type: Number, default: 45.99 },
      additionalFees: { type: Number, default: 5.0 },
    },
    fedex: {
      baseRate: { type: Number, default: 35.5 },
      additionalFees: { type: Number, default: 3.5 },
    },
    ups: {
      baseRate: { type: Number, default: 40.75 },
      additionalFees: { type: Number, default: 4.25 },
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // User preferences and settings
  preferences: {
    notifications: {
      sound: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
    },
    theme: { type: String, default: 'light' },
    language: { type: String, default: 'en' },
  },
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
