const mongoose = require('mongoose');

const StockSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  tier: {
    type: Number,
    required: true,
    enum: [1, 2, 3],
    default: 1
  },
  tierCategory: {
    type: String,
    required: true,
    enum: ['Anchor Funds', 'Index-Based Funds', 'High-Yield Funds'],
    default: 'Anchor Funds'
  },
  subCategory: {
    type: String,
    trim: true
  },
  currentPrice: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'USD',
    enum: ['USD', 'HKD']
  },
  dividendYield: {
    type: Number,
    required: true
  },
  dividendFrequency: {
    type: String,
    enum: ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual', 'Weekly'],
    default: 'Quarterly'
  },
  nextDividendDate: {
    type: Date
  },
  description: {
    type: String
  },
  riskLevel: {
    type: String,
    enum: ['Low', 'Moderate', 'High', 'Very High'],
    default: 'Moderate'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Stock', StockSchema);
