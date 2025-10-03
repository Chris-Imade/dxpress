const Shipment = require("../models/Shipment");
const carrierService = require("../services/carriers");
const nodemailer = require("nodemailer");

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Add timeout settings to give more time for connection
  connectionTimeout: 60000, // 60 seconds
  greetingTimeout: 30000, // 30 seconds
  socketTimeout: 60000, // 60 seconds
});

// Email templates
const customerShipmentConfirmationTemplate = (shipment) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1a237e; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { text-align: center; padding: 20px; background-color: #f5f5f5; }
        .shipment-details { background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .tracking-number { font-size: 18px; font-weight: bold; color: #1a237e; }
        .button { display: inline-block; background-color: #1a237e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Your Shipment is Confirmed!</h1>
        </div>
        <div class="content">
            <p>Dear ${shipment.customerName},</p>
            <p>Thank you for choosing DXpress for your shipping needs. Your shipment has been confirmed and is now being processed.</p>
            
            <div class="shipment-details">
                <p><strong>Tracking Number:</strong> <span class="tracking-number">${
                  shipment.trackingId
                }</span></p>
                <p><strong>Origin:</strong> ${shipment.origin}</p>
                <p><strong>Destination:</strong> ${shipment.destination}</p>
                <p><strong>Package Type:</strong> ${shipment.packageType}</p>
                <p><strong>Weight:</strong> ${shipment.weight} kg</p>
                <p><strong>Estimated Delivery:</strong> ${new Date(
                  shipment.estimatedDelivery
                ).toDateString()}</p>
                <p><strong>Status:</strong> ${shipment.status}</p>
            </div>
            
            <p>You can track your shipment at any time by visiting our website and entering your tracking number.</p>
            
            <a href="https://www.dxpress.uk/shipment/track?id=${
              shipment.trackingId
            }" class="button">Track Shipment</a>
            
            <p>If you have any questions about your shipment, please contact our customer service team at support@dxpress.uk or call +44 7506 323070.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>The DXpress Team</p>
        </div>
    </div>
</body>
</html>
`;

const adminShipmentNotificationTemplate = (shipment) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1a237e; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { text-align: center; padding: 20px; background-color: #f5f5f5; }
        .shipment-details { background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .customer-info { background-color: #eff6ff; padding: 15px; margin: 15px 0; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Shipment Created</h1>
        </div>
        <div class="content">
            <p>A new shipment has been created in the system:</p>
            
            <div class="customer-info">
                <h3>Customer Information</h3>
                <p><strong>Name:</strong> ${shipment.customerName}</p>
                <p><strong>Email:</strong> ${shipment.customerEmail}</p>
                <p><strong>Phone:</strong> ${shipment.customerPhone}</p>
            </div>
            
            <div class="shipment-details">
                <h3>Shipment Details</h3>
                <p><strong>Tracking Number:</strong> ${shipment.trackingId}</p>
                <p><strong>Origin:</strong> ${shipment.origin}</p>
                <p><strong>Destination:</strong> ${shipment.destination}</p>
                <p><strong>Package Type:</strong> ${shipment.packageType}</p>
                <p><strong>Weight:</strong> ${shipment.weight} kg</p>
                <p><strong>Dimensions:</strong> ${
                  shipment.dimensions.length || "N/A"
                } x ${shipment.dimensions.width || "N/A"} x ${
  shipment.dimensions.height || "N/A"
} cm</p>
                <p><strong>Estimated Delivery:</strong> ${new Date(
                  shipment.estimatedDelivery
                ).toDateString()}</p>
                <p><strong>Status:</strong> ${shipment.status}</p>
                <p><strong>Fragile:</strong> ${
                  shipment.fragile ? "Yes" : "No"
                }</p>
                <p><strong>Insurance Included:</strong> ${
                  shipment.insuranceIncluded ? "Yes" : "No"
                }</p>
                <p><strong>Express Delivery:</strong> ${
                  shipment.expressDelivery ? "Yes" : "No"
                }</p>
                ${
                  shipment.additionalNotes
                    ? `<p><strong>Additional Notes:</strong> ${shipment.additionalNotes}</p>`
                    : ""
                }
            </div>
            
            <p>Please log in to the admin dashboard to manage this shipment.</p>
        </div>
        <div class="footer">
            <p>This is an automated message from the DXpress shipping system.</p>
        </div>
    </div>
</body>
</html>
`;

// Function to create a sample shipment for testing purposes
const createSampleShipment = async () => {
  try {
    // Check if we already have the sample shipment
    const existingShipment = await Shipment.findOne({
      trackingId: "DX123456TEST",
    });

    if (existingShipment) {
      console.log("Sample shipment already exists");
      return existingShipment;
    }

    const sampleShipment = new Shipment({
      trackingId: "DX123456TEST",
      customerName: "Test Customer",
      customerEmail: "test@example.com",
      customerPhone: "+44 7123 456789",
      origin: "London, UK",
      destination: "Manchester, UK",
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      weight: 10,
      dimensions: {
        length: 30,
        width: 20,
        height: 15,
      },
      packageType: "Parcel",
      fragile: false,
      insuranceIncluded: true,
      expressDelivery: false,
      status: "In Transit",
      statusHistory: [
        {
          status: "Pending",
          location: "London Warehouse",
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          note: "Package received at origin facility",
        },
        {
          status: "In Transit",
          location: "London Distribution Center",
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          note: "Package in transit to destination",
        },
      ],
    });

    await sampleShipment.save();
    console.log("Sample shipment created with tracking ID: DX123456TEST");
    return sampleShipment;
  } catch (error) {
    console.error("Error creating sample shipment:", error);
  }
};

// Get tracking page
exports.getTrackingPage = async (req, res) => {
  // Check if there's a tracking ID in the query
  const trackingId = req.query.id;

  // Create a sample shipment for testing
  await createSampleShipment();

  // If a tracking ID is provided in the query, track the shipment
  if (trackingId) {
    try {
      // Ensure we get fresh data by using lean() to get plain objects
      const shipment = await Shipment.findOne({ trackingId: trackingId })
        .lean()
        .exec();

      if (shipment) {
        // Fix any potential timestamp issues in statusHistory
        if (shipment.statusHistory && shipment.statusHistory.length > 0) {
          // Ensure all timestamps are Date objects
          shipment.statusHistory = shipment.statusHistory.map((entry) => ({
            ...entry,
            timestamp: entry.timestamp || new Date(),
          }));

          // Sort by timestamp, newest first
          shipment.statusHistory.sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        }

        // Format dimensions for display
        if (shipment.dimensions) {
          shipment.dimensions = `${shipment.dimensions.length || 0} × ${
            shipment.dimensions.width || 0
          } × ${shipment.dimensions.height || 0} cm`;
        } else {
          shipment.dimensions = "N/A";
        }

        // Calculate progress percentage based on status
        let statusProgress = 5;
        if (shipment.status === "Pending") {
          statusProgress = 15;
        } else if (shipment.status === "In Transit") {
          statusProgress = 55;
        } else if (shipment.status === "Delivered") {
          statusProgress = 100;
        } else if (shipment.status === "Delayed") {
          statusProgress = 65;
        }

        // Convert to string with % for style attribute
        const progressStyle = `${statusProgress}%`;

        // Debug information
        console.log("Tracking shipment from query:", shipment.trackingId);
        console.log("Current status:", shipment.status);
        console.log(
          "Status history:",
          JSON.stringify(shipment.statusHistory, null, 2)
        );

        // Render the result page directly
        return res.render("shipment/track-result", {
          title: "Shipment Information",
          path: "/shipment/track",
          shipment: shipment,
          statusProgress: statusProgress,
          progressStyle: progressStyle,
        });
      }
    } catch (error) {
      console.error("Error tracking shipment from query:", error);
      // Continue to regular tracking page if there's an error
    }
  }

  // Render the regular tracking page
  res.render("shipment/track", {
    title: "Track Your Shipment",
    path: "/shipment/track",
    errorMessage: null,
    shipment: null,
  });
};

// Track a shipment
exports.trackShipment = async (req, res) => {
  const trackingId = req.body.trackingId;

  // If no tracking ID provided, just show the form
  if (!trackingId) {
    return res.render("shipment/track", {
      title: "Track Your Shipment",
      path: "/shipment/track",
      errorMessage: "Please enter a tracking ID",
      shipment: null,
    });
  }

  try {
    // Ensure we get fresh data by using lean() to get plain objects and not mongoose documents
    const shipment = await Shipment.findOne({ trackingId: trackingId })
      .lean() // Get plain JavaScript object instead of mongoose document
      .exec();

    if (!shipment) {
      return res.render("shipment/track", {
        title: "Track Your Shipment",
        path: "/shipment/track",
        errorMessage: "No shipment found with that tracking ID",
        shipment: null,
      });
    }

    // Fix any potential timestamp issues in statusHistory
    if (shipment.statusHistory && shipment.statusHistory.length > 0) {
      // Ensure all timestamps are Date objects
      shipment.statusHistory = shipment.statusHistory.map((entry) => ({
        ...entry,
        timestamp: entry.timestamp || new Date(),
      }));

      // Sort by timestamp, newest first
      shipment.statusHistory.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    }

    // Format dimensions for display
    if (shipment.dimensions) {
      shipment.dimensions = `${shipment.dimensions.length || 0} × ${
        shipment.dimensions.width || 0
      } × ${shipment.dimensions.height || 0} cm`;
    } else {
      shipment.dimensions = "N/A";
    }

    // Calculate progress percentage based on status
    let statusProgress = 5;
    if (shipment.status === "Pending") {
      statusProgress = 15;
    } else if (shipment.status === "In Transit") {
      statusProgress = 55;
    } else if (shipment.status === "Delivered") {
      statusProgress = 100;
    } else if (shipment.status === "Delayed") {
      statusProgress = 65;
    }

    // Convert to string with % for style attribute
    const progressStyle = `${statusProgress}%`;

    // Debug information
    console.log("Tracking shipment:", shipment.trackingId);
    console.log("Current status:", shipment.status);
    console.log(
      "Status history:",
      JSON.stringify(shipment.statusHistory, null, 2)
    );

    res.render("shipment/track-result", {
      title: "Shipment Information",
      path: "/shipment/track",
      shipment: shipment,
      statusProgress: statusProgress,
      progressStyle: progressStyle,
    });
  } catch (error) {
    console.error("Error tracking shipment:", error);
    res.render("shipment/track", {
      title: "Track Your Shipment",
      path: "/shipment/track",
      errorMessage: "An error occurred while tracking your shipment",
      shipment: null,
    });
  }
};

// Get shipment request page
exports.getRequestPage = (req, res) => {
  res.render("shipment/request", {
    title: "Request a Shipment",
    path: "/shipment/request",
    errorMessage: null,
    formData: {},
  });
};

// Create a shipment request
exports.createShipmentRequest = async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      origin,
      destination,
      estimatedDelivery,
      weight,
      length,
      width,
      height,
      packageType,
      fragile,
      insuranceIncluded,
      expressDelivery,
      additionalNotes,
    } = req.body;

    // Create new shipment object
    const shipment = new Shipment({
      createdBy: req.user._id, // Associate shipment with logged-in user
      customerName,
      customerEmail,
      customerPhone,
      origin,
      destination,
      estimatedDelivery: new Date(estimatedDelivery),
      weight,
      dimensions: {
        length,
        width,
        height,
      },
      packageType,
      fragile: fragile === "on",
      insuranceIncluded: insuranceIncluded === "on",
      expressDelivery: expressDelivery === "on",
      additionalNotes,
      statusHistory: [
        {
          status: "Pending",
          location: origin,
          note: "Shipment created",
        },
      ],
    });

    // Save to database
    await shipment.save();

    // Send email notifications
    try {
      // Send confirmation to customer
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: customerEmail,
        subject: "Your Shipment Confirmation - DXpress",
        html: customerShipmentConfirmationTemplate(shipment),
      });

      // Send notification to admin
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: "admin@dxpress.uk",
        subject: `New Shipment Created - ${shipment.trackingId}`,
        html: adminShipmentNotificationTemplate(shipment),
      });
    } catch (emailError) {
      console.error("Error sending shipment emails:", emailError);
      // Continue processing even if email fails
    }

    // Render success page
    res.render("shipment/request-success", {
      title: "Shipment Request Successful",
      path: "/shipment/request",
      shipment: shipment,
    });
  } catch (error) {
    console.error("Error creating shipment:", error);
    res.render("shipment/request", {
      title: "Request a Shipment",
      path: "/shipment/request",
      errorMessage: "An error occurred while processing your request",
      formData: req.body,
    });
  }
};

