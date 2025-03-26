const mongoose = require("mongoose");
const Shipment = require("./models/Shipment");
const User = require("./models/User");
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
    origin: "London, UK",
    destination: "Paris, France",
    shipmentDate: new Date("2023-08-10"),
    estimatedDelivery: new Date("2023-08-15"),
    status: "Delivered",
    statusHistory: [
      {
        status: "Pending",
        location: "London Distribution Center",
        timestamp: new Date("2023-08-10T09:00:00"),
        note: "Shipment created and ready for processing",
      },
      {
        status: "In Transit",
        location: "London International Airport",
        timestamp: new Date("2023-08-11T14:30:00"),
        note: "Shipment departed from origin facility",
      },
      {
        status: "In Transit",
        location: "Paris Charles de Gaulle Airport",
        timestamp: new Date("2023-08-12T08:45:00"),
        note: "Shipment arrived at destination airport",
      },
      {
        status: "In Transit",
        location: "Paris Local Distribution Center",
        timestamp: new Date("2023-08-13T11:20:00"),
        note: "Shipment is out for delivery",
      },
      {
        status: "Delivered",
        location: "Paris, France",
        timestamp: new Date("2023-08-14T16:05:00"),
        note: "Shipment delivered successfully. Signed by: Marie Laurent",
      },
    ],
    weight: 5.2,
    dimensions: {
      length: 30,
      width: 25,
      height: 20,
    },
    packageType: "Parcel",
    fragile: true,
    insuranceIncluded: true,
    expressDelivery: true,
    additionalNotes: "Handle with care. Contains fragile electronic equipment.",
  },
  {
    trackingId: "DX789012XYZ",
    customerName: "Emma Wilson",
    customerEmail: "emma.wilson@example.com",
    customerPhone: "+44 987 654 3210",
    origin: "Manchester, UK",
    destination: "Berlin, Germany",
    shipmentDate: new Date("2023-09-05"),
    estimatedDelivery: new Date("2023-09-12"),
    status: "In Transit",
    statusHistory: [
      {
        status: "Pending",
        location: "Manchester Regional Center",
        timestamp: new Date("2023-09-05T10:15:00"),
        note: "Shipment created and ready for processing",
      },
      {
        status: "In Transit",
        location: "Manchester International Airport",
        timestamp: new Date("2023-09-06T13:40:00"),
        note: "Shipment departed from origin facility",
      },
      {
        status: "In Transit",
        location: "Amsterdam Schiphol Airport (Transfer)",
        timestamp: new Date("2023-09-07T07:30:00"),
        note: "Shipment at transfer location",
      },
      {
        status: "In Transit",
        location: "Berlin Brandenburg Airport",
        timestamp: new Date("2023-09-08T11:45:00"),
        note: "Shipment arrived at destination airport",
      },
    ],
    weight: 12.8,
    dimensions: {
      length: 50,
      width: 40,
      height: 30,
    },
    packageType: "Freight",
    fragile: false,
    insuranceIncluded: true,
    expressDelivery: false,
    additionalNotes: "Business equipment for trade show.",
  },
  {
    trackingId: "DX345678DEF",
    customerName: "Sarah Johnson",
    customerEmail: "sarah.johnson@example.com",
    customerPhone: "+44 555 123 4567",
    origin: "Birmingham, UK",
    destination: "New York, USA",
    shipmentDate: new Date("2023-08-25"),
    estimatedDelivery: new Date("2023-09-05"),
    status: "Delayed",
    statusHistory: [
      {
        status: "Pending",
        location: "Birmingham Distribution Center",
        timestamp: new Date("2023-08-25T08:30:00"),
        note: "Shipment created and ready for processing",
      },
      {
        status: "In Transit",
        location: "London Heathrow Airport",
        timestamp: new Date("2023-08-27T09:15:00"),
        note: "Shipment departed from origin country",
      },
      {
        status: "Delayed",
        location: "London Heathrow Airport",
        timestamp: new Date("2023-08-28T16:45:00"),
        note: "Flight delayed due to weather conditions",
      },
    ],
    weight: 3.1,
    dimensions: {
      length: 25,
      width: 20,
      height: 15,
    },
    packageType: "Document",
    fragile: false,
    insuranceIncluded: true,
    expressDelivery: true,
    additionalNotes: "Important business documents.",
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
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      console.log("Admin user already exists, skipping creation");
      return;
    }

    // Create admin user
    const admin = new User(adminUser);
    await admin.save();
    console.log("Admin user created successfully");
    console.log("Email:", adminUser.email);
    console.log("Password:", adminUser.password);
    console.log("Please change this password after first login");
  } catch (error) {
    console.error("Error creating admin user:", error);
    throw error;
  }
}
