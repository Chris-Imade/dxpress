const User = require("../models/User");

exports.getShippingRates = async (req, res) => {
  try {
    // In a real application, you might have multiple admin users,
    // so you'd need a way to identify which admin's rates to use.
    // For this example, we'll just find the first admin user.
    const admin = await User.findOne({ role: "admin" });

    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin user not found" });
    }

    res.json({ success: true, rates: admin.shippingRates });
  } catch (error) {
    console.error("Get shipping rates error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
