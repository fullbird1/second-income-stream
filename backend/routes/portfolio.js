const express = require('express');
const router = express.Router();
const Portfolio = require('../models/Portfolio');
const Stock = require('../models/Stock');
const Holding = require('../models/Holding');
const yahooFinance = require('../utils/yahooFinance');

/**
 * @route   GET /api/portfolio
 * @desc    Get portfolio information
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    // Find the portfolio or create default if not exists
    let portfolio = await Portfolio.findOne();
    
    if (!portfolio) {
      portfolio = new Portfolio({
        totalInvestment: 165000,
        cashReserve: 24750, // 15% of total investment
        tier1Allocation: 90750, // 55% of total investment
        tier2Allocation: 41250, // 25% of total investment
        tier3Allocation: 8250, // 5% of total investment
        baseCurrency: 'USD'
      });
      
      await portfolio.save();
    }
    
    res.json(portfolio);
  } catch (error) {
    console.error('Error in get portfolio route:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio information' });
  }
});

/**
 * @route   PUT /api/portfolio
 * @desc    Update portfolio information
 * @access  Public
 */
router.put('/', async (req, res) => {
  try {
    const { totalInvestment, cashReserve, tier1Allocation, tier2Allocation, tier3Allocation, baseCurrency } = req.body;
    
    // Find the portfolio or create default if not exists
    let portfolio = await Portfolio.findOne();
    
    if (!portfolio) {
      portfolio = new Portfolio();
    }
    
    // Update fields if provided
    if (totalInvestment !== undefined) portfolio.totalInvestment = totalInvestment;
    if (cashReserve !== undefined) portfolio.cashReserve = cashReserve;
    if (tier1Allocation !== undefined) portfolio.tier1Allocation = tier1Allocation;
    if (tier2Allocation !== undefined) portfolio.tier2Allocation = tier2Allocation;
    if (tier3Allocation !== undefined) portfolio.tier3Allocation = tier3Allocation;
    if (baseCurrency !== undefined) portfolio.baseCurrency = baseCurrency;
    
    portfolio.lastUpdated = Date.now();
    await portfolio.save();
    
    res.json(portfolio);
  } catch (error) {
    console.error('Error in update portfolio route:', error);
    res.status(500).json({ error: 'Failed to update portfolio information' });
  }
});

/**
 * @route   GET /api/portfolio/holdings
 * @desc    Get all portfolio holdings
 * @access  Public
 */
router.get('/holdings', async (req, res) => {
  try {
    const holdings = await Holding.find().populate('stock');
    res.json(holdings);
  } catch (error) {
    console.error('Error in get holdings route:', error);
    res.status(500).json({ error: 'Failed to fetch holdings' });
  }
});

/**
 * @route   POST /api/portfolio/holdings
 * @desc    Add a new holding to the portfolio
 * @access  Public
 */
router.post('/holdings', async (req, res) => {
  try {
    const { stockId, shares, averageCostBasis, targetAllocationPercentage } = req.body;
    
    // Validate stock exists
    const stock = await Stock.findById(stockId);
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    
    // Get current stock price
    const quote = await yahooFinance.getStockQuote(stock.symbol);
    const currentPrice = quote.regularMarketPrice;
    const currentValue = currentPrice * shares;
    
    // Create new holding
    const newHolding = new Holding({
      stock: stockId,
      shares,
      averageCostBasis,
      currentValue,
      allocationPercentage: 0, // Will be calculated during rebalance
      targetAllocationPercentage,
      currency: stock.currency,
      purchaseDate: Date.now()
    });
    
    await newHolding.save();
    
    // Recalculate allocation percentages
    await recalculateAllocationPercentages();
    
    res.status(201).json(await Holding.findById(newHolding._id).populate('stock'));
  } catch (error) {
    console.error('Error in add holding route:', error);
    res.status(500).json({ error: 'Failed to add holding' });
  }
});

/**
 * @route   PUT /api/portfolio/holdings/:id
 * @desc    Update a holding
 * @access  Public
 */
router.put('/holdings/:id', async (req, res) => {
  try {
    const { shares, averageCostBasis, targetAllocationPercentage } = req.body;
    
    // Find the holding
    const holding = await Holding.findById(req.params.id);
    if (!holding) {
      return res.status(404).json({ error: 'Holding not found' });
    }
    
    // Update fields if provided
    if (shares !== undefined) holding.shares = shares;
    if (averageCostBasis !== undefined) holding.averageCostBasis = averageCostBasis;
    if (targetAllocationPercentage !== undefined) holding.targetAllocationPercentage = targetAllocationPercentage;
    
    // Update current value
    const stock = await Stock.findById(holding.stock);
    const quote = await yahooFinance.getStockQuote(stock.symbol);
    holding.currentValue = quote.regularMarketPrice * holding.shares;
    
    holding.lastUpdated = Date.now();
    await holding.save();
    
    // Recalculate allocation percentages
    await recalculateAllocationPercentages();
    
    res.json(await Holding.findById(holding._id).populate('stock'));
  } catch (error) {
    console.error('Error in update holding route:', error);
    res.status(500).json({ error: 'Failed to update holding' });
  }
});

/**
 * @route   DELETE /api/portfolio/holdings/:id
 * @desc    Delete a holding
 * @access  Public
 */
