const Product = require('../models/Product');
const axios = require('axios');

const PYTHON_SCRAPER_URL = process.env.PYTHON_SCRAPER_URL || 'http://localhost:8000';

const searchProducts = async (req, res) => {
  const { q, debug } = req.query;
  if (!q) return res.status(400).json({ error: 'Query parameter required' });

  const enableDebug = debug === 'true' || debug === '1';

  console.log(`\n🔍 Search started for: "${q}" ${enableDebug ? '(DEBUG MODE)' : ''}`);

  try {
    // Check cache first
    const cached = await Product.findOne({ normalizedTitle: { $regex: new RegExp(q.toLowerCase(), 'i') } });
    if (cached && (Date.now() - cached.updatedAt) < 6 * 60 * 60 * 1000) { // 6 hours
      console.log('✓ Returning cached result');
      return res.json(cached);
    }

    // Call Python scraper service
    console.log('🐍 Calling Python scraper service...');
    const pythonResponse = await axios.post(`${PYTHON_SCRAPER_URL}/search`, {
      query: q
    }, {
      timeout: 60000 // 60 second timeout
    });

    const { type, products } = pythonResponse.data;
    console.log(`✓ Python scraper returned ${products.length} products (type: ${type})`);

    // If no products found, return error
    if (products.length === 0) {
      console.log(`❌ NO PRODUCTS FOUND for "${q}"`);
      return res.status(404).json({
        success: false,
        type: 'none',
        message: `No products found for "${q}". Please try a different search term.`,
        query: q
      });
    }

    // Transform products into matches format
    const matches = products.map(product => ({
      platform: product.platform,
      product: product
    }));

    // Get the best overall match (highest score across all platforms)
    const bestOverall = matches.reduce((best, current) => {
      const currentScore = current.product.score || 0;
      const bestScore = best.product.score || 0;
      return currentScore > bestScore ? current : best;
    });

    console.log(`✓ Found ${type} matching products on ${matches.length} platform(s)`);

    // Build comparison result
    const comparison = matches.map(match => ({
      platform: match.platform,
      price: match.product.price,
      rating: match.product.rating || 'N/A',
      link: match.product.link,
      score: (match.product.score || 0).toFixed(2)
    }));

    const bestDeal = comparison.reduce((best, curr) =>
      !best || (curr.price && (!best.price || curr.price < best.price)) ? curr : best,
      null
    );

    const result = {
      success: true,
      type, // "exact" or "similar"
      message: type === 'similar' ? `Exact product not found for "${q}". Showing similar products.` : undefined,
      product: {
        title: bestOverall.product.title,
        image: bestOverall.product.image,
        brand: bestOverall.product.brand || 'Unknown'
      },
      comparison: comparison.sort((a, b) => (a.price || Infinity) - (b.price || Infinity)),
      bestDeal: bestDeal || comparison[0],
      foundOnPlatforms: matches.length,
      totalScraped: products.length
    };

    // Cache the result
    try {
      const productDoc = new Product({
        ...result,
        normalizedTitle: q.toLowerCase(),
        updatedAt: new Date()
      });
      await productDoc.save();
      console.log('✓ Result cached in database');
    } catch (cacheError) {
      console.warn('⚠️ Failed to cache result:', cacheError.message);
    }

    console.log(`✓ Result returned (${type} match)\n`);
    res.json(result);

  } catch (error) {
    console.error('❌ Search failed:', error.message);

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return res.status(503).json({
        success: false,
        error: 'Python scraper service is not available. Please try again later.',
        query: q
      });
    }

    res.status(500).json({
      success: false,
      error: 'Search failed due to an internal error',
      query: q
    });
  }
};

module.exports = { searchProducts };