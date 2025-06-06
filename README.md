# DXpress MVC - Shipping and Logistics Platform

A comprehensive shipping and logistics platform built with Node.js, Express, and MongoDB, featuring multi-carrier shipping rate comparison, payment integration, and real-time tracking.

## Implemented Features

### 1. Home Page

- Modern, responsive design with sections:
  - Banner section (Transport & Logistics)
  - Transport way section
  - About section
  - Team section (with team member profiles)
  - Pricing Plan section (with shipping plans)
  - FAQ section (common shipping questions)
  - Contact Us section (two-part layout)
  - Newsletter subscription section

### 2. Navigation

- Responsive navigation with two layouts:
  - nav-home.ejs (for homepage)
  - nav-other.ejs (for other pages)
- Create Shipment link in navigation
- About Us section
- Opening Hours display

### 3. Admin Panel

- Secure authentication system
- Dashboard with key metrics:
  - Total shipments
  - Pending shipments
  - Delivered shipments
  - Newsletter subscribers
  - Contact inquiries
- Shipment Management:
  - Create new shipments
  - Edit existing shipments
  - Delete shipments
  - Track shipment status
  - Search and filter shipments
- Newsletter Management:
  - View subscribers
  - Export subscribers to CSV
  - Delete subscribers
- User Management:
  - Role-based access control (Admin/Staff)
  - User authentication
  - Password reset functionality

### 4. Newsletter System

- Email subscription form
- Welcome email for new subscribers
- Unsubscribe functionality
- Admin management interface
- CSV export capability
- Email templates for:
  - Welcome messages
  - Unsubscribe confirmations

### 5. Franchise System

- Dedicated franchise page with:
  - Hero section with call-to-action
  - Why Choose Dxpress Franchise section
  - Investment Requirements section
  - Franchise Process section
  - Contact CTA section
- Comprehensive franchise information:
  - Initial investment details
  - Ongoing fees
  - Support and training
  - Business model benefits

### 6. Create Shipment Process

- Multi-step form with progress indicator:
  1. Shipment Details
  2. Compare Rates
  3. Payment
  4. Confirmation
- Interactive step navigation
- Visual progress tracking
- Email notifications for:
  - Shipment creation
  - Status updates
  - Delivery confirmation

### 7. Carrier Integration (In Progress)

Planning integration with:

- DHL Express API
  - Rate API
  - Shipment API
  - Tracking API
  - Address Validation API
- FedEx REST API
- UPS REST API

### 8. Payment Integration (In Progress)

Planning integration with:

- Stripe
- PayPal

## Technical Stack

### Frontend

- EJS templating engine
- Bootstrap framework
- Custom CSS
- JavaScript for interactivity
- Responsive design
- Modern UI components

### Backend

- Node.js
- Express.js framework
- MongoDB database
- Email service integration
- Authentication system
- Role-based access control

## Project Structure

```
dxpress-mvc/
├── config/             # Configuration files
├── controllers/        # Route controllers
├── middleware/         # Custom middleware
├── models/            # Database models
├── public/            # Static files
│   ├── css/          # Stylesheets
│   ├── js/           # Client-side scripts
│   └── images/       # Image assets
├── routes/            # Route definitions
├── views/             # EJS templates
│   ├── admin/        # Admin panel views
│   ├── layouts/      # Layout templates
│   └── partials/     # Reusable components
├── .env.example      # Environment variables template
├── app.js            # Main application file
└── package.json      # Project dependencies
```

## Installation

1. Clone the repository

```bash
git clone [repository-url]
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables

```bash
cp .env.example .env
```

4. Configure the following in your .env file:

```env
# Database
MONGODB_URI=your_mongodb_uri

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USERNAME=your_email
EMAIL_PASSWORD=your_app_password

# Admin Configuration
ADMIN_EMAIL=your_admin_email
ADMIN_PASSWORD=your_admin_password

# Carrier APIs
DHL_API_KEY=your_dhl_api_key
DHL_ACCOUNT_NUMBER=your_dhl_account
DHL_SITE_ID=your_dhl_site_id
DHL_PASSWORD=your_dhl_password

FEDEX_CLIENT_ID=your_fedex_client_id
FEDEX_CLIENT_SECRET=your_fedex_client_secret
FEDEX_ACCOUNT_NUMBER=your_fedex_account
FEDEX_METER_NUMBER=your_fedex_meter

