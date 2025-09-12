// Real-time DHL rate calculation for shipment forms
class RealTimeRates {
  constructor() {
    this.debounceTimer = null;
    this.currentRequest = null;
    this.ratesContainer = null;
    this.loadingIndicator = null;
  }

  // Initialize rate calculation for a form
  init(formId, ratesContainerId) {
    this.ratesContainer = document.getElementById(ratesContainerId);
    this.setupFormListeners(formId);
    this.createLoadingIndicator();
  }

  // Setup event listeners on form fields
  setupFormListeners(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    const fields = [
      'senderAddress', 'senderCity', 'senderPostalCode', 'senderCountry',
      'receiverAddress', 'receiverCity', 'receiverPostalCode', 'receiverCountry',
      'weight', 'length', 'width', 'height', 'packageType', 'declaredValue'
    ];

    fields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.addEventListener('input', () => this.debounceCalculateRates());
        field.addEventListener('change', () => this.debounceCalculateRates());
      }
    });
  }

  // Debounce rate calculations to avoid too many API calls
  debounceCalculateRates() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.calculateRates();
    }, 1000); // Wait 1 second after user stops typing
  }

  // Create loading indicator
  createLoadingIndicator() {
    this.loadingIndicator = document.createElement('div');
    this.loadingIndicator.className = 'rate-loading';
    this.loadingIndicator.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <div class="spinner-border text-primary" role="status">
          <span class="sr-only">Loading rates...</span>
        </div>
        <div style="margin-top: 10px; color: #6b7280;">Calculating DHL rates...</div>
      </div>
    `;
    this.loadingIndicator.style.display = 'none';
  }

  // Get form data for rate calculation
  getFormData() {
    const getData = (id) => {
      const element = document.getElementById(id);
      return element ? element.value.trim() : '';
    };

    const senderAddress = getData('senderAddress');
    const senderCity = getData('senderCity');
    const senderPostalCode = getData('senderPostalCode');
    const senderCountry = getData('senderCountry');

    const receiverAddress = getData('receiverAddress');
    const receiverCity = getData('receiverCity');
    const receiverPostalCode = getData('receiverPostalCode');
    const receiverCountry = getData('receiverCountry');

    const weight = getData('weight');
    const length = getData('length');
    const width = getData('width');
    const height = getData('height');
    const packageType = getData('packageType');
    const declaredValue = getData('declaredValue');

    // Validate required fields
    if (!senderCity || !senderPostalCode || !senderCountry ||
        !receiverCity || !receiverPostalCode || !receiverCountry ||
        !weight || !length || !width || !height) {
      return null;
    }

    return {
      from: `${senderCity}, ${senderPostalCode}, ${senderCountry}`,
      to: `${receiverCity}, ${receiverPostalCode}, ${receiverCountry}`,
      weight: parseFloat(weight),
      length: parseFloat(length),
      width: parseFloat(width),
      height: parseFloat(height),
      packageType: packageType || 'medium_box',
      declaredValue: parseFloat(declaredValue) || 100
    };
  }

  // Calculate rates via API
  async calculateRates() {
    const formData = this.getFormData();
    if (!formData || !this.ratesContainer) {
      this.clearRates();
      return;
    }

    // Cancel previous request
    if (this.currentRequest) {
      this.currentRequest.abort();
    }

    // Show loading
    this.showLoading();

    try {
      const controller = new AbortController();
      this.currentRequest = controller;

      const params = new URLSearchParams(formData);
      const response = await fetch(`/api/shipping-rates?${params}`, {
        signal: controller.signal
      });

      const data = await response.json();

      if (data.success && data.rates.dhl) {
        this.displayRates(data.rates.dhl);
      } else {
        this.showError(data.message || 'Unable to calculate rates');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Rate calculation error:', error);
        this.showError('Error calculating rates. Please try again.');
      }
    } finally {
      this.hideLoading();
      this.currentRequest = null;
    }
  }

  // Display calculated rates
  displayRates(dhlRates) {
    if (!Array.isArray(dhlRates) || dhlRates.length === 0) {
      this.showError('No rates available');
      return;
    }

    const ratesHtml = dhlRates.map(rate => {
      const isAvailable = !rate.error;
      const statusBadge = rate.isApiFallback ? 
        '<span class="badge badge-warning">Fallback Rate</span>' :
        '<span class="badge badge-success">Live Rate</span>';

      return `
        <div class="rate-option ${isAvailable ? 'available' : 'unavailable'}" 
             data-service="${rate.serviceCode}" 
             data-rate="${rate.totalRate}"
             ${isAvailable ? 'onclick="selectRate(this)"' : ''}>
          <div class="rate-header">
            <div class="rate-service">
              <i class="fas fa-shipping-fast text-danger"></i>
              <span>${rate.service}</span>
              ${statusBadge}
            </div>
            <div class="rate-price">
              ${isAvailable ? `£${rate.totalRate.toFixed(2)}` : 'Unavailable'}
            </div>
          </div>
          ${isAvailable ? `
            <div class="rate-details">
              <div class="rate-breakdown">
                <small>API Rate: £${rate.originalBaseRate.toFixed(2)} + Fees: £${rate.additionalFees.toFixed(2)}</small>
              </div>
              <div class="rate-delivery">
                <i class="fas fa-clock"></i>
                <span>${rate.deliveryTime || '1-2 business days'}</span>
              </div>
            </div>
          ` : `
            <div class="rate-error">
              <small class="text-danger">${rate.error}</small>
            </div>
          `}
        </div>
      `;
    }).join('');

    this.ratesContainer.innerHTML = `
      <div class="rates-section">
        <h4 class="rates-title">
          <i class="fas fa-calculator"></i>
          Available Shipping Rates
        </h4>
        <div class="rates-list">
          ${ratesHtml}
        </div>
      </div>
    `;
  }

  // Show loading state
  showLoading() {
    if (this.ratesContainer && this.loadingIndicator) {
      this.ratesContainer.innerHTML = '';
      this.ratesContainer.appendChild(this.loadingIndicator);
      this.loadingIndicator.style.display = 'block';
    }
  }

  // Hide loading state
  hideLoading() {
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = 'none';
    }
  }

  // Show error message
  showError(message) {
    if (this.ratesContainer) {
      this.ratesContainer.innerHTML = `
        <div class="rates-error">
          <div class="alert alert-warning">
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
          </div>
        </div>
      `;
    }
  }

  // Clear rates display
  clearRates() {
    if (this.ratesContainer) {
      this.ratesContainer.innerHTML = `
        <div class="rates-placeholder">
          <div class="text-center text-muted">
            <i class="fas fa-info-circle"></i>
            <p>Fill in shipment details to see live DHL rates</p>
          </div>
        </div>
      `;
    }
  }
}

// Global function to select a rate
function selectRate(element) {
  // Remove previous selections
  document.querySelectorAll('.rate-option').forEach(el => {
    el.classList.remove('selected');
  });

  // Select current rate
  element.classList.add('selected');

  // Store selected rate data
  const service = element.dataset.service;
  const rate = element.dataset.rate;
  
  // Update hidden form fields or trigger next step
  const selectedRateInput = document.getElementById('selectedRate');
  const selectedServiceInput = document.getElementById('selectedService');
  
  if (selectedRateInput) selectedRateInput.value = rate;
  if (selectedServiceInput) selectedServiceInput.value = service;

  // Enable next step button
  const nextButton = document.getElementById('nextStepButton');
  if (nextButton) {
    nextButton.disabled = false;
    nextButton.classList.remove('btn-secondary');
    nextButton.classList.add('btn-primary');
  }

  // Show selection feedback
  const feedback = document.getElementById('rateFeedback');
  if (feedback) {
    feedback.innerHTML = `
      <div class="alert alert-success">
        <i class="fas fa-check-circle"></i>
        Selected: ${element.querySelector('.rate-service span').textContent} - £${parseFloat(rate).toFixed(2)}
      </div>
    `;
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Auto-initialize if elements exist
  if (document.getElementById('shipmentForm') && document.getElementById('ratesContainer')) {
    window.realTimeRates = new RealTimeRates();
    window.realTimeRates.init('shipmentForm', 'ratesContainer');
  }
  
  if (document.getElementById('shipmentDetailsForm') && document.getElementById('ratesDisplay')) {
    window.realTimeRates = new RealTimeRates();
    window.realTimeRates.init('shipmentDetailsForm', 'ratesDisplay');
  }
});