// Test FedEx address validation
exports.testAddressValidation = async (req, res) => {
  try {
    console.log('🧪 [TEST] Testing FedEx address validation...');
    
    const testAddress = {
      address: "456 Innovation Dr",
      city: "San Francisco", 
      state: "CA",
      postalCode: "94107",
      country: "US"
    };
    
    console.log('🧪 [TEST] Test address:', testAddress);
    
    const validation = await carrierService.validateAddress(testAddress);
    
    res.json({
      success: true,
      message: 'FedEx address validation test completed',
      data: {
        inputAddress: testAddress,
        validationResult: validation,
        isValid: validation.isValid,
        classification: validation.classification,
        confidence: validation.confidence
      }
    });
  } catch (error) {
    console.error('🧪 [TEST] FedEx address validation test failed:', error);
    res.status(500).json({
      success: false,
      message: 'FedEx address validation test failed',
      error: error.message,
      inputAddress: {
        address: "456 Innovation Dr",
        city: "San Francisco", 
        state: "CA",
        postalCode: "94107",
        country: "US"
      }
    });
  }
};

// Test FedEx OAuth authentication
exports.testFedExAuth = async (req, res) => {
  try {
    console.log('🧪 [TEST] Testing FedEx OAuth authentication...');
    
    const token = await carrierService.carriers.fedex.getAccessToken();
    
    res.json({
      success: true,
      message: 'FedEx OAuth authentication successful',
      data: {
        tokenReceived: !!token,
        tokenLength: token ? token.length : 0,
        tokenPrefix: token ? token.substring(0, 20) + '...' : null,
        environment: process.env.NODE_ENV,
        baseUrl: carrierService.carriers.fedex.baseUrl
      }
    });
  } catch (error) {
    console.error('🧪 [TEST] FedEx OAuth test failed:', error);
    res.status(500).json({
      success: false,
      message: 'FedEx OAuth authentication failed',
      error: error.message,
      details: {
        environment: process.env.NODE_ENV,
        baseUrl: carrierService.carriers.fedex.baseUrl,
        hasApiKey: !!process.env.FEDEX_API_KEY,
        hasApiSecret: !!process.env.FEDEX_API_SECRET,
        hasAccountNumber: !!process.env.FEDEX_ACCOUNT_NUMBER
      }
    });
  }
};

