/**
 * Shipping Rate Calculator Service
 * Calculates shipping rates from multiple carriers based on shipment details
 */

// Mock carrier API handlers - in production these would connect to real carrier APIs
const carrierHandlers = {
  DHL: async (shipmentDetails) => {
    // In production: Call the DHL API to get real rates
    // This is a mock implementation
    const baseRate = 15.99;
    const weightFactor = shipmentDetails.weight * 0.5;
    const distanceFactor = 5; // Would be calculated based on origin/destination

    return {
      carrier: "DHL",
      rates: [
        {
          serviceLevel: "Express",
          cost: baseRate + weightFactor + distanceFactor + 10,
          estimatedDays: 1,
          selected: false,
        },
        {
          serviceLevel: "Standard",
          cost: baseRate + weightFactor + distanceFactor,
          estimatedDays: 3,
          selected: false,
        },
      ],
    };
  },

  FedEx: async (shipmentDetails) => {
    // In production: Call the FedEx API to get real rates
    // This is a mock implementation
    const baseRate = 17.5;
    const weightFactor = shipmentDetails.weight * 0.6;
    const distanceFactor = 4.5; // Would be calculated based on origin/destination

    return {
      carrier: "FedEx",
      rates: [
        {
          serviceLevel: "Priority Overnight",
          cost: baseRate + weightFactor + distanceFactor + 15,
          estimatedDays: 1,
          selected: false,
        },
        {
          serviceLevel: "2Day",
          cost: baseRate + weightFactor + distanceFactor + 5,
          estimatedDays: 2,
          selected: false,
        },
        {
          serviceLevel: "Ground",
          cost: baseRate + weightFactor + distanceFactor,
          estimatedDays: 4,
          selected: false,
        },
      ],
    };
  },

  UPS: async (shipmentDetails) => {
    // In production: Call the UPS API to get real rates
    // This is a mock implementation
    const baseRate = 16.75;
    const weightFactor = shipmentDetails.weight * 0.55;
    const distanceFactor = 5; // Would be calculated based on origin/destination

    return {
      carrier: "UPS",
      rates: [
        {
          serviceLevel: "Next Day Air",
          cost: baseRate + weightFactor + distanceFactor + 12,
          estimatedDays: 1,
          selected: false,
        },
        {
          serviceLevel: "Ground",
          cost: baseRate + weightFactor + distanceFactor,
          estimatedDays: 3,
          selected: false,
        },
      ],
    };
  },

  USPS: async (shipmentDetails) => {
    // In production: Call the USPS API to get real rates
    // This is a mock implementation
    const baseRate = 13.99;
    const weightFactor = shipmentDetails.weight * 0.45;
    const distanceFactor = 3; // Would be calculated based on origin/destination

    return {
      carrier: "USPS",
      rates: [
        {
          serviceLevel: "Priority Mail Express",
          cost: baseRate + weightFactor + distanceFactor + 8,
          estimatedDays: 1,
          selected: false,
        },
        {
          serviceLevel: "Priority Mail",
          cost: baseRate + weightFactor + distanceFactor + 3,
          estimatedDays: 2,
          selected: false,
        },
        {
          serviceLevel: "First-Class Package",
          cost: baseRate + weightFactor + distanceFactor,
          estimatedDays: 5,
          selected: false,
        },
      ],
    };
  },
};

/**
 * Calculate shipping rates from multiple carriers
 * @param {Object} shipmentDetails - Details about the shipment
 * @returns {Promise<Array>} Array of shipping rates from different carriers
 */
exports.calculateRates = async (shipmentDetails) => {
  try {
    // Validate input
    if (!shipmentDetails || !shipmentDetails.weight) {
      throw new Error(
        "Shipment details are required with at least weight specified"
      );
    }

    // Get list of carriers to query (default to all supported carriers)
    const carriers = shipmentDetails.carriers || [
      "DHL",
      "FedEx",
      "UPS",
      "USPS",
    ];

    // Get rates from each carrier in parallel
    const ratePromises = carriers.map((carrier) => {
      if (!carrierHandlers[carrier]) {
        console.warn(`No handler for carrier: ${carrier}`);
        return null;
      }
      return carrierHandlers[carrier](shipmentDetails);
    });

    // Wait for all carrier APIs to respond
    const results = await Promise.all(ratePromises);

    // Flatten results into a single array of rates
    let allRates = [];
    results
      .filter((result) => result !== null)
      .forEach((result) => {
        result.rates.forEach((rate) => {
          allRates.push({
            carrier: result.carrier,
            serviceLevel: rate.serviceLevel,
            cost: rate.cost,
            estimatedDays: rate.estimatedDays,
            selected: rate.selected,
          });
        });
      });

    // Sort rates by cost (lowest first)
    allRates.sort((a, b) => a.cost - b.cost);

    // Mark the cheapest rate as selected by default
    if (allRates.length > 0) {
      allRates[0].selected = true;
    }

    return allRates;
  } catch (error) {
    console.error("Error calculating shipping rates:", error);
    throw error;
  }
};

/**
 * Estimate delivery date based on service level
 * @param {Number} estimatedDays - Estimated delivery time in days
 * @returns {Date} Estimated delivery date
 */
exports.estimateDeliveryDate = (estimatedDays) => {
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + estimatedDays);

  // Skip weekends (simple implementation)
  const day = deliveryDate.getDay();
  if (day === 0) {
    // Sunday
    deliveryDate.setDate(deliveryDate.getDate() + 1);
  } else if (day === 6) {
    // Saturday
    deliveryDate.setDate(deliveryDate.getDate() + 2);
  }

  return deliveryDate;
};
