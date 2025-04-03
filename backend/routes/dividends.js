const express = require('express');
const router = express.Router();
const Dividend = require('../models/Dividend');
const Stock = require('../models/Stock');
const Holding = require('../models/Holding');
const yahooFinance = require('../utils/yahooFinance');
const ExchangeRate = require('../models/ExchangeRate');

/**
 * @route   GET /api/dividends
 * @desc    Get all dividend payments
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const dividends = await Dividend.find().populate('stock').sort({ paymentDate: -1 });
    res.json(dividends);
  } catch (error) {
    console.error('Error in get all dividends route:', error);
    res.status(500).json({ error: 'Failed to fetch dividends' });
  }
});

/**
 * @route   GET /api/dividends/:id
 * @desc    Get dividend by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const dividend = await Dividend.findById(req.params.id).populate('stock');
    if (!dividend) {
      return res.status(404).json({ error: 'Dividend not found' });
    }
    res.json(dividend);
  } catch (error) {
    console.error('Error in get dividend by ID route:', error);
    res.status(500).json({ error: 'Failed to fetch dividend' });
  }
});

/**
 * @route   POST /api/dividends
 * @desc    Add a new dividend payment
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const { 
      stockId, 
      exDate, 
      paymentDate, 
      amountPerShare, 
      shares, 
      reinvested, 
      notes,
      currency
    } = req.body;
    
    // Validate stock exists
    const stock = await Stock.findById(stockId);
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    
    // Calculate total amount
    const totalAmount = amountPerShare * shares;
    
    // Create new dividend
    const newDividend = new Dividend({
      stock: stockId,
      exDate: new Date(exDate),
      paymentDate: new Date(paymentDate),
      amountPerShare,
      currency: currency || 'USD',
      totalAmount,
      shares,
      reinvested: reinvested || false,
      notes
    });
    
    await newDividend.save();
    
    res.status(201).json(await Dividend.findById(newDividend._id).populate('stock'));
  } catch (error) {
    console.error('Error in add dividend route:', error);
    res.status(500).json({ error: 'Failed to add dividend' });
  }
});

/**
 * @route   PUT /api/dividends/:id
 * @desc    Update a dividend payment
 * @access  Public
 */
router.put('/:id', async (req, res) => {
  try {
    const { 
      exDate, 
      paymentDate, 
      amountPerShare, 
      shares, 
      reinvested, 
      notes,
      currency
    } = req.body;
    
    // Find the dividend
    const dividend = await Dividend.findById(req.params.id);
    if (!dividend) {
      return res.status(404).json({ error: 'Dividend not found' });
    }
    
    // Update fields if provided
    if (exDate) dividend.exDate = new Date(exDate);
    if (paymentDate) dividend.paymentDate = new Date(paymentDate);
    if (amountPerShare) dividend.amountPerShare = amountPerShare;
    if (shares) dividend.shares = shares;
    if (reinvested !== undefined) dividend.reinvested = reinvested;
    if (notes) dividend.notes = notes;
    if (currency) dividend.currency = currency;
    
    // Recalculate total amount
    dividend.totalAmount = dividend.amountPerShare * dividend.shares;
    
    await dividend.save();
    
    res.json(await Dividend.findById(dividend._id).populate('stock'));
  } catch (error) {
    console.error('Error in update dividend route:', error);
    res.status(500).json({ error: 'Failed to update dividend' });
  }
});

/**
 * @route   DELETE /api/dividends/:id
 * @desc    Delete a dividend payment
 * @access  Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const dividend = await Dividend.findById(req.params.id);
    if (!dividend) {
      return res.status(404).json({ error: 'Dividend not found' });
    }
    
    await Dividend.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Dividend deleted successfully' });
  } catch (error) {
    console.error('Error in delete dividend route:', error);
    res.status(500).json({ error: 'Failed to delete dividend' });
  }
});

/**
 * @route   GET /api/dividends/stock/:stockId
 * @desc    Get dividends by stock ID
 * @access  Public
 */
router.get('/stock/:stockId', async (req, res) => {
  try {
    const dividends = await Dividend.find({ stock: req.params.stockId })
      .populate('stock')
      .sort({ paymentDate: -1 });
    
    res.json(dividends);
  } catch (error) {
    console.error('Error in get dividends by stock ID route:', error);
    res.status(500).json({ error: 'Failed to fetch dividends' });
  }
});

/**
 * @route   GET /api/dividends/income/monthly
 * @desc    Get monthly dividend income
 * @access  Public
 */