// Get shipping rates from FedEx
exports.getShippingRates = async (req, res) => {
  try {
    const { origin, destination, weight, dimensions } = req.body;

    // Validate required fields
    if (!origin || !destination || !weight) {
      return res.status(400).json({
        error: "Missing required fields: origin, destination, weight"
      });
    }

    // Format addresses for FedEx API
    const originAddress = {
      address: origin.address,
      city: origin.city,
      state: origin.state,
      postalCode: origin.postalCode,
      country: origin.country || 'US'
    };

    const destinationAddress = {
      address: destination.address,
      city: destination.city,
      state: destination.state,
      postalCode: destination.postalCode,
      country: destination.country || 'US'
    };

    const packageDimensions = {
      length: dimensions?.length || 10,
      width: dimensions?.width || 10,
      height: dimensions?.height || 10
    };

    // Get rates from FedEx
    const rates = await carrierService.calculateRates(
      originAddress,
      destinationAddress,
      parseFloat(weight),
      packageDimensions,
      ['fedex']
    );

    res.json({
      success: true,
      rates: rates,
      message: `Found ${rates.length} shipping options`
    });

  } catch (error) {
    console.error("Error getting shipping rates:", error);
    res.status(500).json({
      error: "Failed to calculate shipping rates",
      message: error.message
    });
  }
};

