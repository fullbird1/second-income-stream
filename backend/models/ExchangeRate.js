const mongoose = require('mongoose');

const ExchangeRateSchema = new mongoose.Schema({
  fromCurrency: {
    type: String,
    required: true,
    enum: ['USD', 'HKD']
  },
  toCurrency: {
    type: String,
    required: true,
    enum: ['USD', 'HKD']
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  source: {
    type: String,
    default: 'Yahoo Finance'
  }
}, {
  timestamps: true
});

// Compound index to ensure unique pairs of currencies for a given date
ExchangeRateSchema.index({ fromCurrency: 1, toCurrency: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('ExchangeRate', ExchangeRateSchema);
