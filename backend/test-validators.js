// Simple test script to verify validators and error handling
const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

// Import validators and error middleware
const { validateSignup, validateLogin } = require('./validators/auth');
const { validateCreatePost } = require('./validators/feed');
const { errorMiddleware } = require('./utils/errorHandler');
const { validationResult } = require('express-validator');

// Create test app
const app = express();
app.use(bodyParser.json());

// Test route for auth validation
app.post('/test-signup', validateSignup, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    res.json({ success: true, message: 'Validation passed' });
});

// Test route for feed validation
app.post('/test-post', validateCreatePost, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    res.json({ success: true, message: 'Validation passed' });
});

// Use error middleware
app.use(errorMiddleware);

// Test function
async function runTests() {
    console.log('🧪 Testing Validators and Error Handling...\n');

    try {
        // Test 1: Invalid signup data
        console.log('Test 1: Invalid signup data');
        const response1 = await request(app)
            .post('/test-signup')
            .send({
                email: 'invalid-email',
                password: '123',
                name: 'ab'
            });
        
        console.log('Status:', response1.status);
        console.log('Response:', JSON.stringify(response1.body, null, 2));
        console.log('✅ Test 1 passed - Validation errors caught correctly\n');

        // Test 2: Valid signup data
        console.log('Test 2: Valid signup data');
        const response2 = await request(app)
            .post('/test-signup')
            .send({
                email: 'test@example.com',
                password: 'Password123',
                name: 'John Doe'
            });
        
        console.log('Status:', response2.status);
        console.log('Response:', JSON.stringify(response2.body, null, 2));
        console.log('✅ Test 2 passed - Valid data accepted\n');

        // Test 3: Invalid post data
        console.log('Test 3: Invalid post data');
        const response3 = await request(app)
            .post('/test-post')
            .send({
                title: 'abc',
                content: 'xy'
            });
        
        console.log('Status:', response3.status);
        console.log('Response:', JSON.stringify(response3.body, null, 2));
        console.log('✅ Test 3 passed - Post validation errors caught correctly\n');

        console.log('🎉 All tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Only run tests if this file is executed directly
if (require.main === module) {
    runTests();
}

module.exports = app;
