const express = require('express');
const router = express.Router();
const ExchangeRate = require('../models/ExchangeRate');
const yahooFinance = require('../utils/yahooFinance');

/**
 * @route   GET /api/exchange-rates/current
 * @desc    Get current exchange rate between USD and HKD
 * @access  Public
 */
router.get('/current', async (req, res) => {
  try {
    const { from = 'USD', to = 'HKD' } = req.query;
    
    // Validate currency codes
    if (!['USD', 'HKD'].includes(from) || !['USD', 'HKD'].includes(to)) {
      return res.status(400).json({ 
        error: 'Invalid currency codes. Only USD and HKD are supported.' 
      });
    }
    
    // Check if we have a recent rate in the database (less than 24 hours old)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    let exchangeRate = await ExchangeRate.findOne({
      fromCurrency: from,
      toCurrency: to,
      date: { $gte: oneDayAgo }
    }).sort({ date: -1 });
    
    // If no recent rate, fetch from Yahoo Finance
    if (!exchangeRate) {
      const rate = await yahooFinance.getExchangeRate(from, to);
      
      exchangeRate = new ExchangeRate({
        fromCurrency: from,
        toCurrency: to,
        rate,
        date: new Date(),
        source: 'Yahoo Finance'
      });
      
      await exchangeRate.save();
    }
    
    res.json({
      fromCurrency: exchangeRate.fromCurrency,
      toCurrency: exchangeRate.toCurrency,
      rate: exchangeRate.rate,
      date: exchangeRate.date,
      source: exchangeRate.source
    });
  } catch (error) {
    console.error('Error in get current exchange rate route:', error);
    res.status(500).json({ error: 'Failed to fetch exchange rate' });
  }
});

/**
 * @route   GET /api/exchange-rates/convert
 * @desc    Convert amount between USD and HKD
 * @access  Public
 */
router.get('/convert', async (req, res) => {
  try {
    const { amount, from = 'USD', to = 'HKD' } = req.query;
    
    // Validate amount
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }
    
    // Validate currency codes
    if (!['USD', 'HKD'].includes(from) || !['USD', 'HKD'].includes(to)) {
      return res.status(400).json({ 
        error: 'Invalid currency codes. Only USD and HKD are supported.' 
      });
    }
    
    // If same currency, return the amount
    if (from === to) {
      return res.json({
        fromCurrency: from,
        toCurrency: to,
        originalAmount: parseFloat(amount),
        convertedAmount: parseFloat(amount),
        rate: 1,
        date: new Date()
      });
    }
    
    // Get current exchange rate
    const { rate, date } = await getCurrentExchangeRate(from, to);
    
    // Calculate converted amount
    const originalAmount = parseFloat(amount);
    const convertedAmount = originalAmount * rate;
    
    res.json({
      fromCurrency: from,
      toCurrency: to,
      originalAmount,
      convertedAmount,
      rate,
      date
    });
  } catch (error) {
    console.error('Error in convert currency route:', error);
    res.status(500).json({ error: 'Failed to convert currency' });
  }
});

/**
 * @route   GET /api/exchange-rates/history
 * @desc    Get exchange rate history
 * @access  Public
 */
router.get('/history', async (req, res) => {
  try {
    const { from = 'USD', to = 'HKD', days = 30 } = req.query;
    
    // Validate currency codes
    if (!['USD', 'HKD'].includes(from) || !['USD', 'HKD'].includes(to)) {
      return res.status(400).json({ 
        error: 'Invalid currency codes. Only USD and HKD are supported.' 
      });
    }
    
    // Calculate start date
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Get exchange rate history
    const history = await ExchangeRate.find({
      fromCurrency: from,
      toCurrency: to,
      date: { $gte: startDate }
    }).sort({ date: 1 });
    
    res.json(history);
  } catch (error) {
    console.error('Error in exchange rate history route:', error);
    res.status(500).json({ error: 'Failed to fetch exchange rate history' });
  }
});

/**
 * @route   POST /api/exchange-rates/refresh
 * @desc    Refresh exchange rates
 * @access  Public
 */
router.post('/refresh', async (req, res) => {
  try {
    // Refresh USD to HKD rate
    const usdToHkdRate = await yahooFinance.getExchangeRate('USD', 'HKD');
    
    let usdToHkd = await ExchangeRate.findOne({
      fromCurrency: 'USD',
      toCurrency: 'HKD',
      date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });
    
    if (usdToHkd) {
      usdToHkd.rate = usdToHkdRate;
      usdToHkd.date = new Date();
      await usdToHkd.save();
    } else {
      usdToHkd = new ExchangeRate({
        fromCurrency: 'USD',
        toCurrency: 'HKD',
        rate: usdToHkdRate,
        date: new Date(),
        source: 'Yahoo Finance'
      });
      await usdToHkd.save();
    }
    
    // Refresh HKD to USD rate
    const hkdToUsdRate = 1 / usdToHkdRate;
    
    let hkdToUsd = await ExchangeRate.findOne({
      fromCurrency: 'HKD',
      toCurrency: 'USD',
      date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });
    
    if (hkdToUsd) {
      hkdToUsd.rate = hkdToUsdRate;
      hkdToUsd.date = new Date();
      await hkdToUsd.save();
    } else {
      hkdToUsd = new ExchangeRate({
        fromCurrency: 'HKD',
        toCurrency: 'USD',
        rate: hkdToUsdRate,
        date: new Date(),
        source: 'Yahoo Finance'
      });
      await hkdToUsd.save();
    }
    
    res.json({
      message: 'Exchange rates refreshed successfully',
      rates: {
        usdToHkd: {
          fromCurrency: 'USD',
          toCurrency: 'HKD',
          rate: usdToHkdRate,
          date: new Date()
        },
        hkdToUsd: {
          fromCurrency: 'HKD',
          toCurrency: 'USD',
          rate: hkdToUsdRate,
          date: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Error in refresh exchange rates route:', error);
    res.status(500).json({ error: 'Failed to refresh exchange rates' });
  }
});

/**
 * Helper function to get current exchange rate
 * @param {string} from - Source currency
 * @param {string} to - Target currency
 * @returns {Object} - Exchange rate and date
 */
async function getCurrentExchangeRate(from, to) {
  // Check if we have a recent rate in the database (less than 24 hours old)
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  
  let exchangeRate = await ExchangeRate.findOne({
    fromCurrency: from,
    toCurrency: to,
    date: { $gte: oneDayAgo }
  }).sort({ date: -1 });
  
  // If no recent rate, fetch from Yahoo Finance
  if (!exchangeRate) {
    const rate = await yahooFinance.getExchangeRate(from, to);
    
    exchangeRate = new ExchangeRate({
      fromCurrency: from,
      toCurrency: to,
      rate,
      date: new Date(),
      source: 'Yahoo Finance'
    });
    
    await exchangeRate.save();
  }
  
  return {
    rate: exchangeRate.rate,
    date: exchangeRate.date
  };
}

module.exports = router;
