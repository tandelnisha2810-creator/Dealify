const stringSimilarity = require('string-similarity');

// ============================================
// 1. TEXT NORMALIZATION
// ============================================

// ============================================
// 1. TEXT NORMALIZATION
// ============================================

/**
 * Removes irrelevant words that don't affect matching
 */
function removeNoise(text) {
  // Only remove true marketing/filler words, NOT product variants
  const filler = [
    'with\\s+(free|fast|quick|cheap|best)',
    '(best\\s+)?(offer|deal|price)',
    'free\\s+(delivery|shipping)',
    'limited\\s+time',
    'buy\\s+now',
    'pre\\s+order',
    'exclusive',
    'official',
    'authentic',
    'original',
    'genuine',
    'sealed'
  ];
  
  let cleaned = text.toLowerCase();
  filler.forEach(pattern => {
    cleaned = cleaned.replace(new RegExp(pattern, 'gi'), '');
  });
  
  // Clean up leftover whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

/**
 * Normalize text for comparison
 * Converts to lowercase, removes punctuation and noise
 */
function normalizeText(text) {
  if (!text) return '';
  let normalized = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // convert punctuation to spaces
    .replace(/\s+/g, ' ') // collapse multiple spaces
    .trim();
  
  normalized = removeNoise(normalized);
  return normalized.trim();
}

/**
 * Extract version/model numbers from text
 * Example: "iPhone 17" -> [17]
 * Example: "Samsung Galaxy S24 Ultra" -> [24]
 */
function extractVersionNumbers(text) {
  if (!text) return [];
  
  const versionPatterns = [
    /\b(\d{1,3})\s*(?:pro|max|plus|ultra)?(?:\s|$)/gi, // 17, 24, etc
    /[a-z]\s*(\d{1,3})\b/gi, // S24, X1, etc
  ];
  
  const matches = new Set();
  versionPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const version = parseInt(match[1]);
      if (!isNaN(version)) matches.add(version);
    }
  });
  
  return Array.from(matches).sort((a, b) => a - b);
}

/**
 * Extract key brand and model keywords
 * Example: "iPhone 17 Pro Max" -> ["iphone", "17", "pro", "max"]
 */
function extractKeywords(text) {
  const normalized = normalizeText(text);
  // Split and filter out very common/short words
  return normalized
    .split(/\s+/)
    .filter(word => word.length > 1 && word.match(/^[a-z0-9]+$/))
    .slice(0, 8); // limit to first 8 meaningful words
}

// ============================================
// 2. STRICT MATCHING LOGIC
// ============================================

/**
 * Check if product title contains ALL required keywords
 * @param {string} productTitle - Product title from scraper
 * @param {array} requiredKeywords - Keywords extracted from search query
 * @returns {boolean}
 */
function hasAllKeywords(productTitle, requiredKeywords) {
  const normalizedProduct = normalizeText(productTitle).toLowerCase();
  return requiredKeywords.every(keyword => {
    const keywordRegex = new RegExp(`\\b${keyword}\\b`);
    return keywordRegex.test(normalizedProduct);
  });
}

/**
 * Check version match - reject if version numbers don't match
 * @param {string} searchQuery - Original search query (for context)
 * @param {array} queryVersions - Version numbers from search query
 * @param {array} productVersions - Version numbers from product title
 * @returns {boolean}
 */
function versionsMatch(searchQuery, queryVersions, productVersions) {
  // If query has no version number specified, accept any product
  // (User might search "iPhone" and we return any iPhone variant)
  if (queryVersions.length === 0) {
    return true;
  }
  
  // If query specifies a version, product MUST have matching version
  if (productVersions.length === 0) {
    return false;
  }
  
  // Check if any product version matches any query version
  return queryVersions.some(qv => productVersions.includes(qv));
}

/**
 * Calculate match score for a single product
 * @param {string} searchQuery - Original search query
 * @param {string} productTitle - Product title from scraper
 * @returns {object} { score, details }
 */
