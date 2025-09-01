const axios = require("axios");
const ShipmentRate = require("../models/ShipmentRate");

class DHLService {
  constructor() {
    this.baseURL = process.env.DHL_API_BASE_URL || "https://api-eu.dhl.com";
    this.clientId = process.env.DHL_CLIENT_ID;
    this.clientSecret = process.env.DHL_CLIENT_SECRET;
    this.accountNumber = process.env.DHL_ACCOUNT_NUMBER;
    this.pickupAccount = process.env.DHL_PICKUP_ACCOUNT;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // Get OAuth access token
  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/oauth/token`,
        {
          grant_type: "client_credentials",
          client_id: this.clientId,
          client_secret: this.clientSecret,
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000; // Refresh 1 minute early

      return this.accessToken;
    } catch (error) {
      console.error("DHL OAuth Error:", error.response?.data || error.message);
      throw new Error("Failed to authenticate with DHL API");
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
}

module.exports = new DHLService();
