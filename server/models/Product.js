const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  normalizedTitle: { type: String, required: true },
  image: String,
  brand: String,
  platforms: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    rating: Number,
    link: { type: String, required: true },
    scrapedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// TTL index for 12 hours
productSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 43200 });

module.exports = mongoose.model('Product', productSchema);