# BuyHatke Python Scraper Service

A robust Python-based scraping service using Playwright for reliable product data extraction from e-commerce platforms.

## Features

- 🚀 **FastAPI-based API** for easy integration
- 🎭 **Playwright-powered scraping** for dynamic websites
- 🔍 **Hybrid product matching** (exact → similar fallback)
- 📊 **Multi-platform support**: Amazon, Flipkart, Ajio, Myntra, Reliance Digital
- ⚡ **Parallel scraping** for improved performance
- 🛡️ **Error handling** with graceful fallbacks

## Setup

### Prerequisites

- Python 3.8+
- Node.js (for integration with existing app)

### Installation

1. **Clone and navigate to the directory:**
   ```bash
   cd python-scraper
   ```

2. **Run setup script:**
   ```bash
   python setup.py
   ```

   This will:
   - Install Python dependencies
   - Install Playwright browsers

### Manual Setup (Alternative)

```bash
# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium
```

## Usage

### Start the Service

```bash
# Option 1: Direct Python execution
python app.py

# Option 2: With uvicorn (recommended for production)
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

The service will start on `http://localhost:8000`

### API Endpoints

#### POST /search

Search for products across all platforms.

**Request:**
```json
{
  "query": "iphone 16 pro max"
}
```

**Response:**
```json
{
  "type": "exact",
  "products": [
    {
      "platform": "Amazon",
      "title": "Apple iPhone 16 Pro Max (256GB) - Black Titanium",
      "price": "₹1,44,900",
      "rating": "4.5",
      "link": "https://www.amazon.in/...",
      "image": "https://..."
    }
  ]
}
```

#### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy"
}
```

## Integration with Node.js Backend

Update your Node.js backend to call the Python service instead of the current scraping logic.

### Example Integration

```javascript
// In your searchController.js
const axios = require('axios');

const searchProducts = async (req, res) => {
  const { q } = req.query;

  try {
    // Call Python scraper service
    const response = await axios.post('http://localhost:8000/search', {
      query: q
    });

    const { type, products } = response.data;

    // Process the response as before
    // ... existing logic ...

  } catch (error) {
    console.error('Python scraper error:', error);
    // Fallback logic
  }
};
```

## Product Matching Logic

### Hybrid Matching System

1. **Exact Match** (type: "exact"):
   - Extracts version numbers (e.g., "16" from "iPhone 16")
   - Filters products containing matching versions
   - Requires all keywords to be present

2. **Similar Match** (type: "similar"):
   - Removes version numbers from both query and product titles
   - Uses fuzzy string matching on base keywords
   - Falls back when no exact matches found

### Examples

- Query: "iPhone 16" → Exact match: "iPhone 16 Pro"
- Query: "iPhone 17" → Similar match: "iPhone 15 Pro", "iPhone 14 Pro Max"

## Configuration

### Scraping Settings

- **Timeout**: 30 seconds per platform
- **Max products per platform**: 5
- **Parallel execution**: All platforms scraped simultaneously

### Matching Thresholds

- **Exact match**: Score ≥ 90
- **Similar match**: Fuzzy similarity > 0.4 + keyword overlap

## Error Handling

- **Platform failures**: Continues with other platforms
- **Network timeouts**: Returns empty results for failed platforms
- **Parsing errors**: Skips malformed products
- **No matches**: Returns empty products array with "similar" type

## Development

### Project Structure

```
python-scraper/
├── app.py              # FastAPI application
├── scraper.py          # Playwright scraping logic
├── matcher.py          # Product matching algorithms
├── setup.py           # Setup script
├── requirements.txt    # Python dependencies
└── README.md          # This file
```

### Testing the API

```bash
# Test exact match
curl -X POST "http://localhost:8000/search" \
     -H "Content-Type: application/json" \
     -d '{"query": "iPhone 16"}'

# Test similar match
curl -X POST "http://localhost:8000/search" \
     -H "Content-Type: application/json" \
     -d '{"query": "iPhone 17"}'

# Health check
curl http://localhost:8000/health
```

## Troubleshooting

### Common Issues

1. **Playwright browser not found**:
   ```bash
   playwright install chromium
   ```

2. **Port already in use**:
   ```bash
   lsof -i :8000  # Find process
   kill -9 <PID>  # Kill process
   ```

3. **Scraping blocked**:
   - Service uses realistic user agents
   - Implements random delays between requests
   - May need proxy rotation for production

### Logs

Check console output for detailed scraping and matching logs:
- Platform-specific success/failure messages
- Product extraction details
- Matching algorithm decisions

## Production Deployment

### Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Install Playwright browsers
RUN playwright install chromium

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables

```bash
export PYTHONPATH=/app
export PLAYWRIGHT_BROWSERS_PATH=/app/browsers  # Custom browser path
```

## License

This project is part of the BuyHatke application suite.