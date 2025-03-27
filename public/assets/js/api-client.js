/**
 * DXPress API Client
 * A JavaScript client for interacting with the DXPress API
 */

class DXPressAPI {
  constructor(apiKey, baseUrl = "/api") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Make an API request with appropriate headers
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {object} data - Request body data
   * @returns {Promise} - Response promise
   */
  async request(endpoint, method = "GET", data = null) {
    const url = `${this.baseUrl}${endpoint}`;

    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": this.apiKey,
      },
    };

    if (data && (method === "POST" || method === "PUT")) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "API request failed");
      }

      return result;
    } catch (error) {
      console.error("API request error:", error);
      throw error;
    }
  }

  /**
   * Calculate shipping rates
   * @param {object} shipmentDetails - Shipment details
   * @returns {Promise} - Shipping rates
   */
  calculateRates(shipmentDetails) {
    return this.request("/shipments/calculate-rates", "POST", shipmentDetails);
  }

  /**
   * Create a new shipment
   * @param {object} shipmentData - Shipment data
   * @returns {Promise} - Shipment creation result
   */
  createShipment(shipmentData) {
    return this.request("/shipments", "POST", shipmentData);
  }

  /**
   * Get shipment details by ID or tracking number
   * @param {string} id - Shipment ID or tracking number
   * @returns {Promise} - Shipment details
   */
  getShipment(id) {
    return this.request(`/shipments/${id}`);
  }

  /**
   * Track a shipment
   * @param {string} trackingId - Tracking ID
   * @returns {Promise} - Tracking information
   */
  trackShipment(trackingId) {
    return this.request(`/tracking/${trackingId}`);
  }

  /**
   * List shipments with optional filtering
   * @param {object} params - Query parameters
   * @returns {Promise} - List of shipments
   */
  listShipments(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/shipments${queryString ? "?" + queryString : ""}`);
  }

  /**
   * Create a payment for a shipment
   * @param {object} paymentData - Payment data
   * @returns {Promise} - Payment initiation result
   */
  createPayment(paymentData) {
    return this.request("/payments/create", "POST", paymentData);
  }

  /**
   * Complete a payment
   * @param {object} paymentData - Payment completion data
   * @returns {Promise} - Payment completion result
   */
  completePayment(paymentData) {
    return this.request("/payments/complete", "POST", paymentData);
  }

  /**
   * Get payment details
   * @param {string} paymentId - Payment ID
   * @returns {Promise} - Payment details
   */
  getPayment(paymentId) {
    return this.request(`/payments/${paymentId}`);
  }
}

// Example usage:
// const dxpressApi = new DXPressAPI('your-api-key');
//
// // Calculate shipping rates
// dxpressApi.calculateRates({
//   origin: '123 Sender St, New York, NY',
//   destination: '456 Receiver Ave, Los Angeles, CA',
//   weight: 5,
//   dimensions: { length: 10, width: 8, height: 6 },
//   packageType: 'Parcel'
// }).then(result => {
//   console.log('Available rates:', result.data.rates);
// }).catch(error => {
//   console.error('Error calculating rates:', error);
// });
//
// // Create shipment
// dxpressApi.createShipment({
//   customerName: 'John Doe',
//   customerEmail: 'john@example.com',
//   origin: '123 Sender St, New York, NY',
//   destination: '456 Receiver Ave, Los Angeles, CA',
//   weight: 5,
//   dimensions: { length: 10, width: 8, height: 6 },
//   packageType: 'Parcel',
//   selectedRate: {
//     carrier: 'DHL',
//     serviceLevel: 'Express',
//     cost: 25.50,
//     estimatedDays: 2
//   }
// }).then(result => {
//   console.log('Shipment created:', result.data);
// });
