require('dotenv').config();
const dhlService = require('./services/dhlService');

async function testDHLAPI() {
  console.log('🧪 Testing DHL API Integration...\n');
  
  // Check environment variables
  console.log('📋 Environment Check:');
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`DHL_CLIENT_ID: ${process.env.DHL_CLIENT_ID ? process.env.DHL_CLIENT_ID.substring(0, 8) + '...' : 'NOT SET'}`);
  console.log(`DHL_CLIENT_SECRET: ${process.env.DHL_CLIENT_SECRET ? 'SET' : 'NOT SET'}`);
  console.log(`DHL_ACCOUNT_NUMBER: ${process.env.DHL_ACCOUNT_NUMBER ? process.env.DHL_ACCOUNT_NUMBER.substring(0, 6) + '...' : 'NOT SET'}`);
  console.log('');
  
  try {
    // Test 1: DHL Express MyDHL API Authentication
    console.log('🔐 Test 1: DHL Express MyDHL API Authentication');
    const authResult = await dhlService.testAuthentication();
    console.log('✅ Authentication successful!');
    console.log('Auth result:', authResult);
    console.log('');
    
    // Test 2: Rate calculation with sample data
    console.log('💰 Test 2: Rate Calculation');
    const sampleShipment = {
      senderAddress: {
        street: '123 Main St',
        city: 'New York',
        postalCode: '10001',
        country: 'US'
      },
      recipientAddress: {
        street: '456 Oak Ave',
        city: 'Los Angeles',
        postalCode: '90210',
        country: 'US'
      },
      packageDetails: {
        weight: 2.5,
        length: 30,
        width: 20,
        height: 15
      }
    };
    
    const rates = await dhlService.calculateRatesWithFees(sampleShipment);
    console.log('✅ Rate calculation successful!');
    console.log(`Found ${rates.length} rate(s):`);
    rates.forEach((rate, index) => {
      console.log(`  ${index + 1}. ${rate.serviceName}: $${rate.totalRate} (${rate.isLive ? 'LIVE' : 'ESTIMATED'})`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testDHLAPI();
