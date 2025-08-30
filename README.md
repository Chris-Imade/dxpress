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

### 3. Authentication System

#### Admin Authentication
- Secure admin panel access at `/admin/login`
- Role-based access control (Admin/Staff)
- JWT-based authentication with secure cookies
- Password reset functionality for admin users
- Dashboard with key metrics:
  - Total shipments
  - Pending shipments
  - Delivered shipments
  - Newsletter subscribers
  - Contact inquiries

#### User Authentication
- Modern signup/signin page at `/auth` with toggle functionality
- Beautiful, responsive design with real-time validation
- User registration with email verification
- Password strength requirements and visual feedback
- Forgot password flow with email reset links
- User dashboard at `/dashboard` with:
  - Shipment statistics
  - Quick action buttons
  - Recent shipments overview
  - Profile management

#### Authentication Features
- **Dual Authentication System**: Separate flows for admin and regular users
- **JWT Security**: Secure token-based authentication with HTTP-only cookies
- **Email Integration**: Welcome emails and password reset functionality
- **Real-time Validation**: Client-side form validation with visual feedback
- **Password Security**: Bcrypt hashing with salt rounds and strength requirements
- **Session Management**: Secure session handling with automatic redirects
- **Role-based Routing**: Smart middleware that redirects based on user roles

### 4. Admin Panel

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
  - View registered users
  - Manage user roles and permissions

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
│   └── auth.js        # Authentication controller (admin & user)
├── middleware/         # Custom middleware
│   └── auth.js        # Authentication middleware with role-based routing
├── models/            # Database models
│   └── User.js        # User model (admin, staff, user roles)
├── public/            # Static files
│   ├── css/          # Stylesheets
│   ├── js/           # Client-side scripts
│   └── images/       # Image assets
├── routes/            # Route definitions
│   ├── auth.js       # Authentication routes (/auth)
│   ├── admin.js      # Admin panel routes (/admin)
│   └── user.js       # User dashboard routes (/dashboard)
├── views/             # EJS templates
│   ├── admin/        # Admin panel views
│   ├── auth/         # Authentication views
│   │   ├── signup-signin.ejs    # Modern toggle auth page
│   │   ├── forgot-password.ejs  # Password reset request
│   │   └── reset-password.ejs   # Password reset form
│   ├── user/         # User dashboard views
│   │   └── dashboard.ejs        # User dashboard
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

# Authentication Configuration
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret_key

# Admin Configuration
ADMIN_EMAIL=your_admin_email
ADMIN_PASSWORD=your_admin_password

# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Base URL (for email links)
BASE_URL=http://localhost:3000

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

- **Dual Authentication System**:
  - Admin authentication for backend management
  - User authentication for customer accounts
- **JWT Token Security**: HTTP-only cookies with secure token handling
- **Password Security**: Bcrypt hashing with 12 salt rounds
- **Email Verification**: Welcome emails and password reset flows
- **Role-based Access Control**: Admin, Staff, and User roles
- **Input Validation**: Real-time client-side and server-side validation
- **Session Management**: Secure session handling with automatic cleanup
- **Payment data encryption**
- **Secure API handling**

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

### Authentication Endpoints

#### User Authentication

- `GET /auth` - Modern signup/signin page with toggle functionality
- `POST /auth/login` - User login (returns JSON response)
- `POST /auth/register` - User registration (returns JSON response)
- `GET /auth/forgot-password` - Password reset request page
- `POST /auth/forgot-password` - Send password reset email
- `GET /auth/reset-password/:token` - Password reset form
- `POST /auth/reset-password/:token` - Process password reset
- `GET /auth/logout` - User logout

#### Admin Authentication

- `GET /admin/login` - Admin login page
- `POST /admin/login` - Admin login processing
- `GET /admin/logout` - Admin logout

#### User Dashboard

- `GET /dashboard` - User dashboard (requires authentication)
- `GET /profile` - User profile management (requires authentication)

### Authentication Flows

#### User Registration Flow

1. User visits `/auth` and toggles to signup mode
2. Fills registration form with real-time validation
3. POST to `/auth/register` with form data
4. System validates input and checks for existing users
5. Password is hashed with bcrypt (12 salt rounds)
6. User account created with 'user' role
7. Welcome email sent automatically
8. Success response returned to client
9. User can then sign in

#### User Login Flow

1. User visits `/auth` (signin mode by default)
2. Enters credentials with client-side validation
3. POST to `/auth/login` with credentials
4. System validates credentials and generates JWT
5. JWT stored in HTTP-only cookie
6. Success response with redirect URL
7. User redirected to `/dashboard`

#### Password Reset Flow

1. User clicks "Forgot Password" link
2. Visits `/auth/forgot-password` page
3. Enters email address
4. POST to `/auth/forgot-password`
5. System generates secure reset token
6. Reset email sent with time-limited link
7. User clicks link to visit `/auth/reset-password/:token`
8. Enters new password with validation
9. POST to `/auth/reset-password/:token`
10. Password updated and user can sign in

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
