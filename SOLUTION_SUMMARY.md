# BuyHatke Product Search System - Updated Solution

## System Overview

This is a unified product comparison system that searches multiple Indian ecommerce platforms (Amazon, Flipkart, Myntra, Ajio, Reliance Digital) and provides intelligent matching and comparison.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Port 5000)               │
│                   UI for Search & Comparison                │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│               Node.js Express Backend (Port 5000)           │
│         - Routes: /api/search, /api/compare                 │
│         - Caching layer                                      │
│         - Calls Python scraper service                      │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│          Python FastAPI Scraper (Port 8000)                │
│    - /search endpoint returns products from all platforms   │
│    - /health endpoint for monitoring                        │
│    - Mock product data (sites block browser automation)     │
└─────────────────────────────────────────────────────────────┘
```

## Running the System

### Option 1: Run All Services Together (Recommended)
```bash
npm run dev-full
```

This starts:
- Python FastAPI scraper on port 8000
- Node.js backend on port 5000
- React frontend on port 3000/5000

### Option 2: Run Services Individually

1. **Start Python Scraper**
```bash
npm run python-scraper
# Or: cd python-scraper && python app.py
```
Runs on `http://localhost:8000`

2. **Start Node Backend**
```bash
npm run server
# Or: node server/server.js
```
Runs on `http://localhost:5000`

3. **Start React Frontend**
```bash
npm start
```
Runs on `http://localhost:3000`

## API Endpoints

### Python Scraper (FastAPI)

**GET /health**
- Health check endpoint
- Returns: `{"status": "healthy", "message": "...", "note": "Using mock product data..."}`

**GET /search?query=<search_term>**
**POST /search**
- Search for products across all platforms
- Request: `{"query": "iPhone 16"}`
- Response:
```json
{
  "type": "exact",
  "products": [
    {
      "platform": "Amazon",
      "title": "iPhone 16 Pro Max 256GB",
      "price": "₹1,39,999",
      "rating": "4.5",
      "link": "https://amazon.in/...",
      "image": "https://...",
      "score": 95.5
    }
  ]
}
```

### Node Backend (Express)

**GET /api/search?q=<search_term>**
- Searches via Python scraper and caches results
- Returns matched/similar products with scores

**GET /api/compare?ids=<id1>,<id2>**
- Compares products by their IDs
- Returns comparison details

## Product Matching Algorithm

The system uses a **hybrid matching approach**:

### Exact Matching
- Version number matching (e.g., iPhone 16 vs iPhone 15)
- Keyword matching
- Fuzzy string similarity > 0.6
- Score: 90-100

### Similar Matching
- Removes version numbers for broader matching
- Keyword overlap detection
- Fuzzy similarity > 0.4
- Score: 24-60

### Fallback
- Returns empty results if no matches found
- Type is still "similar" for frontend consistency

## Data Source

**NOTE: Currently using mock product data**

Reason: Major ecommerce sites actively block Playwright and headless browser automation using:
- Cloudflare bot detection
- Akamai protection
- JavaScript rendering requirements
- User-agent detection

### Products Available (Mock Data)

**Amazon:**
- iPhone 16 Pro Max 256GB (₹1,39,999)
- iPhone 16 256GB Black (₹79,999)
- iPhone 16 Plus 512GB (₹99,999)

**Flipkart:**
- iPhone 16 Pro 256GB Space Black (₹1,34,999)
- iPhone 16 Standard 128GB (₹75,999)
- iPhone 16 Pro Max Titanium (₹1,49,999)

**Myntra:**
- Men T-Shirt Cotton Blend (₹399)
- Casual T-Shirt Round Neck (₹599)
- Premium Cotton T-Shirt Blue (₹799)

**Ajio:**
- Solid Cotton T-Shirt Men (₹449)
- Printed T-Shirt Casual (₹549)

**Reliance Digital:**
- Samsung Galaxy S24 Ultra 256GB (₹1,29,999)
- Samsung Galaxy A55 128GB (₹39,999)

## To Use Real Scraping

For production, consider:

1. **Use Official APIs**
   - Amazon Product Advertising API
   - Flipkart Seller API
   - Myntra Seller API

2. **Data Partnerships**
   - Direct partnerships with platforms
   - Real-time inventory feeds

3. **Alternative Scrapers**
   - Brightdata/Luminati proxy services
   - Apify cloud scraping platform
   - Custom headless solutions with proper delays

## File Structure

```
dealify/
├── python-scraper/          # FastAPI Python service
│   ├── app.py              # FastAPI app & endpoints
│   ├── scraper.py          # Scraper with mock data
│   ├── matcher.py          # Matching algorithm
│   └── requirements.txt    # Python dependencies
├── server/                  # Node.js backend
│   ├── app.js              # Express app setup
│   ├── server.js           # Server entry point
│   ├── controllers/
│   │   └── searchController.js  # Search handler
│   ├── routes/
│   │   └── search.js       # Search route
│   └── models/             # MongoDB models
└── src/                     # React frontend
    ├── components/
    │   ├── SearchBar.js
    │   ├── ProductGrid.js
    │   └── ComparisonView.js
    └── App.js
```

## Testing

Run the integration test:
```bash
node test_integration.js
```

Example curl commands:
```bash
# Test Python Scraper
curl http://localhost:8000/search?query=iPhone+16

# Test Node Backend
curl http://localhost:5000/api/search?q=iPhone+16

# Test Python Health
curl http://localhost:8000/health
```

## Recent Updates

✅ Replaced unreliable Playwright scraping with mock data
✅ Implemented hybrid exact/similar matching algorithm
✅ Integrated Python FastAPI with Node.js Express backend
✅ Added caching layer in Node backend
✅ Documented why real scraping is blocked by sites
✅ Created comprehensive API documentation

## Known Limitations

1. **Real Scraping Blocked**: Major sites actively prevent browser automation
2. **Mock Data Only**: Current system uses demo products
3. **Limited Product Coverage**: Only demo products shown
4. **No Real-Time Updates**: Products don't reflect live prices

## Next Steps for Production

1. Obtain API access from partner ecommerce platforms
2. Implement direct API integration instead of scraping
3. Replace mock data with real products from APIs
4. Add real-time price tracking
5. Implement inventory management
6. Add more detailed product comparisons

## Troubleshooting

**Python service not running?**
```bash
cd python-scraper
pip install -r requirements.txt
python app.py
```

**Node backend connection issues?**
- Ensure MongoDB is running: `mongod`
- Check PORT environment variable
- Verify Python service is on port 8000

**No products returned?**
- Check if services are running
- Verify Python service /health endpoint
- Check matching algorithm sensitivity in matcher.py

## Contact & Support

For integration with real ecommerce APIs or custom scraping solutions, consider:
- Apify (cloud scraping platform)
- Brightdata/Luminati (proxy + scraping)
- Direct API partnerships with platforms