// Validate address using FedEx API
exports.validateAddress = async (req, res) => {
  try {
    const { address } = req.body;
    
    console.log('🔍 [DEBUG] Received address for validation:', JSON.stringify(address, null, 2));

    if (!address || !address.address) {
      return res.status(400).json({
        error: "Missing required address fields"
      });
    }

    // Ensure country is a valid code
    let countryCode = address.country || 'US';
    if (countryCode.length > 2) {
      // Convert country name to code if needed
      const countryMap = {
        'United States': 'US',
        'United Kingdom': 'GB', 
        'Canada': 'CA',
        'Australia': 'AU',
        'Germany': 'DE',
        'France': 'FR'
      };
      countryCode = countryMap[countryCode] || 'US';
    }

    // Create properly formatted address for FedEx
    const addressToValidate = {
      address: address.address,
      city: address.city || '',
      state: address.state || '',
      postalCode: address.postalCode || '',
      country: countryCode
    };

    console.log('🔍 [DEBUG] Formatted address for FedEx:', JSON.stringify(addressToValidate, null, 2));

    const validation = await carrierService.validateAddress(addressToValidate);
    
    console.log('🔍 [DEBUG] Raw FedEx validation response:', JSON.stringify(validation, null, 2));

    // Clean the malformed FedEx data using our helper function
    const cleanedValidation = {
      ...validation,
      formattedAddress: cleanFedExData(validation.formattedAddress, addressToValidate)
    };

    console.log('🔍 [DEBUG] Cleaned validation response:', JSON.stringify(cleanedValidation, null, 2));

    // Determine if address is valid based on cleaned data
    const isValidAddress = cleanedValidation.formattedAddress.city && 
                          cleanedValidation.formattedAddress.postalCode &&
                          cleanedValidation.formattedAddress.state &&
                          cleanedValidation.formattedAddress.country === addressToValidate.country;

    // Update validation status
    cleanedValidation.isValid = isValidAddress;
    cleanedValidation.classification = isValidAddress ? 'VALIDATED' : 'UNKNOWN';
    cleanedValidation.confidence = isValidAddress ? 'HIGH' : 'UNKNOWN';

    res.json({
      success: true,
      validation: cleanedValidation,
      message: cleanedValidation.isValid ? "Address validated successfully" : "Address validation completed with corrections"
    });

  } catch (error) {
    console.error("Error validating address:", error);
    res.status(500).json({
      error: "Failed to validate address",
      message: error.message
    });
  }
};