function calculateMatchScore(searchQuery, productTitle) {
  const debugLog = {};
  
  // Extract components
  const queryVersions = extractVersionNumbers(searchQuery);
  const productVersions = extractVersionNumbers(productTitle);
  const queryKeywords = extractKeywords(searchQuery);
  
  debugLog.searchQuery = searchQuery;
  debugLog.queryVersions = queryVersions;
  debugLog.queryKeywords = queryKeywords;
  debugLog.productTitle = productTitle;
  debugLog.productVersions = productVersions;
  
  let score = 0;
  let reasons = [];
  
  // 1. Check version match (CRITICAL)
  if (!versionsMatch(searchQuery, queryVersions, productVersions)) {
    debugLog.versionMatch = false;
    debugLog.reason = `Version mismatch. Query: ${queryVersions}, Product: ${productVersions}`;
    return { score: -1, details: debugLog, reasons };
  }
  reasons.push('✓ Version match');
  score += 35;
  
  // 2. Check all keywords present (CRITICAL)
  if (!hasAllKeywords(productTitle, queryKeywords)) {
    debugLog.keywordMatch = false;
    const missingKeywords = queryKeywords.filter(kw => 
      !new RegExp(`\\b${kw}\\b`).test(normalizeText(productTitle).toLowerCase())
    );
    debugLog.reason = `Missing keywords: ${missingKeywords.join(', ')}`;
    return { score: -1, details: debugLog, reasons };
  }
  reasons.push('✓ All keywords present');
  score += 35;
  
  // 3. Fuzzy similarity (SECONDARY) - require > 0.40 (lower threshold since keywords are strict)
  const normalizedQuery = normalizeText(searchQuery);
  const normalizedProduct = normalizeText(productTitle);
  const similarity = stringSimilarity.compareTwoStrings(normalizedQuery, normalizedProduct);
  
  debugLog.similarity = similarity;
  if (similarity < 0.40) {
    debugLog.reason = `Low similarity: ${similarity.toFixed(2)} (threshold: 0.40)`;
    return { score: -1, details: debugLog, reasons };
  }
  reasons.push(`✓ Fuzzy match (${(similarity * 100).toFixed(1)}%)`);
  score += 30 * similarity; // up to 30 points
  
  debugLog.finalScore = score;
  debugLog.matched = true;
  
  return { score, details: debugLog, reasons };
}

// ============================================
// 3. FIND BEST MATCH FROM CANDIDATES
// ============================================

/**
 * Find best matching product from list of candidates
 * @param {string} searchQuery - User's search query
 * @param {array} candidates - Product candidates from scrapers
 * @param {boolean} debug - Enable debug logging
 * @returns {object} Best match or null
 */
function findBestMatch(searchQuery, candidates, debug = false) {
  if (!searchQuery || !candidates || candidates.length === 0) {
    if (debug) console.log('❌ No search query or candidates provided');
    return null;
  }

  if (debug) {
    console.log('\n========== PRODUCT MATCHING DEBUG ==========');
    console.log(`Search Query: "${searchQuery}"`);
    console.log(`Total Candidates: ${candidates.length}`);
  }

  // Filter out null/undefined candidates
  const validCandidates = candidates.filter(c => c && c.title);

  if (validCandidates.length === 0) {
    if (debug) console.log('❌ No valid candidates after filtering');
    return null;
  }

  // Score all candidates
  const scored = validCandidates
    .map((candidate, index) => {
      const { score, details, reasons } = calculateMatchScore(searchQuery, candidate.title);
      
      if (debug && score >= 0) {
        console.log(`\n[Candidate ${index + 1}] ${candidate.title}`);
        console.log(`  Score: ${score.toFixed(2)}`);
        console.log(`  Reasons: ${reasons.join(', ')}`);
      }
      
      return { ...candidate, score, details };
    })
    .filter(item => item.score >= 0); // Remove non-matches

  if (debug) {
    console.log(`\n✓ Matching Products: ${scored.length}`);
  }

  if (scored.length === 0) {
    if (debug) {
      console.log('\n❌ NO MATCHING PRODUCTS FOUND');
      console.log('First candidate rejected:');
      if (validCandidates[0]) {
        const { details, reasons } = calculateMatchScore(searchQuery, validCandidates[0].title);
        console.log(`  Title: ${validCandidates[0].title}`);
        console.log(`  Reason: ${details.reason}`);
      }
    }
    return null;
  }

  // Return best scored product
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  
  if (debug) {
    console.log(`\n🏆 BEST MATCH: ${best.title}`);
    console.log(`   Score: ${best.score.toFixed(2)}`);
    console.log('==========================================\n');
  }

  return best;
}

