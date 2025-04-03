const express = require('express');
const router = express.Router();
const Stock = require('../models/Stock');
const yahooFinance = require('../utils/yahooFinance');

/**
 * @route   GET /api/stocks
 * @desc    Get all stocks
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const stocks = await Stock.find();
    res.json(stocks);
  } catch (error) {
    console.error('Error in get all stocks route:', error);
    res.status(500).json({ error: 'Failed to fetch stocks' });
  }
});

/**
 * @route   GET /api/stocks/tier/:tier
 * @desc    Get stocks by tier
 * @access  Public
 */
router.get('/tier/:tier', async (req, res) => {
  try {
    const tier = parseInt(req.params.tier);
    if (tier < 1 || tier > 3) {
      return res.status(400).json({ error: 'Invalid tier. Must be 1, 2, or 3.' });
    }
    
    const stocks = await Stock.find({ tier });
    res.json(stocks);
  } catch (error) {
    console.error(`Error in get tier ${req.params.tier} stocks route:`, error);
    res.status(500).json({ error: `Failed to fetch tier ${req.params.tier} stocks` });
  }
});

/**
 * @route   POST /api/stocks
 * @desc    Add a new stock
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const { 
      symbol, 
      name, 
      tier, 
      tierCategory, 
      subCategory, 
      dividendYield, 
      dividendFrequency,
      description,
      riskLevel
    } = req.body;
    
    // Check if stock already exists
    const existingStock = await Stock.findOne({ symbol });
    if (existingStock) {
      return res.status(400).json({ error: 'Stock already exists' });
    }
    
    // Get current price from Yahoo Finance
    const quote = await yahooFinance.getStockQuote(symbol);
    
    // Create new stock
    const newStock = new Stock({
      symbol,
      name,
      tier,
      tierCategory,
      subCategory,
      currentPrice: quote.regularMarketPrice,
      currency: 'USD', // Default to USD
      dividendYield,
      dividendFrequency,
      description,
      riskLevel
    });
    
    await newStock.save();
    res.status(201).json(newStock);
  } catch (error) {
    console.error('Error in add stock route:', error);
    res.status(500).json({ error: 'Failed to add stock' });
  }
});

/**
 * @route   PUT /api/stocks/:id
 * @desc    Update a stock
 * @access  Public
 */
