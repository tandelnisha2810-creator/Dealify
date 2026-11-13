# BuyHatke - Price Comparison App

A modern price comparison application with Python-powered scraping and hybrid product matching.

## 🏗️ Architecture

- **Frontend**: React.js with Tailwind CSS
- **Backend**: Node.js/Express with MongoDB
- **Scraping**: Python FastAPI service with Playwright
- **Matching**: Hybrid algorithm (exact → similar fallback)

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- Python 3.8+
- MongoDB

### 1. Setup Python Scraper

```bash
# Navigate to Python scraper directory
cd python-scraper

# Setup dependencies and browsers
python setup.py

# Or manually:
pip install -r requirements.txt
playwright install chromium
```

### 2. Start Services

```bash
# From project root directory

# Option 1: Start all services together
npm run dev-full

# Option 2: Start services individually
# Terminal 1: Python scraper
npm run python-scraper

# Terminal 2: Node.js backend
npm run server

# Terminal 3: React frontend
npm start
```

### 3. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Python Scraper**: http://localhost:8000

## 🔍 Product Matching System

### Hybrid Matching Algorithm

1. **Exact Match** (type: "exact"):
   - Extracts version numbers (e.g., "16" from "iPhone 16")
   - Filters products with matching versions
   - Requires all keywords present

2. **Similar Match** (type: "similar"):
   - Removes version numbers
   - Uses fuzzy string matching
   - Falls back when exact matches unavailable

### Examples

```bash
# Exact match
Query: "iPhone 16 Pro Max"
Result: iPhone 16 Pro Max variants

# Similar match
Query: "iPhone 17" (doesn't exist)
Result: iPhone 15 Pro, iPhone 14 Pro Max, etc.
```

## 📡 API Endpoints

### Node.js Backend

#### GET /api/search?q={query}

Search for products with hybrid matching.

**Response:**
```json
{
  "success": true,
  "type": "exact",
  "product": {
    "title": "Apple iPhone 16 Pro Max",
    "image": "...",
    "brand": "Apple"
  },
  "comparison": [
    {
      "platform": "Amazon",
      "price": "₹1,44,900",
      "rating": "4.5",
      "link": "..."
    }
  ],
  "bestDeal": {...},
  "foundOnPlatforms": 3,
  "totalScraped": 12
}
```

### Python Scraper Service

#### POST /search

**Request:**
```json
{
  "query": "iPhone 16"
}
```

**Response:**
```json
{
  "type": "exact",
  "products": [
    {
      "platform": "Amazon",
      "title": "Apple iPhone 16 Pro Max",
      "price": "₹1,44,900",
      "rating": "4.5",
      "link": "...",
      "image": "..."
    }
  ]
}
```

## 🛠️ Development

### Project Structure

```
dealify/
├── python-scraper/          # Python scraping service
│   ├── app.py              # FastAPI application
│   ├── scraper.py          # Playwright scrapers
│   ├── matcher.py          # Matching algorithms
│   ├── requirements.txt    # Python dependencies
│   └── README.md
├── server/                 # Node.js backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── utils/
├── src/                    # React frontend
│   ├── components/
│   └── ...
├── package.json
└── README.md
```

### Environment Variables

Create `.env` file in server directory:

```env
MONGODB_URI=mongodb://localhost:27017/dealify
PYTHON_SCRAPER_URL=http://localhost:8000
```

### Testing

```bash
# Test Python scraper directly
curl -X POST "http://localhost:8000/search" \
     -H "Content-Type: application/json" \
     -d '{"query": "iPhone 16"}'

# Test full application
curl "http://localhost:5000/api/search?q=iPhone+16"
```

## 🔧 Troubleshooting

### Python Scraper Issues

1. **Browser not found**:
   ```bash
   cd python-scraper
   playwright install chromium
   ```

2. **Port conflicts**:
   - Python scraper: Change port in `app.py`
   - Update `PYTHON_SCRAPER_URL` in Node.js `.env`

3. **Scraping timeouts**:
   - Increase timeout in `scraper.py`
   - Check network connectivity

### Node.js Backend Issues

1. **Python service unavailable**:
   ```bash
   # Check if Python service is running
   curl http://localhost:8000/health
   ```

2. **MongoDB connection**:
   ```bash
   # Start MongoDB
   mongod
   ```

### Common Errors

- **"Python scraper service is not available"**: Start Python service first
- **Empty results**: Check scraper logs for platform failures
- **Slow responses**: Scraping timeouts or network issues

## 🚀 Production Deployment

### Docker Setup

```dockerfile
# Python scraper
FROM python:3.11-slim
WORKDIR /app/python-scraper
COPY python-scraper/requirements.txt .
RUN pip install -r requirements.txt
RUN playwright install chromium
COPY python-scraper/ .
EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]

# Node.js backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "run", "server"]
```

### Environment Configuration

```env
# Production environment
NODE_ENV=production
MONGODB_URI=mongodb://production-db:27017/dealify
PYTHON_SCRAPER_URL=http://python-scraper:8000
```

## 📈 Performance Optimization

### Scraping Optimizations

- **Parallel execution**: All platforms scraped simultaneously
- **Smart timeouts**: 30s per platform with early termination
- **Browser reuse**: Single browser instance per platform
- **Error isolation**: Platform failures don't affect others

### Caching Strategy

- **Database caching**: 6-hour cache for search results
- **Memory optimization**: Limit products per platform (5 max)
- **Background updates**: Cron jobs for cache refresh

## 🤝 Contributing

1. **Python Scraper**: Add new platforms in `scraper.py`
2. **Matching Algorithm**: Improve logic in `matcher.py`
3. **Frontend**: Update components in `src/`
4. **Backend**: Modify controllers in `server/`

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review service logs
3. Test individual components
4. Check network connectivity

---

**Happy price comparing! 🛒**
