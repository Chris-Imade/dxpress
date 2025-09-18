const axios = require("axios");
const ShipmentRate = require("../models/ShipmentRate");

class DHLService {
  constructor() {
    this.apiKey = process.env.DHL_CLIENT_ID;  // DHL Express uses API Key
    this.apiSecret = process.env.DHL_CLIENT_SECRET;  // DHL Express uses API Secret
    this.accountNumber = process.env.DHL_ACCOUNT_NUMBER;
    this.pickupAccount = process.env.DHL_PICKUP_ACCOUNT;
    
    // DHL Express MyDHL API uses the same base URL for sandbox and production
    // Environment is controlled by the API credentials provided
    this.baseURL = process.env.DHL_API_SANDBOX_BASE_URL;
    
    // Create Basic Auth header for DHL Express MyDHL API
    this.authHeader = this.apiKey && this.apiSecret 
      ? `Basic ${Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')}`
      : null;
    
    const isDevelopment = process.env.NODE_ENV === 'development';
    console.log(`🚚 [DHL] Initialized with ${isDevelopment ? 'SANDBOX' : 'PRODUCTION'} credentials`);
    console.log(`🚚 [DHL] Base URL: ${this.baseURL}`);
    console.log(`🚚 [DHL] API Key: ${this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'NOT SET'}`);
    console.log(`🚚 [DHL] Account Number: ${this.accountNumber ? this.accountNumber.substring(0, 6) + '...' : 'NOT SET'}`);
  }

  // Test DHL Express MyDHL API authentication
  async testAuthentication() {
    if (!this.authHeader) {
      throw new Error('DHL API credentials not configured. Please set DHL_CLIENT_ID and DHL_CLIENT_SECRET.');
    }

    try {
      console.log('🔐 [DHL] Testing authentication with MyDHL API...');
      
      // Test with a simple API call (accounts endpoint)
      const response = await axios.get(`${this.baseURL}/mydhlapi/test/accounts/${this.accountNumber}`, {
        headers: {
          "Authorization": this.authHeader,
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        timeout: 15000
      });

      console.log('✅ [DHL] Authentication successful!');
      return { success: true, data: response.data };
    } catch (error) {
      console.error("❌ [DHL] Authentication Error Details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url
      });
      
      throw new Error('DHL API authentication failed. Please verify your API Key, API Secret, and Account Number.');
    }
  }

  // Test DHL Express MyDHL API authentication
  async testAuthentication() {
    if (!this.authHeader) {
      throw new Error('DHL API credentials not configured. Please set DHL_CLIENT_ID and DHL_CLIENT_SECRET.');
    }

    try {
      console.log('🔐 [DHL] Testing authentication with MyDHL API...');
      
      // Test with a simple API call (accounts endpoint)
      const response = await axios.get(`${this.baseURL}/mydhlapi/test/accounts/${this.accountNumber}`, {
        headers: {
          "Authorization": this.authHeader,
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        timeout: 15000
      });

      console.log('✅ [DHL] Authentication successful!');
      return { success: true, data: response.data };
    } catch (error) {
      console.error("❌ [DHL] Authentication Error Details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url
      });
      
      throw new Error('DHL API authentication failed. Please verify your API Key, API Secret, and Account Number.');
    }
  }