router.put('/:id', async (req, res) => {
  try {
    const { 
      name, 
      tier, 
      tierCategory, 
      subCategory, 
      dividendYield, 
      dividendFrequency,
      nextDividendDate,
      description,
      riskLevel
    } = req.body;
    
    // Find the stock
    const stock = await Stock.findById(req.params.id);
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    
    // Update fields if provided
    if (name) stock.name = name;
    if (tier) stock.tier = tier;
    if (tierCategory) stock.tierCategory = tierCategory;
    if (subCategory) stock.subCategory = subCategory;
    if (dividendYield) stock.dividendYield = dividendYield;
    if (dividendFrequency) stock.dividendFrequency = dividendFrequency;
    if (nextDividendDate) stock.nextDividendDate = nextDividendDate;
    if (description) stock.description = description;
    if (riskLevel) stock.riskLevel = riskLevel;
    
    stock.lastUpdated = Date.now();
    await stock.save();
    
    res.json(stock);
  } catch (error) {
    console.error('Error in update stock route:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

/**
 * @route   DELETE /api/stocks/:id
 * @desc    Delete a stock
 * @access  Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    
    await Stock.findByIdAndDelete(req.params.id);
    res.json({ message: 'Stock deleted successfully' });
  } catch (error) {
    console.error('Error in delete stock route:', error);
    res.status(500).json({ error: 'Failed to delete stock' });
  }
});

/**
 * @route   GET /api/stocks/initialize
 * @desc    Initialize stocks from Second Income Stream strategy
 * @access  Public
 */
router.get('/initialize', async (req, res) => {
  try {
    // Check if stocks already exist
    const existingCount = await Stock.countDocuments();
    if (existingCount > 0) {
      return res.status(400).json({ 
        error: 'Stocks already initialized', 
        count: existingCount 
      });
    }
    
    // Define stocks from Second Income Stream strategy
    const stocks = [
      // Tier 1: Anchor Funds
      { 
        symbol: 'CLM', 
        name: 'Cornerstone Strategic Value Fund', 
        tier: 1, 
        tierCategory: 'Anchor Funds',
        subCategory: 'Mandatory Starting Position',
        dividendYield: 17.88,
        dividendFrequency: 'Monthly',
        description: 'A closed-end fund with high dividend yield, mandatory starting position',
        riskLevel: 'Moderate'
      },
      { 
        symbol: 'CRF', 
        name: 'Cornerstone Total Return Fund', 
        tier: 1, 
        tierCategory: 'Anchor Funds',
        subCategory: 'Mandatory Starting Position',
        dividendYield: 19.55,
        dividendFrequency: 'Monthly',
        description: 'A closed-end fund with high dividend yield, mandatory starting position',
        riskLevel: 'Moderate'
      },
      { 
        symbol: 'YYY', 
        name: 'Amplify High Income ETF', 
        tier: 1, 
        tierCategory: 'Anchor Funds',
        subCategory: 'Other Anchor Funds',
        dividendYield: 10.5,
        dividendFrequency: 'Monthly',
        description: 'ETF that invests in closed-end funds',
        riskLevel: 'Moderate'
      },
      { 
        symbol: 'REM', 
        name: 'iShares Mortgage Real Estate ETF', 
        tier: 1, 
        tierCategory: 'Anchor Funds',
        subCategory: 'Other Anchor Funds',
        dividendYield: 9.8,
        dividendFrequency: 'Quarterly',
        description: 'ETF focused on mortgage REITs',
        riskLevel: 'Moderate'
      },
      { 
        symbol: 'GOF', 
        name: 'Guggenheim Strategic Opportunities Fund', 
        tier: 1, 
        tierCategory: 'Anchor Funds',
        subCategory: 'Other Anchor Funds',
        dividendYield: 12.30,
        dividendFrequency: 'Monthly',
        description: 'Flexible strategy across fixed-income and equity securities',
        riskLevel: 'Moderate'
      },
      { 
        symbol: 'ECC', 
        name: 'Eagle Point Credit Company', 
        tier: 1, 
        tierCategory: 'Anchor Funds',
        subCategory: 'Other Anchor Funds',
        dividendYield: 15.40,
        dividendFrequency: 'Monthly',
        description: 'Invests primarily in equity and junior debt tranches of CLOs',
        riskLevel: 'Moderate'
      },
      { 
        symbol: 'USA', 
        name: 'Liberty All-Star Equity Fund', 
        tier: 1, 
        tierCategory: 'Anchor Funds',
        subCategory: 'Other Anchor Funds',
        dividendYield: 9.5,
        dividendFrequency: 'Quarterly',
        description: 'Closed-end fund investing in US equities',
        riskLevel: 'Moderate'
      },
      { 
        symbol: 'GUT', 
        name: 'Gabelli Utility Trust', 
        tier: 1, 
        tierCategory: 'Anchor Funds',
        subCategory: 'Other Anchor Funds',
        dividendYield: 8.2,
        dividendFrequency: 'Monthly',
        description: 'Closed-end fund focusing on utility companies',
        riskLevel: 'Low'
      },
      { 
        symbol: 'BXMT', 
        name: 'Blackstone Mortgage Trust', 
        tier: 1, 
        tierCategory: 'Anchor Funds',
        subCategory: 'Other Anchor Funds',
        dividendYield: 11.2,
        dividendFrequency: 'Quarterly',
        description: 'REIT focusing on senior mortgage loans',
        riskLevel: 'Moderate'
      },
      { 
        symbol: 'PSEC', 
        name: 'Prospect Capital Corporation', 
        tier: 1, 
        tierCategory: 'Anchor Funds',
        subCategory: 'Other Anchor Funds',
        dividendYield: 12.80,
        dividendFrequency: 'Monthly',
        description: 'Business development company providing debt and equity capital',
        riskLevel: 'Moderate'
      },
      { 
        symbol: 'BCAT', 
        name: 'BlackRock Capital Allocation Trust', 
        tier: 1, 
        tierCategory: 'Anchor Funds',
        subCategory: 'Other Anchor Funds',
        dividendYield: 9.3,
        dividendFrequency: 'Monthly',
        description: 'Closed-end fund with flexible capital allocation strategy',
        riskLevel: 'Moderate'
      },
      
      // Tier 2: Index-Based Funds
      { 
        symbol: 'QQQY', 
        name: 'Defiance Nasdaq 100 Enhanced Options & 0DTE Income ETF', 
        tier: 2, 
        tierCategory: 'Index-Based Funds',
        subCategory: 'Recommended Starting Position',
        dividendYield: 90.06,
        dividendFrequency: 'Weekly',
        description: 'Uses daily options on Nasdaq 100 for weekly income',
        riskLevel: 'High'
      },
      { 
        symbol: 'WDTE', 
        name: 'Defiance S&P 500 Enhanced Options & 0DTE Income ETF', 
        tier: 2, 
        tierCategory: 'Index-Based Funds',
        subCategory: 'Recommended Starting Position',
        dividendYield: 65.00,
        dividendFrequency: 'Weekly',
        description: 'Uses daily options on S&P 500 for weekly income',
        riskLevel: 'High'
      },
      { 
        symbol: 'IWMY', 
        name: 'Defiance R2000 Enhanced Options & 0DTE Income ETF', 
        tier: 2, 
        tierCategory: 'Index-Based Funds',
        subCategory: 'Recommended Starting Position',
        dividendYield: 73.08,
        dividendFrequency: 'Weekly',
        description: 'Uses daily options on Russell 2000 for weekly income',
        riskLevel: 'High'
      },
      { 
        symbol: 'SPYT', 
        name: 'Defiance S&P 500 Enhanced Options Income ETF', 
        tier: 2, 
        tierCategory: 'Index-Based Funds',
        subCategory: 'Other Tier 2 Funds',
        dividendYield: 20.02,
        dividendFrequency: 'Monthly',
        description: 'Lower yield with less price erosion than higher-tier options',
        riskLevel: 'Moderate'
      },
      { 
        symbol: 'QQQT', 
        name: 'Defiance Nasdaq-100 Enhanced Options Income ETF', 
        tier: 2, 
        tierCategory: 'Index-Based Funds',
        subCategory: 'Other Tier 2 Funds',
        dividendYield: 20.02,
        dividendFrequency: 'Monthly',
        description: 'Lower yield with less price erosion than higher-tier options',
        riskLevel: 'Moderate'
      },
      { 
        symbol: 'USOY', 
        name: 'United States Oil ETF Options Income ETF', 
        tier: 2, 
        tierCategory: 'Index-Based Funds',
        subCategory: 'Other Tier 2 Funds',
        dividendYield: 25.5,
        dividendFrequency: 'Monthly',
        description: 'Options income strategy based on oil ETFs',
        riskLevel: 'High'
      },
      
      // Tier 3: High-Yield Funds
      { 
        symbol: 'YMAX', 
        name: 'YieldMax Universe Fund of Option Income ETFs', 
        tier: 3, 
        tierCategory: 'High-Yield Funds',
        subCategory: null,
        dividendYield: 68.44,
        dividendFrequency: 'Monthly',
        description: 'A fund of funds that invests in multiple YieldMax option income ETFs',
        riskLevel: 'High'
      },
      { 
        symbol: 'YMAG', 
        name: 'YieldMax Magnificent 7 Fund of Option Income ETFs', 
        tier: 3, 
        tierCategory: 'High-Yield Funds',
        subCategory: null,
        dividendYield: 38.65,
        dividendFrequency: 'Monthly',
        description: 'Focuses on option income from the Magnificent 7 tech stocks',
        riskLevel: 'High'
      },
      { 
        symbol: 'ULTY', 
        name: 'YieldMax Ultra Income ETF', 
        tier: 3, 
        tierCategory: 'High-Yield Funds',
        subCategory: null,
        dividendYield: 77.62,
        dividendFrequency: 'Monthly',
        description: 'Actively managed ETF seeking monthly income from covered call strategies',
        riskLevel: 'Very High'
      }
    ];
    
    // Get current prices from Yahoo Finance
    const symbols = stocks.map(stock => stock.symbol);
    const quotes = await yahooFinance.getBatchQuotes(symbols);
    
    // Create stocks with current prices
    const stocksToCreate = stocks.map(stock => {
      const quote = quotes[stock.symbol];
      return {
        ...stock,
        currentPrice: quote ? quote.regularMarketPrice : 0,
        currency: 'USD'
      };
    });
    
    await Stock.insertMany(stocksToCreate);
    
    res.status(201).json({ 
      message: 'Stocks initialized successfully', 
      count: stocksToCreate.length 
    });
  } catch (error) {
    console.error('Error in initialize stocks route:', error);
    res.status(500).json({ error: 'Failed to initialize stocks' });
  }
});

/**
 * @route   GET /api/stocks/update-prices
 * @desc    Update all stock prices
 * @access  Public
 */
router.get('/update-prices', async (req, res) => {
  try {
    const stocks = await Stock.find();
    
    // Get all symbols
    const symbols = stocks.map(stock => stock.symbol);
    
    // Get batch quotes
    const quotes = await yahooFinance.getBatchQuotes(symbols);
    
    // Update stocks
    for (const stock of stocks) {
      if (quotes[stock.symbol]) {
        stock.currentPrice = quotes[stock.symbol].regularMarketPrice;
        stock.lastUpdated = Date.now();
        await stock.save();
      }
    }
    
    res.json({ message: 'Stock prices updated successfully' });
  } catch (error) {
    console.error('Error in update stock prices route:', error);
    res.status(500).json({ error: 'Failed to update stock prices' });
  }
});

module.exports = router;
