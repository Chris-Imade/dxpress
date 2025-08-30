const mongoose = require("mongoose");
const Shipment = require("./models/Shipment");
const User = require("./models/User");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const adminUser = {
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD,
  fullName: "Admin User",
  role: "admin",
};

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/dxpress")
  .then(() => {
    console.log("MongoDB connected for seeding...");
    return seedDatabase();
  })
  .then(() => {
    console.log("Seeding completed!");
    mongoose.connection.close();
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seeding error:", err);
    mongoose.connection.close();
    process.exit(1);
  });

// Sample shipment data
const shipments = [
  {
    trackingId: "DX123456ABC",
    customerName: "John Smith",
    customerEmail: "john.smith@example.com",
    customerPhone: "+44 123 456 7890",
    origin: {
      address: "123 Main St",
      city: "London",
      postalCode: "SW1A 0AA",
      country: "UK",
    },
    destination: {
      address: "456 High St",
      city: "Paris",
      postalCode: "75001",
      country: "France",
    },
    packageType: "medium_box",
    weight: 5.2,
    dimensions: {
      length: 30,
      width: 25,
      height: 20,
    },
    fragile: true,
    insuranceRequired: true,
    declaredValue: 500,
    carrier: "DHL",
    service: "Express",
    price: 50.0,
    estimatedDelivery: new Date("2023-08-15"),
    status: "delivered",
    paymentStatus: "paid",
    paymentProvider: "stripe",
    paymentIntentId: "pi_123456789",
    paymentCompletedAt: new Date("2023-08-10"),
    trackingHistory: [
      {
        status: "pending",
        location: "London Distribution Center",
        timestamp: new Date("2023-08-10T09:00:00"),
        description: "Shipment created and ready for processing",
      },
      {
        status: "in_transit",
        location: "London International Airport",
        timestamp: new Date("2023-08-11T14:30:00"),
        description: "Shipment departed from origin facility",
      },
      {
        status: "in_transit",
        location: "Paris Charles de Gaulle Airport",
        timestamp: new Date("2023-08-12T08:45:00"),
        description: "Shipment arrived at destination airport",
      },
      {
        status: "in_transit",
        location: "Paris Local Distribution Center",
        timestamp: new Date("2023-08-13T11:20:00"),
        description: "Shipment is out for delivery",
      },
      {
        status: "delivered",
        location: "Paris, France",
        timestamp: new Date("2023-08-14T16:05:00"),
        description: "Shipment delivered successfully. Signed by: Marie Laurent",
      },
    ],
  },
  {
    trackingId: "DX789012XYZ",
    customerName: "Emma Wilson",
    customerEmail: "emma.wilson@example.com",
    customerPhone: "+44 987 654 3210",
    origin: {
      address: "456 Park Ave",
      city: "Manchester",
      postalCode: "M1 1AA",
      country: "UK",
    },
    destination: {
      address: "789 Kurfürstendamm",
      city: "Berlin",
      postalCode: "10719",
      country: "Germany",
    },
    packageType: "large_box",
    weight: 12.8,
    dimensions: {
      length: 50,
      width: 40,
      height: 30,
    },
    fragile: false,
    insuranceRequired: true,
    declaredValue: 1000,
    carrier: "FedEx",
    service: "Standard",
    price: 75.0,
    estimatedDelivery: new Date("2023-09-12"),
    status: "in_transit",
    paymentStatus: "paid",
    paymentProvider: "paypal",
    paymentIntentId: "pi_987654321",
    paymentCompletedAt: new Date("2023-09-05"),
    trackingHistory: [
      {
        status: "pending",
        location: "Manchester Regional Center",
        timestamp: new Date("2023-09-05T10:15:00"),
        description: "Shipment created and ready for processing",
      },
      {
        status: "in_transit",
        location: "Manchester International Airport",
        timestamp: new Date("2023-09-06T13:40:00"),
        description: "Shipment departed from origin facility",
      },
      {
        status: "in_transit",
        location: "Amsterdam Schiphol Airport (Transfer)",
        timestamp: new Date("2023-09-07T07:30:00"),
        description: "Shipment at transfer location",
      },
      {
        status: "in_transit",
        location: "Berlin Brandenburg Airport",
        timestamp: new Date("2023-09-08T11:45:00"),
        description: "Shipment arrived at destination airport",
      },
    ],
  },
];

// Function to seed the database
const seedDatabase = async () => {
  try {
    // Clear existing data
    await Shipment.deleteMany({});
    console.log("Previous shipment data cleared");

    // Insert new data
    const seededShipments = await Shipment.insertMany(shipments);
    console.log(`Successfully seeded ${seededShipments.length} shipments`);

    // Seed admin user after shipments have been created
    await seedAdminUser();

    return true;
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
};

async function seedAdminUser() {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);

    const adminDetails = {
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      fullName: "Admin User",
      role: "admin",
    };

    const updatedAdmin = await User.findOneAndUpdate(
      { email: adminDetails.email, role: "admin" },
      adminDetails,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log("Admin user created or updated successfully");
    console.log("Email:", updatedAdmin.email);
    console.log("Please change this password after first login if it's the default.");
  } catch (error) {
    console.error("Error creating or updating admin user:", error);
    throw error;
  }
}