router.get('/income/monthly', async (req, res) => {
  try {
    const { year = new Date().getFullYear(), currency = 'USD' } = req.query;
    
    // Get all dividends for the specified year
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);
    
    const dividends = await Dividend.find({
      paymentDate: { $gte: startDate, $lte: endDate }
    }).populate('stock');
    
    // Group dividends by month
    const monthlyIncome = Array(12).fill(0).map(() => ({
      totalUSD: 0,
      totalHKD: 0,
      dividends: []
    }));
    
    // Get current exchange rate
    let exchangeRate = 1;
    if (currency === 'HKD') {
      const rateData = await ExchangeRate.findOne({
        fromCurrency: 'USD',
        toCurrency: 'HKD'
      }).sort({ date: -1 });
      
      if (rateData) {
        exchangeRate = rateData.rate;
      } else {
        // Fetch from Yahoo Finance if not in database
        exchangeRate = await yahooFinance.getExchangeRate('USD', 'HKD');
      }
    }
    
    // Calculate monthly income
    for (const dividend of dividends) {
      const month = dividend.paymentDate.getMonth();
      
      // Convert to requested currency if needed
      let amount = dividend.totalAmount;
      if (dividend.currency === 'USD' && currency === 'HKD') {
        amount *= exchangeRate;
      } else if (dividend.currency === 'HKD' && currency === 'USD') {
        amount /= exchangeRate;
      }
      
      if (dividend.currency === 'USD') {
        monthlyIncome[month].totalUSD += dividend.totalAmount;
        monthlyIncome[month].totalHKD += dividend.totalAmount * exchangeRate;
      } else {
        monthlyIncome[month].totalHKD += dividend.totalAmount;
        monthlyIncome[month].totalUSD += dividend.totalAmount / exchangeRate;
      }
      
      monthlyIncome[month].dividends.push(dividend);
    }
    
    // Add month names and calculate totals
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const result = monthlyIncome.map((month, index) => ({
      month: monthNames[index],
      monthNumber: index + 1,
      totalUSD: month.totalUSD,
      totalHKD: month.totalHKD,
      dividendCount: month.dividends.length,
      displayTotal: currency === 'USD' ? month.totalUSD : month.totalHKD,
      currency
    }));
    
    // Calculate yearly total
    const yearlyTotal = result.reduce(
      (sum, month) => sum + (currency === 'USD' ? month.totalUSD : month.totalHKD), 
      0
    );
    
    res.json({
      year,
      currency,
      exchangeRate,
      monthlyIncome: result,
      yearlyTotal
    });
  } catch (error) {
    console.error('Error in monthly income route:', error);
    res.status(500).json({ error: 'Failed to calculate monthly income' });
  }
});

/**
 * @route   GET /api/dividends/income/yearly
 * @desc    Get yearly dividend income
 * @access  Public
 */
router.get('/income/yearly', async (req, res) => {
  try {
    const { startYear = new Date().getFullYear() - 5, endYear = new Date().getFullYear(), currency = 'USD' } = req.query;
    
    // Validate years
    if (startYear > endYear) {
      return res.status(400).json({ error: 'Start year must be less than or equal to end year' });
    }
    
    // Get current exchange rate
    let exchangeRate = 1;
    if (currency === 'HKD') {
      const rateData = await ExchangeRate.findOne({
        fromCurrency: 'USD',
        toCurrency: 'HKD'
      }).sort({ date: -1 });
      
      if (rateData) {
        exchangeRate = rateData.rate;
      } else {
        // Fetch from Yahoo Finance if not in database
        exchangeRate = await yahooFinance.getExchangeRate('USD', 'HKD');
      }
    }
    
    // Calculate yearly income
    const yearlyIncome = [];
    
    for (let year = parseInt(startYear); year <= parseInt(endYear); year++) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);
      
      const dividends = await Dividend.find({
        paymentDate: { $gte: startDate, $lte: endDate }
      }).populate('stock');
      
      let totalUSD = 0;
      let totalHKD = 0;
      
      for (const dividend of dividends) {
        if (dividend.currency === 'USD') {
          totalUSD += dividend.totalAmount;
          totalHKD += dividend.totalAmount * exchangeRate;
        } else {
          totalHKD += dividend.totalAmount;
          totalUSD += dividend.totalAmount / exchangeRate;
        }
      }
      
      yearlyIncome.push({
        year,
        totalUSD,
        totalHKD,
        dividendCount: dividends.length,
        displayTotal: currency === 'USD' ? totalUSD : totalHKD,
        currency
      });
    }
    
    // Calculate grand total
    const grandTotal = yearlyIncome.reduce(
      (sum, year) => sum + (currency === 'USD' ? year.totalUSD : year.totalHKD), 
      0
    );
    
    res.json({
      startYear: parseInt(startYear),
      endYear: parseInt(endYear),
      currency,
      exchangeRate,
      yearlyIncome,
      grandTotal
    });
  } catch (error) {
    console.error('Error in yearly income route:', error);
    res.status(500).json({ error: 'Failed to calculate yearly income' });
  }
});

/**
 * @route   GET /api/dividends/upcoming
 * @desc    Get upcoming dividend payments
 * @access  Public
 */
router.get('/upcoming', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    // Calculate date range
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + parseInt(days));
    
    // Get upcoming dividends
    const dividends = await Dividend.find({
      paymentDate: { $gte: today, $lte: endDate }
    }).populate('stock').sort({ paymentDate: 1 });
    
    res.json(dividends);
  } catch (error) {
    console.error('Error in upcoming dividends route:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming dividends' });
  }
});

