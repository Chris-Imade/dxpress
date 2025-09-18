const axios = require("axios");

class DHLService {
  constructor(apiKey, apiSecret) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl =
      process.env.DHL_API_SANDBOX_BASE_URL;
  }

  async calculateRates(origin, destination, weight, dimensions) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/rates`,
        {
          requestedShipment: {
            shipper: {
              address: {
                countryCode: origin.countryCode,
                postalCode: origin.postalCode,
              },
            },
            recipient: {
              address: {
                countryCode: destination.countryCode,
                postalCode: destination.postalCode,
              },
            },
            requestedPackages: [
              {
                weight: {
                  value: weight,
                  unit: "KG",
                },
                dimensions: {
                  length: dimensions.length,
                  width: dimensions.width,
                  height: dimensions.height,
                },
              },
            ],
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
      console.error("DHL API Error:", error);
      throw new Error("Failed to calculate DHL rates");
    }
  }

  formatRates(data) {
    return data.rateResponse.provider[0].service.map((service) => ({
      carrier: "DHL",
      serviceLevel: service.name,
      cost: parseFloat(service.totalNet.amount),
      currency: service.totalNet.currency,
      estimatedDays: parseInt(service.deliveryTime.days),
      selected: false,
    }));
  }
}

module.exports = DHLService;
