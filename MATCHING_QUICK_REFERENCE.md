# ⚡ MATCHING LOGIC - QUICK REFERENCE

## 🎯 The Problem (FIXED)
```
Query: "iPhone 17"
❌ OLD: Returns "iPhone 16" (first result, no validation)
✅ NEW: Only returns "iPhone 17" products
```

## 🔧 How It Works

### 3-Step Validation (ALL must pass)
```
1. VERSION CHECK
   Query: "iPhone 17" → Extract: [17]
   Product: "iPhone 17 Pro" → Extract: [17]
   Result: ✓ MATCH

2. KEYWORD CHECK  
   Query: "iPhone Pro" → Keywords: ["iphone", "pro"]
   Product: "Apple iPhone Pro Max" → Has both?
   Result: ✓ MATCH

3. SIMILARITY CHECK
   Normalized Query: "iphone pro"
   Normalized Product: "apple iphone pro max"
   Similarity: 0.85 > 0.40?
   Result: ✓ MATCH
```

## 📋 Key Functions

### `findBestMatch(query, products, debug)`
```javascript
const match = findBestMatch('iPhone 17', products, true);
// Returns: { ...product, score: 92.5 }
// Returns: null if no match
```

### `findMatchesAcrossPlatforms(query, platforms, debug)`
```javascript
const matches = findMatchesAcrossPlatforms('iPhone 17', [
  { platform: 'Amazon', products: [...] },
  { platform: 'Flipkart', products: [...] }
]);
// Returns: [{ platform: 'Amazon', product: {...} }, ...]
```

### `calculateMatchScore(query, productTitle)`
```javascript
const { score, details, reasons } = calculateMatchScore('iPhone 17', 'Apple iPhone 17 Pro');
// score: 92.5 or -1 (rejected)
// details: { queryVersions, productVersions, similarity, reason }
// reasons: ['✓ Version match', '✓ All keywords present', '✓ Fuzzy match']
```

## 🚀 API Examples

### Search (Improved)
```bash
# Basic search
curl "http://localhost:5000/api/search?q=iPhone17"

# Debug mode
curl "http://localhost:5000/api/search?q=iPhone17&debug=true"
```

**Response (Success)**:
```json
{
  "success": true,
  "product": { "title": "...", "image": "...", "brand": "..." },
  "comparison": [
    { "platform": "Amazon", "price": 99999, "rating": 4.8, "score": "92.50" },
    { "platform": "Flipkart", "price": 101000, "rating": 4.7, "score": "89.30" }
  ],
  "bestDeal": { "platform": "Amazon", "price": 99999 },
  "foundOnPlatforms": 2,
  "totalScraped": 15
}
```

**Response (Failure)**:
```json
{
  "success": false,
  "message": "No exact product found for \"iPhone 18\". Please try...",
  "query": "iPhone 18"
}
```

## ⚙️ Configuration

### Similarity Threshold
File: `server/utils/matching.js` (line 230)
```javascript
if (similarity < 0.40) {  // Adjust this value
```
- **0.30**: Very loose (may match irrelevant products)
- **0.40**: Default (strict keyword checks make this okay)
- **0.50**: Strict (may miss some legitimate matches)

### Remove Noise Words
File: `server/utils/matching.js` (function `removeNoise`, line 10)
```javascript
const filler = [
  'free\\s+(delivery|shipping)',
  'best\\s+(offer|deal)',
  // Add your custom words here
];
```

## 🧪 Testing

```bash
# Run full test suite
cd server && node utils/matching.test.js

# Debug specific match
cd server && node utils/debug-matching.js
```

## 📊 Score Breakdown

Maximum Score: 100 points
- Version Match: 35 points
- All Keywords: 35 points  
- Fuzzy Similarity: 30 points (30 × similarity %)

**Example**: 
- Version: ✓ (+35)
- Keywords: ✓ (+35)
- Similarity: 0.85 (+25.5)
- **Total: 95.5 points**

## ❌ Rejection Criteria

Product is REJECTED if ANY of these fail:
1. ❌ Version mismatch (if query specifies version)
2. ❌ Missing required keyword
3. ❌ Similarity < 0.40

## ✅ Acceptance Criteria

Product is ACCEPTED if ALL of these pass:
1. ✅ Version matches (if query specifies version)
2. ✅ Has all required keywords
3. ✅ Similarity ≥ 0.40

## 🔍 Debug Output Example

```
========== PRODUCT MATCHING DEBUG ==========
Search Query: "iPhone 17"
Total Candidates: 30

[Candidate 1] Apple iPhone 17 Pro Max
  Score: 92.50
  Reasons: ✓ Version match, ✓ All keywords present, ✓ Fuzzy match (87.5%)

[Candidate 2] iPhone 16 Pro
  Score: REJECTED (Version mismatch. Query: [17], Product: [16])

✓ Matching Products: 8
🏆 BEST MATCH: Apple iPhone 17 Pro Max
   Score: 92.50
==========================================
```

## 🐛 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| No results | Query too specific | Try removing model variant |
| Wrong results | Scrapers returning junk | Clean scraper output |
| Some matches missed | Threshold too high | Lower similarity threshold |
| Too many false positives | Threshold too low | Raise similarity threshold |

## 📝 Usage in Code

### In Controllers
```javascript
const { findMatchesAcrossPlatforms } = require('../utils/matching');

const matches = findMatchesAcrossPlatforms(searchQuery, platforms, debugMode);
if (matches.length === 0) {
  return res.status(404).json({ success: false, message: 'No exact product found' });
}
```

### Accessing Scores
```javascript
const matches = findMatchesAcrossPlatforms(query, platforms);
matches.forEach(match => {
  console.log(`${match.platform}: Score=${match.product.score}`);
});
```

## 🎓 Understanding Matching

**The Philosophy**:
- Accuracy > Coverage
- If unsure, return NO MATCH (not wrong match)
- Strict keyword validation prevents false positives
- Fuzzy matching provides flexibility within strict bounds

**Why 3-Layer Validation**:
- Version: Prevents iPhone 17 ≠ iPhone 16
- Keywords: Ensures "Pro" in search returns "Pro" products
- Similarity: Catches typos and variations

## 🔗 Related Files

- Main Logic: `server/utils/matching.js`
- Tests: `server/utils/matching.test.js`
- Debug: `server/utils/debug-matching.js`
- Search Controller: `server/controllers/searchController.js`
- Compare Controller: `server/controllers/compareController.js`

---

**Version**: 2.0 | **Updated**: April 2026
