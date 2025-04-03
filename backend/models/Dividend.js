const mongoose = require('mongoose');

const DividendSchema = new mongoose.Schema({
  stock: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stock',
    required: true
  },
  exDate: {
    type: Date,
    required: true
  },
  paymentDate: {
    type: Date,
    required: true
  },
  amountPerShare: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD',
    enum: ['USD', 'HKD']
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  shares: {
    type: Number,
    required: true,
    min: 0
  },
  reinvested: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Dividend', DividendSchema);