UPS_CLIENT_ID=your_ups_client_id
UPS_CLIENT_SECRET=your_ups_client_secret
UPS_ACCOUNT_NUMBER=your_ups_account
UPS_ACCESS_KEY=your_ups_access_key

# Payment Processing
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLIC_KEY=your_stripe_public_key
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
```

5. Start the development server

```bash
npm run dev
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Features

### 1. Home Page

- Modern, responsive design
- Key sections:
  - Banner section
  - Transport way section
  - About section
  - Team section
  - Pricing Plan section
  - FAQ section
  - Contact section

### 2. Shipment Creation

- Multi-step form process:
  1. Shipment Details
     - Customer information
     - Origin address
     - Destination address
     - Package details
     - Insurance options
  2. Rate Comparison
     - Real-time rates from multiple carriers
     - DHL Express
     - FedEx
     - UPS
     - Visual comparison of delivery times and prices
  3. Payment Processing
     - Multiple payment options
       - Stripe integration
       - PayPal integration
     - Secure payment processing
  4. Confirmation
     - Shipment details
     - Tracking information
     - Receipt generation

### 3. Carrier Integration

#### DHL Express API

- Rate API for shipping quotes
- Shipment API for label generation
- Tracking API for shipment status
- Address Validation API

#### FedEx REST API

- Rate API
- Ship API
- Track API
- Address Validation API

#### UPS REST API

- Rating API
- Shipping API
- Tracking API
- Address Validation API

### 4. Payment Integration

- Stripe payment processing
- PayPal payment processing
- Secure transaction handling
- Payment status tracking

## Technical Stack

### Frontend

- EJS templating engine
- Bootstrap for responsive design
- Custom CSS with modern design patterns
- JavaScript for interactive features

### Backend

- Node.js
- Express.js framework
- MongoDB database
- RESTful API architecture

### Security

- User authentication
- Payment data encryption
- Secure API handling
- Input validation

## Installation

1. Clone the repository

```bash
git clone [repository-url]
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables

```bash
cp .env.example .env
```

4. Configure the following in your .env file:

Database
MONGODB_URI=your_mongodb_uri
Carrier APIs
DHL_API_KEY=your_dhl_api_key
DHL_ACCOUNT_NUMBER=your_dhl_account
DHL_SITE_ID=your_dhl_site_id
DHL_PASSWORD=your_dhl_password
FEDEX_CLIENT_ID=your_fedex_client_id
FEDEX_CLIENT_SECRET=your_fedex_client_secret
FEDEX_ACCOUNT_NUMBER=your_fedex_account
FEDEX_METER_NUMBER=your_fedex_meter
UPS_CLIENT_ID=your_ups_client_id
UPS_CLIENT_SECRET=your_ups_client_secret
UPS_ACCOUNT_NUMBER=your_ups_account
UPS_ACCESS_KEY=your_ups_access_key
Payment Processing
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLIC_KEY=your_stripe_public_key
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
Apply to README.md
Creation
POST /api/shipments/create
Apply to README.md
.
This README provides a comprehensive overview of the project, including:
Features implemented
Technical stack
Installation instructions
API documentation
Carrier integration details
Payment processing setup
Contributing guidelines
Would you like me to expand on any particular section or add additional information?

5. Start the development server

```bash
npm run dev
```

## API Documentation

### Shipment Creation

````
Creates a new shipment and processes payment

Request Body:
```json
{
  "customer": {
    "name": "string",
    "email": "string",
    "phone": "string"
  },
  "origin": {
    "address": "string",
    "city": "string",
    "postalCode": "string",
    "country": "string"
  },
  "destination": {
    "address": "string",
    "city": "string",
    "postalCode": "string",
    "country": "string"
  },
  "package": {
    "type": "string",
    "weight": "number",
    "dimensions": {
      "length": "number",
      "width": "number",
      "height": "number"
    },
    "isFragile": "boolean",
    "insuranceRequired": "boolean",
    "declaredValue": "number"
  },
  "shipping": {
    "carrier": "string",
    "service": "string",
    "rate": "number"
  },
  "payment": {
    "method": "string",
    "details": "object"
  }
}
````

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Next Steps

1. Complete shipment creation functionality
2. Implement carrier API integrations
3. Set up payment processing
4. Add shipment tracking features

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables (create .env file)
4. Start the development server:

```bash
npm start
```

## Contributing

Please contact the project maintainers for contribution guidelines.

## License

This project is licensed under the MIT License.
