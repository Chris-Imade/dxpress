# Payment Integration Details

This document outlines the payment integration details for the project, focusing on Stripe and PayPal.

## Overview

The application uses a `paymentService` to handle payment processing, which supports both Stripe and PayPal. The service abstracts the core payment logic, such as creating and completing payments, and provides a common interface for different payment providers.

## Code Pattern and Approach

### Backend

-   **`services/paymentService.js`**: This is the central hub for payment logic. It initializes the payment providers (Stripe and PayPal) and exposes two main functions:
    -   `initiatePayment`: Creates a payment intent or order.
    -   `completePayment`: Confirms and finalizes the payment.

    ```javascript
    // services/paymentService.js

    const paymentProviders = {
      stripe: {
        createPaymentIntent: async (amount, currency, metadata) => {
          // ... Stripe payment intent creation
        },
        confirmPayment: async (paymentIntentId) => {
          // ... Stripe payment confirmation
        },
      },
      paypal: {
        createOrder: async (amount, currency, description) => {
          // ... PayPal order creation
        },
        captureOrder: async (orderId) => {
          // ... PayPal order capture
        },
      },
    };

    exports.initiatePayment = async (provider, paymentDetails) => {
      // ... routes to the correct provider
    };

    exports.completePayment = async (provider, completionDetails) => {
      // ... routes to the correct provider
    };
    ```

-   **`routes/api.js`**: This file defines the API endpoints for handling payments. It includes routes for creating shipments, creating payments, and completing payments.

    ```javascript
    // routes/api.js

    // Create a payment
    router.post("/payments/create", async (req, res) => {
      // ... logic to create payment intent for Stripe or PayPal
    });

    // Complete payment
    router.post("/payments/complete", async (req, res) => {
      // ... logic to complete payment for Stripe or PayPal
    });
    ```

-   **Stripe Integration**:
    -   The Stripe client is initialized using the `STRIPE_SECRET_KEY` from the environment variables.
    -   When a payment is initiated with Stripe, a `PaymentIntent` is created on the backend. The `client_secret` from this intent is then sent to the frontend to be used with Stripe.js.

-   **PayPal Integration**:
    -   PayPal payments are handled using a hosted button. The `PAYPAL_HOSTED_BUTTON_ID` is used to render the PayPal button on the frontend.
    -   The backend creates a placeholder payment intent and verifies the order upon completion.

### Frontend

-   **`views/shipment/create-shipment.ejs`**: This is the main view for creating a shipment and handling payments. It includes a multi-step form that guides the user through the process.
    -   **Step 3 (Payment)**: This step allows the user to select between Stripe and PayPal.
        -   If **Stripe** is selected, a Stripe Elements form is dynamically mounted to the page. The form is initialized with the `client_secret` obtained from the backend.
        -   If **PayPal** is selected, the PayPal hosted button is rendered. The button is configured with the `PAYPAL_HOSTED_BUTTON_ID`.

    ```html
    <!-- views/shipment/create-shipment.ejs -->

    <!-- Stripe Payment Form -->
    <div id="stripePaymentForm">
      <div id="stripe-payment-element"></div>
    </div>

    <!-- PayPal Payment Form -->
    <div id="paypalPaymentForm" style="display: none">
      <script src="https://www.paypal.com/sdk/js?client-id=<%= process.env.PAYPAL_CLIENT_ID %>&components=hosted-buttons&disable-funding=venmo&currency=GBP"></script>
      <div class="paypal-container w-100"></div>
    </div>
    ```

## Environment Variables

The following environment variables are required for payment processing:

```
STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_HOSTED_BUTTON_ID=your_paypal_hosted_button_id
```

## NPM Packages

The following npm packages are used for payment integration:

-   **`stripe`**: The official Stripe Node.js library.
-   **`@paypal/checkout-server-sdk`**: The official PayPal Checkout Server SDK.

```json
// package.json
"dependencies": {
  "stripe": "^18.1.0",
  // ... other dependencies
}
```

## Frontend Logic

-   The frontend uses JavaScript to manage the multi-step form, handle user interactions, and communicate with the backend API.
-   When the user selects a shipping rate, the total amount is calculated and displayed.
-   When the user proceeds to payment, the selected payment method (Stripe or PayPal) is displayed.
-   **Stripe**:
    -   The Stripe.js library is loaded from `https://js.stripe.com/v3/`.
    -   A `PaymentElement` is created and mounted to the page.
    -   When the user clicks "Pay Now," the frontend calls `stripe.confirmPayment` to complete the payment.

    ```javascript
    // views/shipment/create-shipment.ejs (script section)

    // Initialize Stripe
    const stripe = Stripe('your_stripe_public_key');

    // Create and mount the Payment Element
    const elements = stripe.elements({ clientSecret });
    const paymentElement = elements.create('payment');
    paymentElement.mount('#stripe-payment-element');

    // Handle payment submission
    submitButton.addEventListener('click', async () => {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: 'your_return_url',
        },
      });
      // ... handle error or success
    });
    ```

-   **PayPal**:
    -   The PayPal JavaScript SDK is loaded.
    -   A hosted button is rendered, which handles the payment flow.

    ```javascript
    // views/shipment/create-shipment.ejs (script section)

    paypal.HostedButtons({
      hostedButtonId: 'your_hosted_button_id',
      // ... other options
    }).render('.paypal-container');
    ```

This setup provides a robust and flexible payment system that supports two major payment providers while maintaining a clean separation of concerns between the frontend and backend.