/**
 * @route   GET /api/dividends/forecast
 * @desc    Get dividend forecast
 * @access  Public
 */
router.get('/forecast', async (req, res) => {
  try {
    const { months = 12, currency = 'USD' } = req.query;
    
    // Get all holdings
    const holdings = await Holding.find().populate('stock');
    
    // Get current exchange rate
    let exchangeRate = 1;
    if (currency === 'HKD') {
      const rateData = await ExchangeRate.findOne({
        fromCurrency: 'USD',
        toCurrency: 'HKD'
      }).sort({ date: -1 });
      
      if (rateData) {
        exchangeRate = rateData.rate;
      } else {
        // Fetch from Yahoo Finance if not in database
        exchangeRate = await yahooFinance.getExchangeRate('USD', 'HKD');
      }
    }
    
    // Calculate forecast
    const forecast = [];
    const today = new Date();
    
    for (let i = 0; i < parseInt(months); i++) {
      const month = (today.getMonth() + i) % 12;
      const year = today.getFullYear() + Math.floor((today.getMonth() + i) / 12);
      
      const monthForecast = {
        month: month + 1,
        monthName: new Date(year, month, 1).toLocaleString('default', { month: 'long' }),
        year,
        totalUSD: 0,
        totalHKD: 0,
        dividends: []
      };
      
      // Calculate expected dividends for each holding
      for (const holding of holdings) {
        const stock = holding.stock;
        
        // Skip if no dividend yield
        if (!stock.dividendYield) continue;
        
        // Determine if this stock pays dividends in this month
        let paysDividendThisMonth = false;
        
        if (stock.dividendFrequency === 'Monthly') {
          paysDividendThisMonth = true;
        } else if (stock.dividendFrequency === 'Quarterly') {
          // Assume quarterly dividends in months 3, 6, 9, 12
          paysDividendThisMonth = (month + 1) % 3 === 0;
        } else if (stock.dividendFrequency === 'Semi-Annual') {
          // Assume semi-annual dividends in months 6 and 12
          paysDividendThisMonth = (month + 1) === 6 || (month + 1) === 12;
        } else if (stock.dividendFrequency === 'Annual') {
          // Assume annual dividends in month 12
          paysDividendThisMonth = (month + 1) === 12;
        } else if (stock.dividendFrequency === 'Weekly') {
          // For weekly dividends, calculate 4 weeks per month
          paysDividendThisMonth = true;
          // Multiply by 4 for weekly payments
          stock.dividendYield = stock.dividendYield * 4;
        }
        
        if (paysDividendThisMonth) {
          // Calculate expected dividend amount
          const annualDividendPerShare = (stock.currentPrice * stock.dividendYield) / 100;
          let dividendPerShare;
          
          if (stock.dividendFrequency === 'Monthly') {
            dividendPerShare = annualDividendPerShare / 12;
          } else if (stock.dividendFrequency === 'Quarterly') {
            dividendPerShare = annualDividendPerShare / 4;
          } else if (stock.dividendFrequency === 'Semi-Annual') {
            dividendPerShare = annualDividendPerShare / 2;
          } else if (stock.dividendFrequency === 'Annual') {
            dividendPerShare = annualDividendPerShare;
          } else if (stock.dividendFrequency === 'Weekly') {
            // For weekly, we already multiplied the yield by 4
            dividendPerShare = annualDividendPerShare / 12;
          }
          
          const totalAmount = dividendPerShare * holding.shares;
          
          // Convert to requested currency if needed
          let amountUSD = totalAmount;
          let amountHKD = totalAmount * exchangeRate;
          
          if (stock.currency === 'HKD') {
            amountUSD = totalAmount / exchangeRate;
            amountHKD = totalAmount;
          }
          
          monthForecast.totalUSD += amountUSD;
          monthForecast.totalHKD += amountHKD;
          
          monthForecast.dividends.push({
            stock: stock.symbol,
            name: stock.name,
            shares: holding.shares,
            dividendPerShare,
            totalAmount,
            currency: stock.currency,
            amountUSD,
            amountHKD
          });
        }
      }
      
      // Add display total based on requested currency
      monthForecast.displayTotal = currency === 'USD' ? monthForecast.totalUSD : monthForecast.totalHKD;
      monthForecast.currency = currency;
      
      forecast.push(monthForecast);
    }
    
    // Calculate total forecast
    const totalForecast = forecast.reduce(
      (sum, month) => sum + (currency === 'USD' ? month.totalUSD : month.totalHKD), 
      0
    );
    
    res.json({
      months: parseInt(months),
      currency,
      exchangeRate,
      forecast,
      totalForecast
    });
  } catch (error) {
    console.error('Error in dividend forecast route:', error);
    res.status(500).json({ error: 'Failed to calculate dividend forecast' });
  }
});

module.exports = router;