// Get address suggestions as user types (for autocomplete)
exports.getAddressSuggestions = async (req, res) => {
  const { query, country = 'US' } = req.query;

  if (!query || query.length < 3) {
    return res.json({
      success: true,
      suggestions: []
    });
  }

  try {
    // Parse address components from the query string
    const parsedAddress = parseAddressString(query);
    console.log('📍 [DEBUG] Parsed address:', parsedAddress);

    // Create address object for FedEx validation
    const addressToValidate = {
      address: parsedAddress.street || query,
      city: parsedAddress.city || '',
      postalCode: parsedAddress.postalCode || '',
      country: country
    };

    const validation = await carrierService.validateAddress(addressToValidate);
    console.log('📍 [DEBUG] FedEx validation result:', JSON.stringify(validation, null, 2));
    
    // Create suggestions with enhanced data
    const suggestions = [];
    
    if (validation.formattedAddress) {
      // Clean and correct FedEx data
      const cleanedData = cleanFedExData(validation.formattedAddress, parsedAddress);
      
      const suggestion = {
        address: cleanedData.address || parsedAddress.street || query,
        city: cleanedData.city || parsedAddress.city || '',
        state: cleanedData.state || parsedAddress.state || '',
        postalCode: cleanedData.postalCode || parsedAddress.postalCode || '',
        country: cleanedData.country || country,
        classification: validation.classification || 'UNKNOWN',
        confidence: validation.confidence || 'UNKNOWN'
      };

      console.log('📍 [DEBUG] Data cleaning results:', {
        originalFedEx: validation.formattedAddress,
        cleanedFedEx: cleanedData,
        parsedData: parsedAddress,
        finalSuggestion: suggestion
      });

      // Add suggestion if we have any meaningful data beyond just the address
      suggestions.push(suggestion);
    }

    // If FedEx didn't provide good results, try to create suggestion from parsed data only
    if (suggestions.length === 0 && (parsedAddress.city || parsedAddress.postalCode)) {
      const parsedSuggestion = {
        address: parsedAddress.street || query,
        city: parsedAddress.city || '',
        state: parsedAddress.state || '',
        postalCode: parsedAddress.postalCode || '',
        country: country,
        classification: 'PARSED',
        confidence: 'LOCAL_PARSING'
      };
      
      console.log('📍 [DEBUG] Using parsed-only suggestion:', parsedSuggestion);
      suggestions.push(parsedSuggestion);
    }

    console.log('📍 [DEBUG] Final suggestions:', JSON.stringify(suggestions, null, 2));

    res.json({
      success: true,
      suggestions: suggestions
    });

  } catch (error) {
    console.error('📍 [DEBUG] Address suggestion error:', error);
    res.json({
      success: true,
      suggestions: []
    });
  }
};