router.delete('/holdings/:id', async (req, res) => {
  try {
    const holding = await Holding.findById(req.params.id);
    if (!holding) {
      return res.status(404).json({ error: 'Holding not found' });
    }
    
    await Holding.findByIdAndDelete(req.params.id);
    
    // Recalculate allocation percentages
    await recalculateAllocationPercentages();
    
    res.json({ message: 'Holding deleted successfully' });
  } catch (error) {
    console.error('Error in delete holding route:', error);
    res.status(500).json({ error: 'Failed to delete holding' });
  }
});

/**
 * @route   GET /api/portfolio/rebalance
 * @desc    Get rebalancing recommendations
 * @access  Public
 */
router.get('/rebalance', async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne();
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    
    const holdings = await Holding.find().populate('stock');
    
    // Calculate total portfolio value (excluding cash)
    const totalValue = holdings.reduce((sum, holding) => sum + holding.currentValue, 0);
    
    // Calculate rebalancing recommendations
    const recommendations = [];
    
    for (const holding of holdings) {
      const currentAllocation = (holding.currentValue / totalValue) * 100;
      const targetAllocation = holding.targetAllocationPercentage;
      const difference = targetAllocation - currentAllocation;
      
      // If difference is significant (more than 1%), recommend rebalancing
      if (Math.abs(difference) > 1) {
        const action = difference > 0 ? 'Buy' : 'Sell';
        const amountToAdjust = Math.abs((difference / 100) * totalValue);
        const sharesCount = amountToAdjust / (holding.currentValue / holding.shares);
        
        recommendations.push({
          holdingId: holding._id,
          symbol: holding.stock.symbol,
          name: holding.stock.name,
          tier: holding.stock.tier,
          currentAllocation,
          targetAllocation,
          difference,
          action,
          amountToAdjust,
          sharesCount: Math.round(sharesCount * 100) / 100
        });
      }
    }
    
    // Sort recommendations by absolute difference (largest first)
    recommendations.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
    
    // Update last rebalanced date
    portfolio.lastRebalanced = Date.now();
    await portfolio.save();
    
    res.json({
      totalValue,
      cashReserve: portfolio.cashReserve,
      totalWithCash: totalValue + portfolio.cashReserve,
      recommendations
    });
  } catch (error) {
    console.error('Error in rebalance route:', error);
    res.status(500).json({ error: 'Failed to generate rebalancing recommendations' });
  }
});

/**
 * @route   GET /api/portfolio/tier/:tier
 * @desc    Get holdings by tier
 * @access  Public
 */
router.get('/tier/:tier', async (req, res) => {
  try {
    const tier = parseInt(req.params.tier);
    if (tier < 1 || tier > 3) {
      return res.status(400).json({ error: 'Invalid tier. Must be 1, 2, or 3.' });
    }
    
    // Find stocks in the specified tier
    const stocks = await Stock.find({ tier });
    const stockIds = stocks.map(stock => stock._id);
    
    // Find holdings for these stocks
    const holdings = await Holding.find({ stock: { $in: stockIds } }).populate('stock');
    
    // Calculate tier totals
    const tierTotal = holdings.reduce((sum, holding) => sum + holding.currentValue, 0);
    
    // Get portfolio for tier allocation
    const portfolio = await Portfolio.findOne();
    let tierAllocation = 0;
    
    if (portfolio) {
      if (tier === 1) tierAllocation = portfolio.tier1Allocation;
      else if (tier === 2) tierAllocation = portfolio.tier2Allocation;
      else if (tier === 3) tierAllocation = portfolio.tier3Allocation;
    }
    
    res.json({
      tier,
      holdings,
      tierTotal,
      tierAllocation,
      difference: tierTotal - tierAllocation
    });
  } catch (error) {
    console.error(`Error in get tier ${req.params.tier} route:`, error);
    res.status(500).json({ error: `Failed to fetch tier ${req.params.tier} holdings` });
  }
});

/**
 * @route   GET /api/portfolio/update-prices
 * @desc    Update all holding prices
 * @access  Public
 */
router.get('/update-prices', async (req, res) => {
  try {
    const holdings = await Holding.find().populate('stock');
    
    // Get all symbols
    const symbols = holdings.map(holding => holding.stock.symbol);
    
    // Get batch quotes
    const quotes = await yahooFinance.getBatchQuotes(symbols);
    
    // Update holdings
    for (const holding of holdings) {
      const symbol = holding.stock.symbol;
      if (quotes[symbol]) {
        const currentPrice = quotes[symbol].regularMarketPrice;
        holding.currentValue = currentPrice * holding.shares;
        await holding.save();
        
        // Also update stock price
        await Stock.findByIdAndUpdate(holding.stock._id, {
          currentPrice,
          lastUpdated: Date.now()
        });
      }
    }
    
    // Recalculate allocation percentages
    await recalculateAllocationPercentages();
    
    res.json({ message: 'Prices updated successfully' });
  } catch (error) {
    console.error('Error in update prices route:', error);
    res.status(500).json({ error: 'Failed to update prices' });
  }
});

/**
 * Recalculate allocation percentages for all holdings
 */
async function recalculateAllocationPercentages() {
  try {
    const holdings = await Holding.find();
    
    // Calculate total portfolio value
    const totalValue = holdings.reduce((sum, holding) => sum + holding.currentValue, 0);
    
    // Update allocation percentages
    for (const holding of holdings) {
      holding.allocationPercentage = (holding.currentValue / totalValue) * 100;
      await holding.save();
    }
  } catch (error) {
    console.error('Error recalculating allocation percentages:', error);
    throw error;
  }
}

module.exports = router;
