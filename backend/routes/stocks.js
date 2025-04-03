const express = require('express');
const router = express.Router();
const yahooFinance = require('../utils/yahooFinance');

/**
 * @route   GET /api/stocks/quote/:symbol
 * @desc    Get stock quote for a symbol
 * @access  Public
 */
router.get('/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const quote = await yahooFinance.getStockQuote(symbol);
    res.json(quote);
  } catch (error) {
    console.error('Error in stock quote route:', error);
    res.status(500).json({ error: 'Failed to fetch stock quote' });
  }
});

/**
 * @route   GET /api/stocks/dividends/:symbol
 * @desc    Get dividend history for a symbol
 * @access  Public
 */
router.get('/dividends/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const dividends = await yahooFinance.getDividendHistory(symbol);
    res.json(dividends);
  } catch (error) {
    console.error('Error in dividend history route:', error);
    res.status(500).json({ error: 'Failed to fetch dividend history' });
  }
});

/**
 * @route   GET /api/stocks/batch
 * @desc    Get batch quotes for multiple symbols
 * @access  Public
 */
router.get('/batch', async (req, res) => {
  try {
    const { symbols } = req.query;
    
    if (!symbols) {
      return res.status(400).json({ error: 'Symbols parameter is required' });
    }
    
    const symbolsArray = symbols.split(',');
    const quotes = await yahooFinance.getBatchQuotes(symbolsArray);
    res.json(quotes);
  } catch (error) {
    console.error('Error in batch quotes route:', error);
    res.status(500).json({ error: 'Failed to fetch batch quotes' });
  }
});

/**
 * @route   GET /api/stocks/refresh/:symbol
 * @desc    Force refresh cached data for a symbol
 * @access  Public
 */
router.get('/refresh/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const refreshedData = await yahooFinance.refreshStockData(symbol);
    res.json({ message: `Data for ${symbol} refreshed successfully`, data: refreshedData });
  } catch (error) {
    console.error('Error in refresh route:', error);
    res.status(500).json({ error: 'Failed to refresh stock data' });
  }
});

/**
 * @route   GET /api/stocks/exchange-rate
 * @desc    Get exchange rate between two currencies
 * @access  Public
 */
router.get('/exchange-rate', async (req, res) => {
  try {
    const { from, to } = req.query;
    
    if (!from || !to) {
      return res.status(400).json({ error: 'Both from and to currency parameters are required' });
    }
    
    const rate = await yahooFinance.getExchangeRate(from, to);
    res.json({ from, to, rate });
  } catch (error) {
    console.error('Error in exchange rate route:', error);
    res.status(500).json({ error: 'Failed to fetch exchange rate' });
  }
});

/**
 * @route   POST /api/stocks/clear-cache
 * @desc    Clear all cached stock data
 * @access  Public
 */
router.post('/clear-cache', (req, res) => {
  try {
    yahooFinance.clearCache();
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Error in clear cache route:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

module.exports = router;