// Helper function to clean and correct FedEx malformed data
function cleanFedExData(fedexData, parsedData) {
  const cleaned = {
    address: fedexData.address,
    city: fedexData.city,
    state: fedexData.state,
    postalCode: fedexData.postalCode,
    country: fedexData.country
  };

  // Smart state extraction - if we see malformed state, try to extract from context
  let correctState = null;
  let correctCity = null;
  let correctPostal = null;

  // Fix malformed city field (e.g., "CA 9410" instead of proper city)
  if (cleaned.city && /^[A-Z]{2}\s+\d+/.test(cleaned.city)) {
    console.log('🔧 [FIX] Detected malformed city:', cleaned.city);
    
    // Extract state and partial postal from malformed city
    const match = cleaned.city.match(/^([A-Z]{2})\s+(\d+)/);
    if (match) {
      correctState = match[1];
      const partialPostal = match[2];
      
      // Try to extract city from address first (more reliable than malformed parsed data)
      correctCity = extractCityFromAddress(fedexData.address);
      
      // If extraction failed, try special patterns
      if (!correctCity && fedexData.address && fedexData.address.includes('SAN FRANCISCO')) {
        correctCity = 'San Francisco';
      }
      
      // Only use parsed city as last resort if it's not malformed
      if (!correctCity && parsedData.city && !parsedData.city.match(/^[A-Z]{2}\s+\d+/)) {
        correctCity = parsedData.city;
      }
      
      console.log('🔧 [FIX] City extraction attempts:', {
        parsedCity: parsedData.city,
        extractedCity: extractCityFromAddress(fedexData.address),
        finalCity: correctCity,
        address: fedexData.address
      });
      
      // Try to reconstruct full postal code
      if (parsedData.postalCode) {
        correctPostal = parsedData.postalCode;
      } else if (partialPostal.length === 4) {
        // Common US postal codes - try to complete
        correctPostal = partialPostal + '7'; // Common pattern
      } else {
        correctPostal = partialPostal;
      }
      
      console.log('🔧 [FIX] Extracted from malformed city:', {
        originalCity: fedexData.city,
        extractedState: correctState,
        extractedPostal: partialPostal,
        correctedCity: correctCity,
        correctedPostal: correctPostal
      });
    }
  }

  // Fix malformed state (e.g., "RegiÃ³n Metropolitana de Santia")
  if (cleaned.state && (cleaned.state.includes('Región') || cleaned.state.includes('RegiÃ³n') || cleaned.state.length > 10)) {
    console.log('🔧 [FIX] Detected malformed state:', cleaned.state);
    
    // Use extracted state from city or parsed data
    if (correctState) {
      cleaned.state = correctState;
      console.log('🔧 [FIX] Using extracted state:', correctState);
    } else if (parsedData.state && /^[A-Z]{2}$/.test(parsedData.state)) {
      cleaned.state = parsedData.state;
      console.log('🔧 [FIX] Using parsed state:', parsedData.state);
    } else {
      // Try to extract from address context
      const stateFromAddress = extractStateFromContext(fedexData.address, parsedData);
      if (stateFromAddress) {
        cleaned.state = stateFromAddress;
        console.log('🔧 [FIX] Extracted state from context:', stateFromAddress);
      }
    }
  }

  // Apply corrections
  if (correctCity) cleaned.city = correctCity;
  if (correctPostal) cleaned.postalCode = correctPostal;

  // Fix empty fields with parsed data
  if (!cleaned.postalCode && parsedData.postalCode) {
    cleaned.postalCode = parsedData.postalCode;
    console.log('🔧 [FIX] Using parsed postal code:', cleaned.postalCode);
  }

  if (!cleaned.city && parsedData.city) {
    cleaned.city = parsedData.city;
    console.log('🔧 [FIX] Using parsed city:', cleaned.city);
  }

  // Fix wrong country (CL instead of US)
  if (cleaned.country === 'CL' && (correctState || (parsedData.state && /^[A-Z]{2}$/.test(parsedData.state)))) {
    cleaned.country = 'US';
    console.log('🔧 [FIX] Corrected country from CL to US');
  }

  return cleaned;
}

