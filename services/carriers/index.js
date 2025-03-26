const DHLService = require("./dhl");
const FedExService = require("./fedex");
const UPSService = require("./ups");

class CarrierServiceManager {
  constructor() {
    this.carriers = {
      dhl: new DHLService(process.env.DHL_API_KEY, process.env.DHL_API_SECRET),
      fedex: new FedExService(
        process.env.FEDEX_API_KEY,
        process.env.FEDEX_API_SECRET
      ),
      ups: new UPSService(process.env.UPS_API_KEY, process.env.UPS_API_SECRET),
    };
  }

  async calculateRates(
    origin,
    destination,
    weight,
    dimensions,
    selectedCarriers = ["dhl", "fedex", "ups"]
  ) {
    try {
      const ratePromises = selectedCarriers.map((carrier) =>
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
            `Failed to get rates from ${selectedCarriers[index]}:`,
            result.reason
          );
        }
      });

      return rates;
    } catch (error) {
      console.error("Error calculating rates:", error);
      throw new Error("Failed to calculate shipping rates");
    }
  }
}

module.exports = new CarrierServiceManager();
