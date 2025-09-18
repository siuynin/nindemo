const axios = require('axios');

// Test PayPal API with sandbox credentials
const API_BASE_URL = 'http://localhost:8001/api';

// Test user data
const testUser = {
    name: 'Test User PayPal',
    email: 'testpaypal' + Date.now() + '@example.com',
    password: 'password123',
    password_confirmation: 'password123'
};

let authToken = null;

// Function to register and login user
async function registerAndLogin() {
    try {
        console.log('🔐 Registering test user...');
        const registerResponse = await axios.post(`${API_BASE_URL}/register`, testUser);
        console.log('✅ User registered successfully');
        
        console.log('🔑 Logging in...');
        const loginResponse = await axios.post(`${API_BASE_URL}/login`, {
            email: testUser.email,
            password: testUser.password
        });
        
        authToken = loginResponse.data.data.token;
        console.log('✅ Login successful, token acquired');
        
        return authToken;
    } catch (error) {
        if (error.response?.status === 422 && error.response?.data?.message?.includes('email')) {
            // User already exists, try to login
            console.log('👤 User already exists, logging in...');
            const loginResponse = await axios.post(`${API_BASE_URL}/login`, {
                email: testUser.email,
                password: testUser.password
            });
            
            authToken = loginResponse.data.data.token;
            console.log('✅ Login successful, token acquired');
            return authToken;
        }
        throw error;
    }
}

// Test PayPal create order
async function testCreatePayPalOrder() {
    try {
        console.log('\n💳 Testing PayPal create order...');
        
        const orderData = {
            plan_id: 1,
            amount: 10.00,
            currency: 'USD',
            description: 'Test PayPal Order'
        };
        
        const response = await axios.post(`${API_BASE_URL}/paypal/create-order`, orderData, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ PayPal order created successfully!');
        console.log('📋 Full Response:', JSON.stringify(response.data, null, 2));
        
        const orderId = response.data.id;
        const approvalUrl = response.data.links?.find(link => link.rel === 'approve')?.href;
        
        console.log('🆔 Order ID:', orderId);
        console.log('🔗 Approval URL:', approvalUrl);
        
        return { orderId, approvalUrl };
        
    } catch (error) {
        console.error('❌ PayPal create order failed:');
        console.error('Status:', error.response?.status);
        console.error('Data:', error.response?.data);
        throw error;
    }
}

// Test PayPal capture order (simulate)
async function testCapturePayPalOrder(orderId) {
    try {
        console.log('\n💰 Testing PayPal capture order...');
        
        const response = await axios.post(`${API_BASE_URL}/paypal/capture-order`, {
            order_id: orderId
        }, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ PayPal order captured successfully!');
        console.log('📋 Capture Response:', JSON.stringify(response.data, null, 2));
        
        return response.data;
        
    } catch (error) {
        console.error('❌ PayPal capture order failed:');
        console.error('Status:', error.response?.status);
        console.error('Data:', error.response?.data);
        // Don't throw error for capture as it might require actual PayPal approval
        console.log('ℹ️  Note: Capture might fail in sandbox without actual approval');
    }
}

// Main test function
async function runPayPalTests() {
    try {
        console.log('🚀 Starting PayPal API Tests...');
        console.log('=' .repeat(50));
        
        // Step 1: Register and login
        await registerAndLogin();
        
        // Step 2: Test create order
        const { orderId, approvalUrl } = await testCreatePayPalOrder();
        
        if (orderId) {
            // Step 3: Test capture order (will likely fail without approval)
            await testCapturePayPalOrder(orderId);
        }
        
        console.log('\n🎉 PayPal API tests completed!');
        console.log('=' .repeat(50));
        
    } catch (error) {
        console.error('\n💥 Test failed with error:');
        console.error(error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        process.exit(1);
    }
}

// Run the tests
runPayPalTests();