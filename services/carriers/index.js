const DHLService = require("./dhl");
const FedExService = require("./fedex");
const UPSService = require("./ups");

class CarrierServiceManager {
  constructor() {
    // Initialize carriers - FedEx is now the primary carrier
    this.carriers = {};

    // FedEx - Primary carrier
    if (process.env.FEDEX_API_KEY && process.env.FEDEX_API_SECRET) {
      this.carriers.fedex = new FedExService(
        process.env.FEDEX_API_KEY,
        process.env.FEDEX_API_SECRET,
        process.env.FEDEX_ACCOUNT_NUMBER
      );
      console.log("✅ FedEx service initialized (Primary Carrier)");
    } else {
      console.warn("⚠️  FedEx credentials not found - using mock data");
    }

    // DHL - Disabled for now (commented out in .env)
    // if (process.env.DHL_CLIENT_ID && process.env.DHL_CLIENT_SECRET) {
    //   this.carriers.dhl = new DHLService(
    //     process.env.DHL_CLIENT_ID,
    //     process.env.DHL_CLIENT_SECRET
    //   );
    // }

    // UPS - Disabled for now (commented out in .env)
    // if (process.env.UPS_API_KEY && process.env.UPS_API_SECRET) {
    //   this.carriers.ups = new UPSService(
    //     process.env.UPS_API_KEY,
    //     process.env.UPS_API_SECRET
    //   );
    // }

    // Log available carriers
    console.log("Available carriers:", Object.keys(this.carriers));
    if (Object.keys(this.carriers).length === 0) {
      console.warn("⚠️  No carrier services initialized - will use mock data");
    }
  }

  async calculateRates(
    origin,
    destination,
    weight,
    dimensions,
    selectedCarriers = ["fedex"] // FedEx only by default
  ) {
    try {
      // Filter out carriers that aren't initialized
      const availableCarriers = selectedCarriers.filter(
        (carrier) => this.carriers[carrier.toLowerCase()]
      );

      if (availableCarriers.length === 0) {
        throw new Error(
          "No carriers available with valid API keys. Please configure FedEx API credentials."
        );
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

      // If no rates were successfully retrieved, throw error
      if (rates.length === 0) {
        throw new Error("No shipping rates available. All carrier services failed to respond.");
      }

      return rates;
    } catch (error) {
      console.error("Error calculating rates:", error);
      throw new Error(`Failed to calculate shipping rates: ${error.message}`);
    }
  }


  /**
   * Validate address using FedEx service
   */
  async validateAddress(address) {
    if (this.carriers.fedex) {
      return await this.carriers.fedex.validateAddress(address);
    }
    
    // Return mock validation if FedEx not available
    return {
      isValid: true,
      formattedAddress: address,
      classification: 'UNKNOWN',
      confidence: 'NOT_VALIDATED'
    };
  }

  /**
   * Track shipment using appropriate carrier
   */
  async trackShipment(trackingNumber, carrier = 'fedex') {
    const carrierService = this.carriers[carrier.toLowerCase()];
    
    if (!carrierService) {
      throw new Error(`Carrier ${carrier} not available`);
    }

    if (typeof carrierService.trackShipment === 'function') {
      return await carrierService.trackShipment(trackingNumber);
    }
    
    throw new Error(`Tracking not supported for carrier ${carrier}`);
  }

  /**
   * Create shipment using appropriate carrier
   */
  async createShipment(shipmentData, carrier = 'fedex') {
    const carrierService = this.carriers[carrier.toLowerCase()];
    
    if (!carrierService) {
      throw new Error(`Carrier ${carrier} not available`);
    }

    if (typeof carrierService.createShipment === 'function') {
      return await carrierService.createShipment(shipmentData);
    }
    
    throw new Error(`Shipment creation not supported for carrier ${carrier}`);
  }
}

module.exports = new CarrierServiceManager();
