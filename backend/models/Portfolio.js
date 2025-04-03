const mongoose = require('mongoose');

const PortfolioSchema = new mongoose.Schema({
  totalInvestment: {
    type: Number,
    required: true,
    default: 165000
  },
  cashReserve: {
    type: Number,
    required: true,
    default: 24750 // 15% of total investment
  },
  tier1Allocation: {
    type: Number,
    required: true,
    default: 90750 // 55% of total investment
  },
  tier2Allocation: {
    type: Number,
    required: true,
    default: 41250 // 25% of total investment
  },
  tier3Allocation: {
    type: Number,
    required: true,
    default: 8250 // 5% of total investment
  },
  baseCurrency: {
    type: String,
    required: true,
    default: 'USD',
    enum: ['USD', 'HKD']
  },
  lastRebalanced: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Portfolio', PortfolioSchema);
