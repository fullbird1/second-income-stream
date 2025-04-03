const mongoose = require('mongoose');

const HoldingSchema = new mongoose.Schema({
  stock: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stock',
    required: true
  },
  shares: {
    type: Number,
    required: true,
    min: 0
  },
  averageCostBasis: {
    type: Number,
    required: true,
    min: 0
  },
  currentValue: {
    type: Number,
    required: true,
    min: 0
  },
  allocationPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  targetAllocationPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  currency: {
    type: String,
    required: true,
    default: 'USD',
    enum: ['USD', 'HKD']
  },
  purchaseDate: {
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

module.exports = mongoose.model('Holding', HoldingSchema);
