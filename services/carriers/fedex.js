const axios = require("axios");

class FedExService {
  constructor(apiKey, apiSecret) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl =
      process.env.FEDEX_API_URL ||
      "https://apis.fedex.com/rate/v1/rates/quotes";
  }

  async calculateRates(origin, destination, weight, dimensions) {
    try {
      const response = await axios.post(
        this.baseUrl,
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
            requestedPackageLineItems: [
              {
                weight: {
                  value: weight,
                  units: "KG",
                },
                dimensions: {
                  length: dimensions.length,
                  width: dimensions.width,
                  height: dimensions.height,
                  units: "CM",
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
      console.error("FedEx API Error:", error);
      throw new Error("Failed to calculate FedEx rates");
    }
  }

  formatRates(data) {
    return data.output.rateReplyDetails.map((rate) => ({
      carrier: "FedEx",
      serviceLevel: rate.serviceName,
      cost: parseFloat(rate.ratedShipmentDetails[0].totalNetCharge.amount),
      currency: rate.ratedShipmentDetails[0].totalNetCharge.currency,
      estimatedDays: parseInt(rate.commitDetails.dateDetail.deliveryDate),
      selected: false,
    }));
  }
}

module.exports = FedExService;
