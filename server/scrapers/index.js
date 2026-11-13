const { searchAmazon, scrapeAmazonProduct } = require('./amazon');
const { searchFlipkart, scrapeFlipkartProduct } = require('./flipkart');
const { searchMyntra, scrapeMyntraProduct } = require('./myntra');
const { searchAjio, scrapeAjioProduct } = require('./ajio');
const { searchReliance, scrapeRelianceProduct } = require('./reliance');

module.exports = {
  searchAmazon,
  scrapeAmazonProduct,
  searchFlipkart,
  scrapeFlipkartProduct,
  searchMyntra,
  scrapeMyntraProduct,
  searchAjio,
  scrapeAjioProduct,
  searchReliance,
  scrapeRelianceProduct
};