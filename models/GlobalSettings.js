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
globalSettingsSchema.statics.getSetting = async function (
  key,
  defaultValue = null
) {
  const setting = await this.findOne({ settingKey: key, isActive: true });
  return setting ? setting.settingValue : defaultValue;
};

// Static method to set setting value
// globalSettingsSchema.statics.setSettings = async function(key, value, updatedBy = null, description = null) {
//   return await this.findOneAndUpdate(
//     { settingKey: key },
//     {
//       settingKey: key,
//       settingValue: value,
//       description: description,
//       updatedBy: updatedBy,
//       isActive: true,
//     },
//     {
//       upsert: true,
//       new: true,
//     }
//   );
// };
// Static method to get all active settings
globalSettingsSchema.statics.getSettings = async function () {
  const settings = await this.find({ isActive: true });

  // Return as a key-value object
  return settings.reduce((acc, setting) => {
    acc[setting.settingKey] = setting.settingValue;
    return acc;
  }, {});
};
// Bulk update multiple settings at once
globalSettingsSchema.statics.setSettings = async function(settingsObj, updatedBy = null) {
  const updates = [];

  for (const [key, value] of Object.entries(settingsObj)) {
    updates.push(
      this.findOneAndUpdate(
        { settingKey: key },
        {
          settingKey: key,
          settingValue: value,
          updatedBy,
          isActive: true,
        },
        { upsert: true, new: true }
      )
    );
  }

  return Promise.all(updates);
};


module.exports = mongoose.model("GlobalSettings", globalSettingsSchema);
