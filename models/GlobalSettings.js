const mongoose = require("mongoose");

const globalSettingsSchema = new mongoose.Schema(
  {
    settingKey: {
      type: String,
      required: true,
      unique: true,
    },
    settingValue: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
    },
    category: {
      type: String,
      enum: ["shipping", "payment", "general", "api", "rates"],
      default: "general",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
globalSettingsSchema.index({ settingKey: 1, isActive: 1 });
globalSettingsSchema.index({ category: 1 });

// Static method to get setting value
globalSettingsSchema.statics.getSetting = async function(key, defaultValue = null) {
  const setting = await this.findOne({ settingKey: key, isActive: true });
  return setting ? setting.settingValue : defaultValue;
};

// Static method to set setting value
globalSettingsSchema.statics.setSetting = async function(key, value, updatedBy = null, description = null) {
  return await this.findOneAndUpdate(
    { settingKey: key },
    {
      settingKey: key,
      settingValue: value,
      description: description,
      updatedBy: updatedBy,
      isActive: true,
    },
    {
      upsert: true,
      new: true,
    }
  );
};

module.exports = mongoose.model("GlobalSettings", globalSettingsSchema);
