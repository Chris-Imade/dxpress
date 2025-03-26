const mongoose = require("mongoose");

const newsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  subscriptionDate: {
    type: Date,
    default: Date.now,
  },
  isConfirmed: {
    type: Boolean,
    default: false,
  },
  confirmationToken: {
    type: String,
    default: null,
  },
  confirmationExpires: {
    type: Date,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("Newsletter", newsletterSchema);
