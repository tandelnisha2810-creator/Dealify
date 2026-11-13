#!/usr/bin/env node

const axios = require('axios');

async function testSystem() {
    console.log('=== BuyHatke Product Search System Test ===\n');

    // Test 1: Check Python Scraper Health
    console.log('1. Testing Python Scraper Service (/health)...');
    try {
        const healthRes = await axios.get('http://localhost:8000/health', { timeout: 5000 });
        console.log('✓ Python Scraper Service is running');
        console.log('  Response:', JSON.stringify(healthRes.data, null, 2));
    } catch (err) {
        console.log('✗ Python Scraper Service not responding:', err.message);
        return;
    }

    // Test 2: Test Python Scraper Search
    console.log('\n2. Testing Python Scraper Search (/search?query=iPhone+16)...');
    try {
        const searchRes = await axios.get('http://localhost:8000/search?query=iPhone+16', { timeout: 10000 });
        console.log('✓ Python Scraper returned results');
        console.log('  Type:', searchRes.data.type);
        console.log('  Products found:', searchRes.data.products.length);
        searchRes.data.products.slice(0, 2).forEach((p, i) => {
            console.log(`  ${i+1}. ${p.title} (${p.platform}) - ${p.price}`);
        });
    } catch (err) {
        console.log('✗ Python Scraper search failed:', err.message);
    }

    // Test 3: Check Node Backend Health
    console.log('\n3. Testing Node Backend (/api/search/health)...');
    try {
        const backendHealth = await axios.get('http://localhost:5000/api/search/health', { timeout: 5000 });
        console.log('✓ Node Backend is running');
        console.log('  Response:', JSON.stringify(backendHealth.data, null, 2));
    } catch (err) {
        console.log('✗ Node Backend not responding:', err.message);
        console.log('  Make sure to run: npm run server');
        return;
    }

    // Test 4: Test Node Backend Search
    console.log('\n4. Testing Node Backend Search (/api/search?q=iPhone+16)...');
    try {
        const backendSearch = await axios.get('http://localhost:5000/api/search?q=iPhone+16', { timeout: 10000 });
        console.log('✓ Node Backend returned results');
        console.log('  Type:', backendSearch.data.type);
        console.log('  Products found:', backendSearch.data.products.length);
        backendSearch.data.products.slice(0, 2).forEach((p, i) => {
            console.log(`  ${i+1}. ${p.title} (${p.platform}) - ${p.price}`);
        });
    } catch (err) {
        console.log('✗ Node Backend search failed:', err.message);
    }

    console.log('\n=== Test Complete ===');
}

testSystem().catch(console.error);
