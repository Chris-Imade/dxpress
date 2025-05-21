const DHLService = require("./dhl");
const FedExService = require("./fedex");
const UPSService = require("./ups");

class CarrierServiceManager {
  constructor() {
    // Initialize carriers only if API keys are available
    this.carriers = {};

    if (process.env.DHL_API_KEY && process.env.DHL_API_SECRET) {
      this.carriers.dhl = new DHLService(
        process.env.DHL_API_KEY,
        process.env.DHL_API_SECRET
      );
    }

    if (process.env.FEDEX_API_KEY && process.env.FEDEX_API_SECRET) {
      this.carriers.fedex = new FedExService(
        process.env.FEDEX_API_KEY,
        process.env.FEDEX_API_SECRET
      );
    }

    if (process.env.UPS_API_KEY && process.env.UPS_API_SECRET) {
      this.carriers.ups = new UPSService(
        process.env.UPS_API_KEY,
        process.env.UPS_API_SECRET
      );
    }

    // Log available carriers
    console.log("Available carriers:", Object.keys(this.carriers));
  }

  async calculateRates(
    origin,
    destination,
    weight,
    dimensions,
    selectedCarriers = ["dhl", "fedex", "ups"]
  ) {
    try {
      // Filter out carriers that aren't initialized
      const availableCarriers = selectedCarriers.filter(
        (carrier) => this.carriers[carrier.toLowerCase()]
      );

      if (availableCarriers.length === 0) {
        console.warn(
          "No carriers available with valid API keys. Using mock data."
        );
        return this.getMockRates();
      }

      const ratePromises = availableCarriers.map((carrier) =>
        this.carriers[carrier.toLowerCase()].calculateRates(
          origin,
          destination,
          weight,
          dimensions
        )
      );

      const results = await Promise.allSettled(ratePromises);
      const rates = [];

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          rates.push(...result.value);
        } else {
          console.error(
            `Failed to get rates from ${availableCarriers[index]}:`,
            result.reason
          );
        }
      });

      // If no rates were successfully retrieved, return mock data
      if (rates.length === 0) {
        console.warn("No rates retrieved from carriers. Using mock data.");
        return this.getMockRates();
      }

      return rates;
    } catch (error) {
      console.error("Error calculating rates:", error);
      return this.getMockRates();
    }
  }

  // Mock rates for development/testing
  getMockRates() {
    return [
      {
        carrier: "DHL",
        serviceLevel: "Express",
        cost: 45.99,
        currency: "GBP",
        estimatedDays: 2,
        selected: false,
      },
      {
        carrier: "FedEx",
        serviceLevel: "Standard",
        cost: 35.5,
        currency: "GBP",
        estimatedDays: 3,
        selected: false,
      },
      {
        carrier: "UPS",
        serviceLevel: "Express Saver",
        cost: 40.75,
        currency: "GBP",
        estimatedDays: 2,
        selected: false,
      },
    ];
  }
}

module.exports = new CarrierServiceManager();
