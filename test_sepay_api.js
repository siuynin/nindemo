// Test script for SePay API endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:8000/api';

// Test user data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  password_confirmation: 'password123'
};

// Test data
const testOrder = {
  plan_id: 1,
  amount: 100000,
  currency: 'VND'
};

let authToken = null;

async function registerAndLogin() {
  try {
    console.log('Registering test user...');
    // Try to register user
    await axios.post(`${BASE_URL}/register`, testUser, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    console.log('✅ User registered successfully');
  } catch (error) {
    // User might already exist, that's okay
    console.log('ℹ️ User might already exist, proceeding to login...');
  }

  try {
    console.log('Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      email: testUser.email,
      password: testUser.password
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    authToken = loginResponse.data.data.token;
    console.log('✅ Login successful, token obtained');
    return true;
  } catch (error) {
    console.error('❌ Login failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testCreateOrder() {
  try {
    console.log('Testing SePay Create Order API...');
    const response = await axios.post(`${BASE_URL}/sepay/create-order`, testOrder, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ Create Order Success:');
    console.log('Full Response:', JSON.stringify(response.data, null, 2));
    console.log('Order ID:', response.data.order_id);
    console.log('Bank Info:', response.data.bank_info);
    console.log('QR Code:', response.data.bank_info?.qr_code ? 'Generated' : 'Not generated');
    
    return response.data.order_id;
  } catch (error) {
    console.error('❌ Create Order Failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    console.error('Details:', error.response?.data);
    return null;
  }
}

async function testCheckPayment(orderId) {
  try {
    console.log('\nTesting SePay Check Payment API...');
    const response = await axios.get(`${BASE_URL}/sepay/check-payment/${orderId}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ Check Payment Success:');
    console.log('Payment Status:', response.data.status);
    console.log('Bill Status:', response.data.bill?.status);
    
    return response.data;
  } catch (error) {
    console.error('❌ Check Payment Failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    console.error('Details:', error.response?.data);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting SePay API Tests\n');
  
  // First authenticate
  const authSuccess = await registerAndLogin();
  if (!authSuccess) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }
  
  console.log('\n');
  
  // Test create order
  const orderId = await testCreateOrder();
  
  if (orderId) {
    // Wait a bit then test check payment
    setTimeout(async () => {
      await testCheckPayment(orderId);
      console.log('\n✨ Tests completed!');
    }, 2000);
  } else {
    console.log('\n❌ Cannot proceed with check payment test due to create order failure');
  }
}

// Run the tests
runTests();