# BuyHatke - Complete Product Search System

## What Was Fixed

### 1. **Scraper Implementation**
- ✅ Replaced unreliable Playwright-based browser automation with mock product data
- ✅ Sites actively block headless browser access (Flipkart, Myntra, Ajio, Reliance Digital)
- ✅ Created representative mock data for demonstration
- ✅ Implemented proper async/await patterns for Python FastAPI

### 2. **Matching Algorithm**
- ✅ Hybrid exact/similar matching system
- ✅ Version number extraction and matching
- ✅ Keyword-based product matching
- ✅ Fuzzy string similarity scoring
- ✅ Score-based ranking of results

### 3. **Backend Integration**
- ✅ Node.js Express backend correctly calls Python scraper service
- ✅ Caching layer for frequently searched products
- ✅ Proper error handling and status codes
- ✅ Request timeout management
- ✅ Debug mode support

### 4. **API Documentation**
- ✅ Clear endpoint specifications
- ✅ Request/response examples
- ✅ Error handling documentation

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│              FRONTEND (React)                           │
│              http://localhost:3000                      │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│         EXPRESS BACKEND (Node.js)                       │
│         http://localhost:5000                          │
│         - Caching                                       │
│         - Orchestration                                │
│         - Database                                      │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│     FASTAPI PYTHON SCRAPER                             │
│     http://localhost:8000                              │
│     - Product Search (mock data)                        │
│     - Hybrid Matching                                   │
│     - Health Check                                      │
└─────────────────────────────────────────────────────────┘
```

## Getting Started

### Prerequisites
- Node.js 14+
- Python 3.8+
- MongoDB (local or connection string in .env)

### Installation

1. **Install Node dependencies:**
```bash
npm install
```

2. **Set up Python environment:**
```bash
cd python-scraper
pip install -r requirements.txt
cd ..
```

3. **Configure environment:**
Create `.env` file:
```
MONGO_URI=mongodb://localhost:27017/dealify
PYTHON_SCRAPER_URL=http://localhost:8000
PORT=5000
NODE_ENV=development
```

### Running the System

**Option 1: Run Everything (Best for Development)**
```bash
npm run dev-full
```

**Option 2: Run Services Separately**

Terminal 1 - Python Scraper:
```bash
npm run python-scraper
```

Terminal 2 - Node Backend:
```bash
npm run server
```

Terminal 3 - React Frontend:
```bash
npm start
```

## Testing the API

### Python Scraper (Port 8000)

1. **Health Check:**
```bash
curl http://localhost:8000/health
```

2. **Search Endpoint (GET):**
```bash
curl "http://localhost:8000/search?query=iPhone+16"
```

3. **Search Endpoint (POST):**
```bash
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "iPhone 16"}'
```

### Node Backend (Port 5000)

1. **Search Products:**
```bash
curl "http://localhost:5000/api/search?q=iPhone+16"
```

2. **Debug Mode (Shows more details):**
```bash
curl "http://localhost:5000/api/search?q=iPhone+16&debug=true"
```

### React Frontend (Port 3000)

Open browser and navigate to: `http://localhost:3000`

## API Response Example

**Request:**
```bash
curl "http://localhost:8000/search?query=iPhone+16"
```

**Response:**
```json
{
  "type": "exact",
  "products": [
    {
      "platform": "Amazon",
      "title": "iPhone 16 Pro Max 256GB",
      "price": "₹1,39,999",
      "rating": "4.5",
      "link": "https://amazon.in/iPhone-16-Pro",
      "image": "https://via.placeholder.com/200",
      "score": 95.5
    },
    {
      "platform": "Flipkart",
      "title": "Apple iPhone 16 Pro 256GB Space Black",
      "price": "₹1,34,999",
      "rating": "4.5",
      "link": "https://flipkart.com/iPhone-16-Pro",
      "image": "https://via.placeholder.com/200",
      "score": 93.2
    }
  ]
}
```

## Product Database

### Available Mock Products

**Smartphones:**
- iPhone 16 variants (Amazon, Flipkart, Reliance)
- Samsung Galaxy phones (Reliance Digital)

**Fashion:**
- T-Shirts (Myntra, Ajio)
- Various styles and prices

### Searching Tips

