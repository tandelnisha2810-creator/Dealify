const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dealify', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

require('./cron'); // Start cron jobs

const searchRoutes = require('./routes/search');
const compareRoutes = require('./routes/compare');

app.use('/api/search', searchRoutes);
app.use('/api/compare', compareRoutes);

module.exports = app;