  // Calculate shipping rates
  async calculateRates(shipmentData) {
    try {
      const token = await this.getAccessToken();
      
      const rateRequest = {
        customerDetails: {
          shipperDetails: {
            postalAddress: {
              postalCode: shipmentData.origin.postalCode,
              cityName: shipmentData.origin.city,
              countryCode: this.getCountryCode(shipmentData.origin.country),
            },
          },
          receiverDetails: {
            postalAddress: {
              postalCode: shipmentData.destination.postalCode,
              cityName: shipmentData.destination.city,
              countryCode: this.getCountryCode(shipmentData.destination.country),
            },
          },
        },
        accounts: [
          {
            typeCode: "shipper",
            number: this.accountNumber,
          },
        ],
        productCode: "P", // DHL Express Worldwide
        localProductCode: "P",
        valueAddedServices: [],
        productsAndServices: [
          {
            productCode: "P",
          },
        ],
        payerCountryCode: this.getCountryCode(shipmentData.origin.country),
        plannedShippingDateAndTime: new Date().toISOString(),
        unitOfMeasurement: "metric",
        isCustomsDeclarable: this.isInternational(shipmentData),
        monetaryAmount: [
          {
            typeCode: "declared",
            value: shipmentData.declaredValue || 100,
            currency: "GBP",
          },
        ],
        requestAllValueAddedServices: false,
        returnStandardProductsOnly: false,
        nextBusinessDay: false,
        packages: [
          {
            typeCode: this.getPackageTypeCode(shipmentData.packageType),
            weight: shipmentData.weight,
            dimensions: {
              length: shipmentData.dimensions?.length || 10,
              width: shipmentData.dimensions?.width || 10,
              height: shipmentData.dimensions?.height || 10,
            },
          },
        ],
      };

      const response = await axios.post(
        `${this.baseURL}/mydhlapi/rates`,
        rateRequest,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return this.processRateResponse(response.data);
    } catch (error) {
      console.error("DHL Rate Calculation Error:", error.response?.data || error.message);
      throw new Error("Failed to calculate DHL rates");
    }
  }

  // Create shipment
  async createShipment(shipmentData) {
    try {
      const token = await this.getAccessToken();

      const shipmentRequest = {
        plannedShippingDateAndTime: new Date().toISOString(),
        pickup: {
          isRequested: false,
        },
        productCode: "P",
        localProductCode: "P",
        getRateEstimates: false,
        accounts: [
          {
            typeCode: "shipper",
            number: this.accountNumber,
          },
        ],
        valueAddedServices: [],
        outputImageProperties: {
          printerDPI: 300,
          customerLogos: [],
          imageOptions: [
            {
              typeCode: "label",
              templateName: "ECOM26_84_001",
              isRequested: true,
            },
          ],
        },
        customerDetails: {
          shipperDetails: {
            postalAddress: {
              streetLines: [shipmentData.origin.address],
              cityName: shipmentData.origin.city,
              postalCode: shipmentData.origin.postalCode,
              countryCode: this.getCountryCode(shipmentData.origin.country),
            },
            contactInformation: {
              phone: shipmentData.customerPhone,
              companyName: "DXpress",
              fullName: "DXpress Shipping",
            },
          },
          receiverDetails: {
            postalAddress: {
              streetLines: [shipmentData.destination.address],
              cityName: shipmentData.destination.city,
              postalCode: shipmentData.destination.postalCode,
              countryCode: this.getCountryCode(shipmentData.destination.country),
            },
            contactInformation: {
              phone: shipmentData.customerPhone,
              companyName: shipmentData.customerName,
              fullName: shipmentData.customerName,
            },
          },
        },
        content: {
          packages: [
            {
              typeCode: this.getPackageTypeCode(shipmentData.packageType),
              weight: shipmentData.weight,
              dimensions: {
                length: shipmentData.dimensions?.length || 10,
                width: shipmentData.dimensions?.width || 10,
                height: shipmentData.dimensions?.height || 10,
              },
            },
          ],
          isCustomsDeclarable: this.isInternational(shipmentData),
          declaredValue: shipmentData.declaredValue || 100,
          declaredValueCurrency: "GBP",
          description: "Package",
        },
      };

      const response = await axios.post(
        `${this.baseURL}/mydhlapi/shipments`,
        shipmentRequest,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return this.processShipmentResponse(response.data);
    } catch (error) {
      console.error("DHL Shipment Creation Error:", error.response?.data || error.message);
      throw new Error("Failed to create DHL shipment");
    }
  }

  // Track shipment
  async trackShipment(trackingNumber) {
    try {
      const token = await this.getAccessToken();

      const response = await axios.get(
        `${this.baseURL}/mydhlapi/shipments/${trackingNumber}/tracking`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return this.processTrackingResponse(response.data);
    } catch (error) {
      console.error("DHL Tracking Error:", error.response?.data || error.message);
      throw new Error("Failed to track DHL shipment");
    }
  }

  // Apply admin markup to DHL rates
  async applyMarkupAndSave(dhlRates, markupPercentage = 0) {
    const savedRates = [];

    for (const rate of dhlRates) {
      const markup = (rate.baseRate * markupPercentage) / 100;
      const finalRate = rate.baseRate + markup;

      // Save or update rate in database
      const savedRate = await ShipmentRate.findOneAndUpdate(
        {
          carrier: "dhl",
          service: rate.service,
        },
        {
          carrier: "dhl",
          service: rate.service,
          baseRate: rate.baseRate,
          markup: markup,
          finalRate: finalRate,
          currency: rate.currency,
          lastUpdated: new Date(),
        },
        {
          upsert: true,
          new: true,
        }
      );

      savedRates.push(savedRate);
    }

    return savedRates;
  }

  // Helper methods
  getCountryCode(country) {
    const countryCodes = {
      "United Kingdom": "GB",
      "United States": "US",
      "Germany": "DE",
      "France": "FR",
      "Italy": "IT",
      "Spain": "ES",
      "Netherlands": "NL",
      "Belgium": "BE",
      "Canada": "CA",
      "Australia": "AU",
    };
    return countryCodes[country] || "GB";
  }

  getPackageTypeCode(packageType) {
    const typeCodes = {
      envelope: "EE",
      small_box: "YP",
      medium_box: "CP",
      large_box: "CP",
      pallet: "CP",
    };
    return typeCodes[packageType] || "CP";
  }

  isInternational(shipmentData) {
    const originCountry = this.getCountryCode(shipmentData.origin.country);
    const destCountry = this.getCountryCode(shipmentData.destination.country);
    return originCountry !== destCountry;
  }

  processRateResponse(data) {
    if (!data.products || data.products.length === 0) {
      throw new Error("No rates available for this route");
    }

    return data.products.map((product) => ({
      service: product.productName || "DHL Express",
      serviceCode: product.productCode,
      baseRate: parseFloat(product.totalPrice?.[0]?.price || 0),
      currency: product.totalPrice?.[0]?.currencyType || "GBP",
      deliveryTime: product.deliveryCapabilities?.deliveryTypeCode || "QDDC",
      transitTime: product.deliveryCapabilities?.estimatedDeliveryDateAndTime,
    }));
  }

  processShipmentResponse(data) {
    return {
      trackingNumber: data.shipmentTrackingNumber,
      dhlShipmentId: data.dispatchConfirmationNumber,
      labelUrl: data.documents?.[0]?.content,
      estimatedDelivery: data.estimatedDeliveryDate,
      packages: data.packages || [],
    };
  }

  processTrackingResponse(data) {
    if (!data.shipments || data.shipments.length === 0) {
      throw new Error("No tracking information available");
    }

    const shipment = data.shipments[0];
    const events = shipment.events || [];

    return {
      trackingNumber: shipment.shipmentTrackingNumber,
      status: this.mapDHLStatus(shipment.status),
      currentLocation: events[0]?.location?.address?.addressLocality || "Unknown",
      estimatedDelivery: shipment.estimatedDeliveryDateAndTime,
      events: events.map((event) => ({
        status: this.mapDHLStatus(event.typeCode),
        location: event.location?.address?.addressLocality || "Unknown",
        timestamp: new Date(event.timestamp),
        description: event.description,
      })),
    };
  }

  mapDHLStatus(dhlStatus) {
    const statusMap = {
      "pre-transit": "pending",
      "transit": "in_transit",
      "delivered": "delivered",
      "exception": "delayed",
      "unknown": "pending",
    };
    return statusMap[dhlStatus?.toLowerCase()] || "pending";
  }

  // Calculate rates with additional fees for real shipment data
  async calculateRatesWithFees(shipmentData, additionalFees = 0) {
    console.log('🔍 [DHL] Starting rate calculation with data:', {
      origin: shipmentData.origin,
      destination: shipmentData.destination,
      weight: shipmentData.weight,
      dimensions: shipmentData.dimensions,
      additionalFees
    });

    // Check if DHL API credentials are configured
    if (!this.clientId || !this.clientSecret || !this.accountNumber) {
      console.warn('⚠️ [DHL] API credentials not configured, using dynamic fallback rates');
      return this.generateDynamicFallbackRates(shipmentData, additionalFees);
    }

    try {
      const rates = await this.calculateRates(shipmentData);
      
      if (rates && rates.length > 0) {
        console.log('✅ [DHL] Successfully calculated real API rates:', rates.length, 'rates');
        return rates.map(rate => ({
          ...rate,
          originalBaseRate: rate.baseRate,
          additionalFees: additionalFees,
          totalRate: rate.baseRate + additionalFees,
          currency: rate.currency || "GBP",
          isLive: true
        }));
      }
      
      console.warn('⚠️ [DHL] API returned no rates, using dynamic fallback');
      return this.generateDynamicFallbackRates(shipmentData, additionalFees);
    } catch (error) {
      console.error("❌ [DHL] API error, using dynamic fallback:", error.message);
      return this.generateDynamicFallbackRates(shipmentData, additionalFees);
    }
  }

  // Generate dynamic fallback rates based on shipment parameters
  generateDynamicFallbackRates(shipmentData, additionalFees = 0) {
    const { weight, dimensions, origin, destination } = shipmentData;
    
    // Calculate base rate using weight and dimensions
    const volumeWeight = (dimensions.length * dimensions.width * dimensions.height) / 5000; // DHL volumetric formula
    const chargeableWeight = Math.max(weight, volumeWeight);
    
    // Base rate calculation (simplified but dynamic)
    let baseRate = 25.00; // Starting rate
    baseRate += chargeableWeight * 2.50; // Per kg rate
    
    // Distance factor (simplified)
    const isInternational = this.isInternational(shipmentData);
    if (isInternational) {
      baseRate *= 1.8; // International multiplier
    }
    
    // Country-specific adjustments
    const destCountryCode = this.getCountryCode(destination.country);
    const countryMultipliers = {
      'US': 1.5,
      'AU': 1.7,
      'DE': 1.2,
      'FR': 1.2,
      'GB': 1.0
    };
    baseRate *= (countryMultipliers[destCountryCode] || 1.3);
    
    // Round to 2 decimal places
    baseRate = Math.round(baseRate * 100) / 100;
    
    console.log('📊 [DHL] Generated dynamic fallback rate:', {
      weight,
      volumeWeight: Math.round(volumeWeight * 100) / 100,
      chargeableWeight,
      isInternational,
      baseRate,
      totalRate: baseRate + additionalFees
    });

    return [{
      service: "DHL Express (Estimated)",
      serviceCode: "P",
      originalBaseRate: baseRate,
      baseRate: baseRate,
      additionalFees: additionalFees,
      totalRate: baseRate + additionalFees,
      currency: "GBP",
      deliveryTime: isInternational ? "2-4 business days" : "1-2 business days",
      isApiFallback: true,
      isDynamic: true
    }];
  }

  // Apply markup and additional fees to DHL rates
  applyMarkupAndFees(baseRate, additionalFees = 0, markupPercentage = 0) {
    const markedUpRate = baseRate * (1 + markupPercentage / 100);
    return markedUpRate + additionalFees;
  }
}

module.exports = new DHLService();
