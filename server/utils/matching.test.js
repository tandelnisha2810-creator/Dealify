const {
  normalizeText,
  extractVersionNumbers,
  extractKeywords,
  hasAllKeywords,
  versionsMatch,
  calculateMatchScore,
  findBestMatch
} = require('./matching');

// ============================================
// TEST CASES
// ============================================

console.log('\n========================================');
console.log('🧪 PRODUCT MATCHING TEST SUITE');
console.log('========================================\n');

// Test 1: Version extraction
console.log('📝 Test 1: Version Number Extraction');
console.log('---');
const versionTests = [
  { input: 'iPhone 17', expected: [17] },
  { input: 'iPhone 17 Pro Max', expected: [17] },
  { input: 'Samsung Galaxy S24 Ultra', expected: [24] },
  { input: 'iPad Air 6', expected: [6] },
  { input: 'Product without version', expected: [] }
];

versionTests.forEach(test => {
  const result = extractVersionNumbers(test.input);
  const passed = JSON.stringify(result) === JSON.stringify(test.expected);
  console.log(`${passed ? '✓' : '✗'} "${test.input}" -> ${JSON.stringify(result)}`);
});

// Test 2: Keyword extraction
console.log('\n📝 Test 2: Keyword Extraction');
console.log('---');
const keywordTests = [
  'iPhone 17',
  'Apple iPhone 16 Pro Max',
  'Samsung Galaxy S24 Ultra',
  'Sony WH 1000XM5 Headphones'
];

keywordTests.forEach(test => {
  const keywords = extractKeywords(test);
  console.log(`✓ "${test}"`);
  console.log(`  Keywords: [${keywords.map(k => `"${k}"`).join(', ')}]`);
});

// Test 3: Critical matching scenarios
console.log('\n📝 Test 3: CRITICAL - Version Matching');
console.log('---');

const scenarios = [
  {
    name: 'iPhone 17 search → iPhone 17 product',
    query: 'iPhone 17',
    products: [
      { title: 'Apple iPhone 17 (256GB) Black', price: 79999, rating: 4.5, link: 'link1.com' },
    ],
    shouldMatch: true
  },
  {
    name: 'iPhone 17 search → iPhone 16 product (WRONG)',
    query: 'iPhone 17',
    products: [
      { title: 'Apple iPhone 16 (256GB) Black', price: 69999, rating: 4.5, link: 'link1.com' },
    ],
    shouldMatch: false
  },
  {
    name: 'iPhone search (no version) → Any iPhone product',
    query: 'iPhone',
    products: [
      { title: 'Apple iPhone 17 Pro Max', price: 99999, rating: 4.8, link: 'link1.com' },
    ],
    shouldMatch: true
  },
  {
    name: 'Samsung S24 search → Samsung S24 found (correct)',
    query: 'Samsung Galaxy S24 Ultra',
    products: [
      { title: 'Samsung Galaxy S24 Ultra 256GB Titanium', price: 89999, rating: 4.7, link: 'link2.com' },
    ],
    shouldMatch: true
  },
  {
    name: 'Samsung S24 search → Samsung S23 found (WRONG)',
    query: 'Samsung Galaxy S24',
    products: [
      { title: 'Samsung Galaxy S23 Phantom Black 128GB', price: 74999, rating: 4.5, link: 'link2.com' },
    ],
    shouldMatch: false
  }
];

scenarios.forEach(scenario => {
  console.log(`\n📱 ${scenario.name}`);
  const result = findBestMatch(scenario.query, scenario.products);
  const matched = result !== null;
  const correct = matched === scenario.shouldMatch;
  
  console.log(`   Query: "${scenario.query}"`);
  console.log(`   Product: "${scenario.products[0].title}"`);
  console.log(`   Expected: ${scenario.shouldMatch ? 'MATCH' : 'NO MATCH'}`);
  console.log(`   Result: ${matched ? 'MATCH ✓' : 'NO MATCH ✓'}`);
  console.log(`   ${correct ? '✅ CORRECT' : '❌ INCORRECT'}`);
});

// Test 4: Multiple product filtering
console.log('\n📝 Test 4: Filtering Multiple Products');
console.log('---');

const multiProductTest = {
  query: 'iPhone 17 Pro',
  products: [
    { title: 'iPhone 16 Pro Max 256GB', price: 89999, rating: 4.5, link: 'link1.com' }, // Wrong version
    { title: 'iPhone 17 (base model)', price: 79999, rating: 4.4, link: 'link2.com' }, // Right version, no Pro
    { title: 'Apple iPhone 17 Pro 512GB Space Black', price: 99999, rating: 4.8, link: 'link3.com' }, // CORRECT
    { title: 'iPhone 17 Pro with free case', price: 99999, rating: 4.7, link: 'link4.com' }, // Also correct
  ]
};

console.log(`\nSearching: "${multiProductTest.query}"`);
console.log(`Total candidates: ${multiProductTest.products.length}`);
const bestMatch = findBestMatch(multiProductTest.query, multiProductTest.products);

multiProductTest.products.forEach((prod, idx) => {
  const { score } = calculateMatchScore(multiProductTest.query, prod.title);
  console.log(`  [${idx + 1}] ${prod.title}`);
  console.log(`      Score: ${score >= 0 ? score.toFixed(2) : 'REJECTED'}`);
});

console.log(`\n✓ BEST MATCH: ${bestMatch ? bestMatch.title : 'NONE FOUND'}`);

// Test 5: Noise removal
console.log('\n📝 Test 5: Noise Removal in Titles');
console.log('---');

const noiseTests = [
  'Apple iPhone 17 with free delivery and discount',
  'Samsung S24 - Latest Model - Best Offer',
  'Sony Headphones - Limited Time Deal',
];

noiseTests.forEach(title => {
  const normalized = normalizeText(title);
  console.log(`Before: "${title}"`);
  console.log(`After:  "${normalized}"`);
  console.log('');
});

// Test 6: Edge cases
console.log('\n📝 Test 6: Edge Cases');
console.log('---');

const edgeCases = [
  { query: '', products: [{ title: 'iPhone 17' }], name: 'Empty query' },
  { query: 'iPhone 17', products: [], name: 'Empty products' },
  { query: 'iPhone 17', products: [{ title: '' }], name: 'Empty product title' },
  { query: 'iPhone 17', products: [null], name: 'Null product' },
];

edgeCases.forEach(test => {
  try {
    const result = findBestMatch(test.query, test.products || []);
    console.log(`✓ ${test.name}: Handled gracefully (${result ? 'matched' : 'no match'})`);
  } catch (error) {
    console.log(`✗ ${test.name}: ERROR - ${error.message}`);
  }
});

console.log('\n========================================');
console.log('✅ TEST SUITE COMPLETE');
console.log('========================================\n');