/**
 * Remove version numbers from text for similar matching
 * Example: "iPhone 17 Pro Max" -> "iPhone Pro Max"
 */
function removeVersions(text) {
  if (!text) return '';
  // Remove version numbers and their variants
  return text
    .replace(/\b\d{1,3}\s*(?:pro|max|plus|ultra)?\b/gi, '') // Remove numbers like "17", "24"
    .replace(/[a-z]\s*\d{1,3}\b/gi, '') // Remove patterns like "S24", "X1"
    .replace(/\s+/g, ' ') // Clean up spaces
    .trim();
}

/**
 * Calculate similar match score (more lenient than exact matching)
 * @param {string} searchQuery - Original search query
 * @param {string} productTitle - Product title from scraper
 * @returns {object} { score, details }
 */
function calculateSimilarMatchScore(searchQuery, productTitle) {
  const debugLog = {};

  // Remove versions from query for similar matching
  const queryWithoutVersions = removeVersions(searchQuery);
  const productWithoutVersions = removeVersions(productTitle);

  debugLog.searchQuery = searchQuery;
  debugLog.queryWithoutVersions = queryWithoutVersions;
  debugLog.productTitle = productTitle;
  debugLog.productWithoutVersions = productWithoutVersions;

  let score = 0;
  let reasons = [];

  // For similar matching, we need at least some brand/model keywords
  const queryKeywords = extractKeywords(queryWithoutVersions);
  const productKeywords = extractKeywords(productWithoutVersions);

  debugLog.queryKeywords = queryKeywords;
  debugLog.productKeywords = productKeywords;

  // Must have at least one common keyword (brand/model)
  const commonKeywords = queryKeywords.filter(kw =>
    productKeywords.some(pkw => pkw.includes(kw) || kw.includes(pkw))
  );

  if (commonKeywords.length === 0) {
    debugLog.reason = 'No common keywords found';
    return { score: -1, details: debugLog, reasons };
  }

  reasons.push(`✓ Common keywords: ${commonKeywords.join(', ')}`);
  score += 20;

  // Fuzzy similarity on version-removed text (more lenient threshold)
  const similarity = stringSimilarity.compareTwoStrings(
    normalizeText(queryWithoutVersions),
    normalizeText(productWithoutVersions)
  );

  debugLog.similarity = similarity;
  if (similarity < 0.30) { // Lower threshold for similar matching
    debugLog.reason = `Low similarity: ${similarity.toFixed(2)} (threshold: 0.30)`;
    return { score: -1, details: debugLog, reasons };
  }

  reasons.push(`✓ Fuzzy match (${(similarity * 100).toFixed(1)}%)`);
  score += 40 * similarity; // up to 40 points

  // Bonus for exact brand match
  const brandKeywords = ['apple', 'samsung', 'google', 'oneplus', 'xiaomi', 'oppo', 'vivo', 'realme', 'motorola', 'nokia', 'sony', 'lg', 'huawei', 'honor'];
  const queryBrands = queryKeywords.filter(kw => brandKeywords.includes(kw.toLowerCase()));
  const productBrands = productKeywords.filter(kw => brandKeywords.includes(kw.toLowerCase()));

  if (queryBrands.length > 0 && productBrands.length > 0) {
    const brandMatch = queryBrands.some(qb => productBrands.some(pb => pb === qb));
    if (brandMatch) {
      reasons.push('✓ Brand match bonus');
      score += 15;
    }
  }

  debugLog.finalScore = score;
  debugLog.matched = true;

  return { score, details: debugLog, reasons };
}

/**
 * Find similar products when exact match fails
 * @param {string} searchQuery - User's search query
 * @param {array} candidates - Product candidates from scrapers
 * @param {boolean} debug - Enable debug logging
 * @returns {array} Top 3 similar products
 */
