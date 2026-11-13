const {
  normalizeText,
  extractVersionNumbers,
  extractKeywords,
  hasAllKeywords,
  calculateMatchScore
} = require('./matching');

console.log('\n========== DEBUG: iPhone vs iPhone 17 Pro Max ==========\n');

const query = 'iPhone';
const product = 'Apple iPhone 17 Pro Max';

console.log(`Query: "${query}"`);
console.log(`Product: "${product}"`);

// Step 1: Extract versions
const queryVersions = extractVersionNumbers(query);
const productVersions = extractVersionNumbers(product);
console.log(`\n[1] Version Extraction:`);
console.log(`    Query versions: [${queryVersions.join(', ')}]`);
console.log(`    Product versions: [${productVersions.join(', ')}]`);

// Step 2: Extract keywords
const queryKeywords = extractKeywords(query);
console.log(`\n[2] Keyword Extraction:`);
console.log(`    Query keywords: [${queryKeywords.map(k => `"${k}"`).join(', ')}]`);

// Step 3: Normalize text
const normalizedQuery = normalizeText(query);
const normalizedProduct = normalizeText(product);
console.log(`\n[3] Text Normalization:`);
console.log(`    Query: "${query}" -> "${normalizedQuery}"`);
console.log(`    Product: "${product}" -> "${normalizedProduct}"`);

// Step 4: Check keywords in product
console.log(`\n[4] Keyword Matching:`);
queryKeywords.forEach(keyword => {
  const regex = new RegExp(`\\b${keyword}\\b`);
  const matchesNormalized = regex.test(normalizedProduct.toLowerCase());
  const matchesOriginal = regex.test(normalizeText(product).toLowerCase());
  console.log(`    "${keyword}": normalized=${matchesNormalized}, original=${matchesOriginal}`);
});

const allMatch = hasAllKeywords(product, queryKeywords);
console.log(`    All keywords match: ${allMatch}`);

// Step 5: Full score calculation
console.log(`\n[5] Full Match Score:`);
const result = calculateMatchScore(query, product);
console.log(`    Score: ${result.score}`);
console.log(`    Details:`, result.details);
console.log(`    Reasons:`, result.reasons);

console.log(`\n========== END DEBUG ==========\n`);