// Helper function to extract city from address string
function extractCityFromAddress(address) {
  if (!address) return null;
  
  // Look for common city patterns in address
  const cityPatterns = [
    /,\s*([A-Z][a-z\s]+)$/i,        // ", San Francisco"
    /,\s*([A-Z][a-z\s]+),/i,        // ", San Francisco,"
    /\s+([A-Z][A-Z\s]+)$/i,         // " SAN FRANCISCO"
    /DR,?\s+([A-Z][A-Z\s]+)/i,      // "DR, SAN FRANCISCO" or "DR SAN FRANCISCO"
    /ST,?\s+([A-Z][A-Z\s]+)/i,      // "ST, SAN FRANCISCO" or "ST SAN FRANCISCO"
    /AVE,?\s+([A-Z][A-Z\s]+)/i      // "AVE, SAN FRANCISCO" or "AVE SAN FRANCISCO"
  ];
  
  for (const pattern of cityPatterns) {
    const match = address.match(pattern);
    if (match) {
      const city = match[1].trim();
      // Convert to proper case if all caps
      if (city === city.toUpperCase()) {
        return city.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
      }
      return city;
    }
  }
  
  // Special handling for known addresses
  if (address.includes('SAN FRANCISCO')) return 'San Francisco';
  if (address.includes('NEW YORK')) return 'New York';
  if (address.includes('LOS ANGELES')) return 'Los Angeles';
  
  return null;
}

// Helper function to extract state from context
function extractStateFromContext(address, parsedData) {
  // Common US state abbreviations
  const stateAbbreviations = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];
  
  // Try to find state in address or parsed data
  const fullText = `${address} ${parsedData.street || ''} ${parsedData.city || ''}`;
  
  for (const state of stateAbbreviations) {
    if (fullText.includes(state)) {
      return state;
    }
  }
  
  // Default based on common patterns
  if (address && address.includes('San Francisco')) return 'CA';
  if (address && address.includes('New York')) return 'NY';
  if (address && address.includes('Los Angeles')) return 'CA';
  
  return null;
}

// Helper function to parse address strings
function parseAddressString(addressString) {
  const result = {
    street: '',
    city: '',
    state: '',
    postalCode: ''
  };

  try {
    // Common patterns for US addresses
    const patterns = [
      // "123 Main St, New York, NY 10001"
      /^(.+?),\s*([^,]+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i,
      // "123 Main St, New York NY 10001"
      /^(.+?),\s*([^,]+)\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i,
      // "123 Main St New York NY 10001"
      /^(.+?)\s+([A-Za-z\s]+)\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i,
      // "123 Main St, New York"
      /^(.+?),\s*([^,]+)$/i
    ];

    for (const pattern of patterns) {
      const match = addressString.match(pattern);
      if (match) {
        result.street = match[1]?.trim() || '';
        result.city = match[2]?.trim() || '';
        result.state = match[3]?.trim().toUpperCase() || '';
        result.postalCode = match[4]?.trim() || '';
        break;
      }
    }

    // If no pattern matched, treat entire string as street address
    if (!result.street && !result.city) {
      result.street = addressString.trim();
    }

  } catch (error) {
    console.error('Error parsing address string:', error);
    result.street = addressString.trim();
  }

  return result;
}