function findSimilarProducts(searchQuery, candidates, debug = false) {
  if (!searchQuery || !candidates || candidates.length === 0) {
    return [];
  }

  if (debug) {
    console.log('\n========== SIMILAR PRODUCT MATCHING ==========');
    console.log(`Search Query: "${searchQuery}"`);
    console.log(`Total Candidates: ${candidates.length}`);
  }

  // Filter out null/undefined candidates
  const validCandidates = candidates.filter(c => c && c.title);

  if (validCandidates.length === 0) {
    return [];
  }

  // Score all candidates with similar matching
  const scored = validCandidates
    .map((candidate, index) => {
      const { score, details, reasons } = calculateSimilarMatchScore(searchQuery, candidate.title);

      if (debug && score >= 0) {
        console.log(`\n[Similar ${index + 1}] ${candidate.title}`);
        console.log(`  Score: ${score.toFixed(2)}`);
        console.log(`  Reasons: ${reasons.join(', ')}`);
      }

      return { ...candidate, score, details };
    })
    .filter(item => item.score >= 0) // Remove non-matches
    .sort((a, b) => b.score - a.score) // Sort by score descending
    .slice(0, 3); // Take top 3

  if (debug) {
    console.log(`\n✓ Similar Products Found: ${scored.length}`);
    if (scored.length > 0) {
      console.log('Top 3:');
      scored.forEach((product, idx) => {
        console.log(`  ${idx + 1}. ${product.title} (Score: ${product.score.toFixed(2)})`);
      });
    }
    console.log('==========================================\n');
  }

  return scored;
}

/**
 * Find exact matches across all platforms
 * @param {string} searchQuery - User's search query
 * @param {array} platformProducts - Array of { platform, products } objects
 * @param {boolean} debug - Enable debug logging
 * @returns {array} Array of { platform, product } matches
 */
function findMatchesAcrossPlatforms(searchQuery, platformProducts, debug = false) {
  const matches = [];

  for (const { platform, products } of platformProducts) {
    const match = findBestMatch(searchQuery, products, debug);
    if (match) {
      matches.push({ platform, product: match });
      if (debug) {
        console.log(`✓ Match found on ${platform}: ${match.title}`);
      }
    }
  }

  if (debug) {
    console.log(`\n📊 Platform matches: ${matches.length}`);
    matches.forEach(match => {
      console.log(`  ${match.platform}: ${match.product.title}`);
    });
  }

  return matches;
}

/**
 * Hybrid matching: Try exact first, then similar
 * @param {string} searchQuery - User's search query
 * @param {array} platformProducts - Array of { platform, products } objects
 * @param {boolean} debug - Enable debug logging
 * @returns {object} { type: "exact"|"similar", matches: [...], message?: string }
 */
function findHybridMatches(searchQuery, platformProducts, debug = false) {
  // First try exact matching
  const exactMatches = findMatchesAcrossPlatforms(searchQuery, platformProducts, debug);

  if (exactMatches.length > 0) {
    if (debug) {
      console.log(`\n✅ EXACT MATCHES FOUND: ${exactMatches.length} products`);
    }
    return {
      type: 'exact',
      matches: exactMatches,
      message: undefined
    };
  }

  // If no exact matches, try similar matching
  if (debug) {
    console.log(`\n🔄 NO EXACT MATCHES - TRYING SIMILAR MATCHING`);
  }

  const allProducts = platformProducts.flatMap(p => p.products);
  const similarProducts = findSimilarProducts(searchQuery, allProducts, debug);

  if (similarProducts.length > 0) {
    // Group similar products by platform
    const similarMatches = platformProducts
      .map(({ platform, products }) => {
        const platformSimilar = similarProducts.filter(sim =>
          products.some(p => p.title === sim.title)
        );
        return platformSimilar.length > 0 ? { platform, product: platformSimilar[0] } : null;
      })
      .filter(Boolean);

    if (debug) {
      console.log(`\n✅ SIMILAR MATCHES FOUND: ${similarMatches.length} products`);
    }

    return {
      type: 'similar',
      matches: similarMatches,
      message: `Exact product not found for "${searchQuery}". Showing similar products.`
    };
  }

  // If no similar matches either, return empty similar result
  if (debug) {
    console.log(`\n❌ NO SIMILAR MATCHES FOUND EITHER`);
  }

  return {
    type: 'similar',
    matches: [],
    message: `No products found for "${searchQuery}". Please try a different search term.`
  };
}

module.exports = {
  normalizeText,
  removeNoise,
  extractVersionNumbers,
  extractKeywords,
  hasAllKeywords,
  versionsMatch,
  calculateMatchScore,
  findBestMatch,
  findMatchesAcrossPlatforms,
  removeVersions,
  calculateSimilarMatchScore,
  findSimilarProducts,
  findHybridMatches
};