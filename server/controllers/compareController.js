const Product = require('../models/Product');
const { scrapeAmazonProduct, scrapeFlipkartProduct, scrapeMyntraProduct, scrapeAjioProduct, scrapeRelianceProduct, searchAmazon, searchFlipkart, searchMyntra, searchAjio, searchReliance } = require('../scrapers');
const { findMatchesAcrossPlatforms } = require('../utils/matching');

const fetchFromUrl = async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });

  console.log(`\n📦 Direct URL comparison: ${url}`);

  try {
    let mainProduct;
    if (url.includes('amazon.in')) {
      mainProduct = await scrapeAmazonProduct(url);
    } else if (url.includes('flipkart.com')) {
      mainProduct = await scrapeFlipkartProduct(url);
    } else if (url.includes('myntra.com')) {
      mainProduct = await scrapeMyntraProduct(url);
    } else if (url.includes('ajio.com')) {
      mainProduct = await scrapeAjioProduct(url);
    } else if (url.includes('reliancedigital.in')) {
      mainProduct = await scrapeRelianceProduct(url);
    } else {
      return res.status(400).json({ error: 'Unsupported URL' });
    }

    if (!mainProduct || !mainProduct.title) return res.status(404).json({ error: 'Product not found' });

    console.log(`✓ Main product: "${mainProduct.title}"`);

    // Check cache
    const cached = await Product.findOne({ normalizedTitle: mainProduct.title.toLowerCase() });
    if (cached && (Date.now() - cached.updatedAt) < 6 * 60 * 60 * 1000) {
      console.log('✓ Returning cached result');
      return res.json(cached);
    }

    // Search for same product on other platforms using main product title
    console.log('📡 Searching other platforms for matching products...');
    const [amazon, flipkart, myntra, ajio, reliance] = await Promise.all([
      url.includes('amazon.in') ? [mainProduct] : searchAmazon(mainProduct.title),
      url.includes('flipkart.com') ? [mainProduct] : searchFlipkart(mainProduct.title),
      url.includes('myntra.com') ? [mainProduct] : searchMyntra(mainProduct.title),
      url.includes('ajio.com') ? [mainProduct] : searchAjio(mainProduct.title),
      url.includes('reliancedigital.in') ? [mainProduct] : searchReliance(mainProduct.title)
    ]);

    const platforms = [
      { platform: 'Amazon', products: amazon },
      { platform: 'Flipkart', products: flipkart },
      { platform: 'Myntra', products: myntra },
      { platform: 'Ajio', products: ajio },
      { platform: 'Reliance Digital', products: reliance }
    ];

    // ✅ Use improved matching logic to find best matches across platforms
    const platformMatches = findMatchesAcrossPlatforms(mainProduct.title, platforms);

    if (platformMatches.length === 0) {
      console.log(`⚠️  No matching products found on other platforms`);
      // Still return the main product
    }

    console.log(`✓ Found matches on ${platformMatches.length} platform(s)`);

    // Build comparison result
    const comparison = platformMatches.map(match => ({
      platform: match.platform,
      price: match.product.price,
      rating: match.product.rating || 'N/A',
      link: match.product.link
    }));

    const bestDeal = comparison.reduce((best, curr) => 
      !best || (curr.price && (!best.price || curr.price < best.price)) ? curr : best, 
      null
    );

    const result = {
      success: true,
      product: {
        title: mainProduct.title,
        image: mainProduct.image,
        brand: mainProduct.brand || 'Unknown'
      },
      comparison: comparison.sort((a, b) => (a.price || Infinity) - (b.price || Infinity)),
      bestDeal: bestDeal || comparison[0],
      foundOnPlatforms: platformMatches.length
    };

    // Cache
    await Product.findOneAndUpdate(
      { normalizedTitle: mainProduct.title.toLowerCase() },
      { ...result, updatedAt: new Date() },
      { upsert: true }
    );

    console.log(`✓ Result cached and returned\n`);
    res.json(result);
  } catch (error) {
    console.error('Compare error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch product',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = { fetchFromUrl };