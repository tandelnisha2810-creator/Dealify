const cron = require('node-cron');
const Product = require('./models/Product');
const PriceHistory = require('./models/PriceHistory');
const { searchAmazon, searchFlipkart } = require('./scrapers');

// Run every 12 hours
cron.schedule('0 */12 * * *', async () => {
  console.log('Updating prices...');
  try {
    const products = await Product.find({});
    for (const product of products) {
      // Re-scrape prices
      const query = product.title.split(' ').slice(0, 5).join(' ');
      const [amazon, flipkart] = await Promise.all([
        searchAmazon(query),
        searchFlipkart(query)
      ]);
      // Update platforms
      product.platforms.forEach(platform => {
        let newPrice = platform.price;
        if (platform.name === 'Amazon' && amazon.length > 0) {
          newPrice = amazon[0].price;
        } else if (platform.name === 'Flipkart' && flipkart.length > 0) {
          newPrice = flipkart[0].price;
        }
        if (newPrice !== platform.price) {
          // Save history
          PriceHistory.create({
            productId: product._id,
            platform: platform.name,
            price: newPrice
          });
          platform.price = newPrice;
          platform.scrapedAt = new Date();
        }
      });
      product.updatedAt = new Date();
      await product.save();
    }
    console.log('Prices updated');
  } catch (error) {
    console.error('Cron job error:', error);
  }
});

module.exports = cron;