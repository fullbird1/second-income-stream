const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/second_income_stream', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// API Routes
const stockRoutes = require('./routes/stocks');
const stocksManagementRoutes = require('./routes/stocksManagement');
const portfolioRoutes = require('./routes/portfolio');
const exchangeRatesRoutes = require('./routes/exchangeRates');
const dividendsRoutes = require('./routes/dividends');

app.use('/api/stocks', stockRoutes);
app.use('/api/stocks-management', stocksManagementRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/exchange-rates', exchangeRatesRoutes);
app.use('/api/dividends', dividendsRoutes);

// Add the additional stocks to the initialization route
const Stock = require('./models/Stock');

// Function to add additional stocks
const addAdditionalStocks = async () => {
  try {
    // Check if we need to add the additional stocks
    const additionalStocksExist = await Stock.findOne({ symbol: 'GOOGL' });
    
    if (!additionalStocksExist) {
      console.log('Adding additional stocks requested by user...');
      
      const additionalStocks = [
        // Additional stocks requested by user
        { 
          symbol: 'TSPY', 
          name: 'T. Rowe Price Dividend Growth ETF', 
          tier: 2, 
          tierCategory: 'Index-Based Funds',
          dividendYield: 18.5,
          dividendFrequency: 'Monthly',
          currentPrice: 25.75,
          currency: 'USD',
          riskLevel: 'Moderate'
        },
        { 
          symbol: 'SPYI', 
          name: 'NEOS S&P 500 High Income ETF', 
          tier: 2, 
          tierCategory: 'Index-Based Funds',
          dividendYield: 22.3,
          dividendFrequency: 'Monthly',
          currentPrice: 48.92,
          currency: 'USD',
          riskLevel: 'Moderate'
        },
        { 
          symbol: 'QQQI', 
          name: 'NEOS Nasdaq 100 High Income ETF', 
          tier: 2, 
          tierCategory: 'Index-Based Funds',
          dividendYield: 24.1,
          dividendFrequency: 'Monthly',
          currentPrice: 51.35,
          currency: 'USD',
          riskLevel: 'Moderate'
        },
        { 
          symbol: 'XPAY', 
          name: 'NEOS Enhanced Income Aggregate Bond ETF', 
          tier: 1, 
          tierCategory: 'Anchor Funds',
          dividendYield: 9.8,
          dividendFrequency: 'Monthly',
          currentPrice: 45.67,
          currency: 'USD',
          riskLevel: 'Low'
        },
        { 
          symbol: 'IWMI', 
          name: 'iShares Russell 2000 ETF', 
          tier: 2, 
          tierCategory: 'Index-Based Funds',
          dividendYield: 19.5,
          dividendFrequency: 'Quarterly',
          currentPrice: 38.45,
          currency: 'USD',
          riskLevel: 'Moderate'
        },
        { 
          symbol: 'IYRI', 
          name: 'iShares ESG Screened S&P 500 ETF', 
          tier: 1, 
          tierCategory: 'Anchor Funds',
          dividendYield: 8.7,
          dividendFrequency: 'Quarterly',
          currentPrice: 42.18,
          currency: 'USD',
          riskLevel: 'Low'
        },
        { 
          symbol: 'GIAX', 
          name: 'Goldman Sachs MarketBeta US Equity ETF', 
          tier: 1, 
          tierCategory: 'Anchor Funds',
          dividendYield: 7.9,
          dividendFrequency: 'Quarterly',
          currentPrice: 65.32,
          currency: 'USD',
          riskLevel: 'Low'
        },
        { 
          symbol: 'EIC', 
          name: 'Eagle Point Income Company', 
          tier: 1, 
          tierCategory: 'Anchor Funds',
          dividendYield: 14.2,
          dividendFrequency: 'Monthly',
          currentPrice: 16.75,
          currency: 'USD',
          riskLevel: 'Moderate'
        },
        { 
          symbol: 'RDTE', 
          name: 'Roundhill Daily Russell 2000 ETF', 
          tier: 2, 
          tierCategory: 'Index-Based Funds',
          dividendYield: 35.8,
          dividendFrequency: 'Weekly',
          currentPrice: 22.45,
          currency: 'USD',
          riskLevel: 'High'
        },
        { 
          symbol: 'GOOGL', 
          name: 'Alphabet Inc.', 
          tier: 1, 
          tierCategory: 'Anchor Funds',
          dividendYield: 0.0,
          dividendFrequency: 'None',
          currentPrice: 175.85,
          currency: 'USD',
          riskLevel: 'Moderate'
        },
        { 
          symbol: 'AMZN', 
          name: 'Amazon.com Inc.', 
          tier: 1, 
          tierCategory: 'Anchor Funds',
          dividendYield: 0.0,
          dividendFrequency: 'None',
          currentPrice: 185.07,
          currency: 'USD',
          riskLevel: 'Moderate'
        },
        { 
          symbol: 'SCHG', 
          name: 'Schwab U.S. Large-Cap Growth ETF', 
          tier: 1, 
          tierCategory: 'Anchor Funds',
          dividendYield: 0.5,
          dividendFrequency: 'Quarterly',
          currentPrice: 92.35,
          currency: 'USD',
          riskLevel: 'Low'
        },
        { 
          symbol: 'PLTY', 
          name: 'YieldMax PLTR Option Income Strategy ETF', 
          tier: 3, 
          tierCategory: 'High-Yield Funds',
          dividendYield: 45.2,
          dividendFrequency: 'Monthly',
          currentPrice: 18.65,
          currency: 'USD',
          riskLevel: 'High'
        },
        { 
          symbol: 'MSTY', 
          name: 'YieldMax MSFT Option Income Strategy ETF', 
          tier: 3, 
          tierCategory: 'High-Yield Funds',
          dividendYield: 42.8,
          dividendFrequency: 'Monthly',
          currentPrice: 19.25,
          currency: 'USD',
          riskLevel: 'High'
        },
        { 
          symbol: 'TSYY', 
          name: 'YieldMax TSLA Option Income Strategy ETF', 
          tier: 3, 
          tierCategory: 'High-Yield Funds',
          dividendYield: 48.5,
          dividendFrequency: 'Monthly',
          currentPrice: 15.85,
          currency: 'USD',
          riskLevel: 'Very High'
        },
        { 
          symbol: 'AIPI', 
          name: 'YieldMax AI Option Income Strategy ETF', 
          tier: 3, 
          tierCategory: 'High-Yield Funds',
          dividendYield: 52.3,
          dividendFrequency: 'Monthly',
          currentPrice: 17.45,
          currency: 'USD',
          riskLevel: 'Very High'
        },
        { 
          symbol: 'HOOD', 
          name: 'Robinhood Markets, Inc.', 
          tier: 1, 
          tierCategory: 'Anchor Funds',
          dividendYield: 0.0,
          dividendFrequency: 'None',
          currentPrice: 22.85,
          currency: 'USD',
          riskLevel: 'High'
        },
        { 
          symbol: 'HIMS', 
          name: 'Hims & Hers Health, Inc.', 
          tier: 1, 
          tierCategory: 'Anchor Funds',
          dividendYield: 0.0,
          dividendFrequency: 'None',
          currentPrice: 18.95,
          currency: 'USD',
          riskLevel: 'High'
        },
        { 
          symbol: 'S', 
          name: 'SentinelOne, Inc.', 
          tier: 1, 
          tierCategory: 'Anchor Funds',
          dividendYield: 0.0,
          dividendFrequency: 'None',
          currentPrice: 23.15,
          currency: 'USD',
          riskLevel: 'High'
        },
        { 
          symbol: 'NFLP', 
          name: 'YieldMax NFLX Option Income Strategy ETF', 
          tier: 3, 
          tierCategory: 'High-Yield Funds',
          dividendYield: 44.7,
          dividendFrequency: 'Monthly',
          currentPrice: 16.85,
          currency: 'USD',
          riskLevel: 'High'
        },
        { 
          symbol: 'SVOL', 
          name: 'Simplify Volatility Premium ETF', 
          tier: 2, 
          tierCategory: 'Index-Based Funds',
          dividendYield: 28.5,
          dividendFrequency: 'Monthly',
          currentPrice: 24.35,
          currency: 'USD',
          riskLevel: 'High'
        },
        { 
          symbol: 'NBIS', 
          name: 'Neuberger Berman Income Strategy ETF', 
          tier: 1, 
          tierCategory: 'Anchor Funds',
          dividendYield: 9.8,
          dividendFrequency: 'Monthly',
          currentPrice: 26.75,
          currency: 'USD',
          riskLevel: 'Moderate'
        },
        { 
          symbol: 'BX', 
          name: 'Blackstone Inc.', 
          tier: 1, 
          tierCategory: 'Anchor Funds',
          dividendYield: 3.2,
          dividendFrequency: 'Quarterly',
          currentPrice: 125.45,
          currency: 'USD',
          riskLevel: 'Moderate'
        },
        { 
          symbol: 'AMDL', 
          name: 'YieldMax AMD Option Income Strategy ETF', 
          tier: 3, 
          tierCategory: 'High-Yield Funds',
          dividendYield: 46.8,
          dividendFrequency: 'Monthly',
          currentPrice: 17.25,
          currency: 'USD',
          riskLevel: 'High'
        },
        { 
          symbol: 'UPRO', 
          name: 'ProShares UltraPro S&P 500 ETF', 
          tier: 2, 
          tierCategory: 'Index-Based Funds',
          dividendYield: 0.5,
          dividendFrequency: 'Quarterly',
          currentPrice: 68.95,
          currency: 'USD',
          riskLevel: 'Very High'
        },
        { 
          symbol: 'MSTU', 
          name: 'YieldMax MSFT Option Income Strategy ETF', 
          tier: 3, 
          tierCategory: 'High-Yield Funds',
          dividendYield: 43.5,
          dividendFrequency: 'Monthly',
          currentPrice: 18.75,
          currency: 'USD',
          riskLevel: 'High'
        },
        { 
          symbol: 'XYZY', 
          name: 'YieldMax XYZ Option Income Strategy ETF', 
          tier: 3, 
          tierCategory: 'High-Yield Funds',
          dividendYield: 47.2,
          dividendFrequency: 'Monthly',
          currentPrice: 16.35,
          currency: 'USD',
          riskLevel: 'High'
        }
      ];
      
      await Stock.insertMany(additionalStocks);
      console.log('Additional stocks added successfully');
    }
  } catch (error) {
    console.error('Error adding additional stocks:', error);
  }
};

// Call the function to add additional stocks
addAdditionalStocks();

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../frontend/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
  });
}

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
