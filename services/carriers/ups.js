const axios = require("axios");

class UPSService {
  constructor(apiKey, apiSecret) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl =
      process.env.UPS_API_URL || "https://onlinetools.ups.com/api/rating/v1";
  }

  async calculateRates(origin, destination, weight, dimensions) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/rates`,
        {
          RateRequest: {
            Shipper: {
              Address: {
                CountryCode: origin.countryCode,
                PostalCode: origin.postalCode,
              },
            },
            ShipTo: {
              Address: {
                CountryCode: destination.countryCode,
                PostalCode: destination.postalCode,
              },
            },
            Package: {
              PackageWeight: {
                UnitOfMeasurement: {
                  Code: "KGS",
                },
                Weight: weight,
              },
              Dimensions: {
                UnitOfMeasurement: {
                  Code: "CM",
                },
                Length: dimensions.length,
                Width: dimensions.width,
                Height: dimensions.height,
              },
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return this.formatRates(response.data);
    } catch (error) {
      console.error("UPS API Error:", error);
      throw new Error("Failed to calculate UPS rates");
    }
  }

  formatRates(data) {
    return data.RateResponse.RatedShipment.map((shipment) => ({
      carrier: "UPS",
      serviceLevel: shipment.Service.Code,
      cost: parseFloat(shipment.TotalCharges.MonetaryValue),
      currency: shipment.TotalCharges.CurrencyCode,
      estimatedDays: parseInt(shipment.GuaranteedDelivery.Days),
      selected: false,
    }));
  }
}

module.exports = UPSService;