1. **Exact Match:** "iPhone 16 Pro Max"
2. **Similar Match:** "iPhone 16" (matches variants)
3. **Category Search:** "T-shirt" or "shirt"
4. **Brand Search:** "Samsung" or "Apple"

## Troubleshooting

### Python Service Issues

**Service won't start:**
```bash
# Check Python installation
python --version

# Verify dependencies
pip install fastapi uvicorn playwright

# Try running directly
cd python-scraper
python app.py
```

**Port 8000 already in use:**
```bash
# Find process using port 8000
netstat -ano | findstr :8000

# Kill process (Windows)
taskkill /PID <PID> /F

# Or use different port
PORT=8001 python python-scraper/app.py
```

### Node Backend Issues

**MongoDB connection failed:**
- Ensure MongoDB is running: `mongod`
- Check MONGO_URI in .env file
- Verify connection string format

**Python service unreachable:**
```
Error: Python scraper service is not available
```
- Confirm Python scraper is running on port 8000
- Check PYTHON_SCRAPER_URL in .env
- Test: `curl http://localhost:8000/health`

### Frontend Issues

**React dev server won't start:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

## Project Structure

```
dealify/
├── python-scraper/
│   ├── app.py                 # FastAPI application
│   ├── scraper.py             # Product scraping logic
│   ├── matcher.py             # Matching algorithm
│   ├── requirements.txt
│   └── setup.py
├── server/
│   ├── app.js                 # Express app
│   ├── server.js              # Entry point
│   ├── controllers/
│   │   ├── searchController.js
│   │   └── compareController.js
│   ├── routes/
│   │   ├── search.js
│   │   └── compare.js
│   ├── models/
│   │   ├── Product.js
│   │   └── PriceHistory.js
│   ├── utils/
│   │   └── matching.js
│   └── cron.js
├── src/
│   ├── App.js
│   ├── App.css
│   ├── components/
│   │   ├── SearchBar.js
│   │   ├── ProductGrid.js
│   │   ├── ComparisonView.js
│   │   └── Header.js
│   └── index.js
├── public/
├── package.json
├── .env
└── README.md
```

## Matching Algorithm Details

### Exact Matching
Returns when:
- Version numbers match (e.g., iPhone 16 matches iPhone 16)
- All query keywords found in product title
- Fuzzy similarity > 0.6
- **Score Range:** 90-100

### Similar Matching
Returns when:
- Version numbers removed for comparison
- Keyword overlap > 0
- Fuzzy similarity > 0.4
- **Score Range:** 24-60

### Fallback
- Returns empty array if no matches
- Frontend shows "No products found" message

## Future Enhancements

1. **Real Data Integration**
   - Connect to ecommerce APIs
   - Real-time price updates
   - Inventory tracking

2. **Advanced Features**
   - Historical price tracking
   - Price alerts
   - Wishlist management
   - Product reviews aggregation

3. **Performance**
   - Redis caching
   - Search indexing
   - Query optimization

4. **Scalability**
   - Microservices architecture
   - Load balancing
   - Horizontal scaling

## Known Limitations

1. **Mock Data Only** - Currently using demo products
2. **No Real-Time Prices** - Static pricing in mock data
3. **Browser Automation Blocked** - Sites actively prevent scraping
4. **Limited Product Coverage** - Only demo products available

## For Production Use

To use real ecommerce data:

1. **Option A: Use Official APIs**
   - Contact ecommerce platforms for API access
   - Implement direct API integrations
   - Maintain data sync

2. **Option B: Data Partnerships**
   - Establish data feed agreements
   - Real-time product feeds
   - Inventory synchronization

3. **Option C: Professional Scraping Service**
   - Apify Cloud Scraping
   - Brightdata/Luminati
   - Custom proxy solutions

## Support & Documentation

- **API Docs:** Visit `http://localhost:8000/docs` (Swagger UI)
- **Backend Routes:** Check `server/routes/`
- **Matching Logic:** See `python-scraper/matcher.py`
- **Product Data:** See `python-scraper/scraper.py` (MOCK_PRODUCTS)

## License

Private project - BuyHatke

## Contact

For questions or integration requests regarding real ecommerce data:
- Implement official API integrations
- Use professional scraping services
- Establish data partnerships
