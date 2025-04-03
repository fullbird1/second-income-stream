const yahooFinance = require('yahoo-finance2').default;
const NodeCache = require('node-cache');
const axios = require('axios');

// Initialize cache with standard TTL of 7 days (weekly updates)
const stockCache = new NodeCache({ stdTTL: 604800 }); // 7 days in seconds

/**
 * Get stock quote data from Yahoo Finance with caching
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Object>} - Stock quote data
 */
async function getStockQuote(symbol) {
  const cacheKey = `quote_${symbol}`;
  
  // Check if data exists in cache
  const cachedData = stockCache.get(cacheKey);
  if (cachedData) {
    console.log(`Using cached data for ${symbol}`);
    return cachedData;
  }
  
  try {
    console.log(`Fetching fresh data for ${symbol}`);
    const quote = await yahooFinance.quote(symbol);
    
    // Store in cache
    stockCache.set(cacheKey, quote);
    
    return quote;
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Get historical dividend data for a stock
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Array>} - Historical dividend data
 */
async function getDividendHistory(symbol) {
  const cacheKey = `dividends_${symbol}`;
  
  // Check if data exists in cache
  const cachedData = stockCache.get(cacheKey);
  if (cachedData) {
    console.log(`Using cached dividend data for ${symbol}`);
    return cachedData;
  }
  
  try {
    console.log(`Fetching fresh dividend data for ${symbol}`);
    
    // Use quote module to get basic stock info
    const quote = await yahooFinance.quote(symbol);
    
    // Create a simple dividend data structure with estimated next payment
    // This is a workaround since the Yahoo Finance API has limitations with dividend history
    const currentDate = new Date();
    const dividendData = [];
    
    if (quote && quote.dividendRate && quote.dividendYield) {
      // If we have dividend information, create estimated entries
      const dividendFrequency = estimateDividendFrequency(symbol);
      const dividendAmount = quote.dividendRate / dividendFrequency;
      
      // Create estimated future dividend dates
      for (let i = 0; i < dividendFrequency; i++) {
        const estimatedDate = new Date();
        estimatedDate.setMonth(currentDate.getMonth() + (12 / dividendFrequency) * (i + 1));
        
        dividendData.push({
          date: estimatedDate,
          amount: dividendAmount,
          symbol: symbol,
          estimated: true
        });
      }
    }
    
    // Store in cache
    stockCache.set(cacheKey, dividendData);
    
    return dividendData;
  } catch (error) {
    console.error(`Error fetching dividend history for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Estimate dividend frequency based on stock symbol
 * @param {string} symbol - Stock symbol
 * @returns {number} - Estimated number of dividends per year
 */
function estimateDividendFrequency(symbol) {
  // Default to quarterly dividends
  let frequency = 4;
  
  // Adjust based on known patterns for specific stocks
  const tierOneStocks = ['CLM', 'CRF', 'YYY', 'REM', 'GOF', 'ECC', 'USA', 'GUT', 'BXMT', 'PSEC', 'BCAT'];
  const tierTwoStocks = ['QQQY', 'WDTE', 'IWMY', 'SPYT', 'QQQT', 'USOY'];
  const tierThreeStocks = ['YMAX', 'YMAG', 'ULTY'];
  
  // Monthly dividend payers
  if (['CLM', 'CRF', 'PSEC', 'YYY', 'ECC'].includes(symbol)) {
    frequency = 12;
  }
  // Weekly dividend payers
  else if (['QQQY', 'WDTE', 'IWMY'].includes(symbol)) {
    frequency = 52;
  }
  
  return frequency;
}

/**
 * Get exchange rate from Yahoo Finance
 * @param {string} fromCurrency - Source currency code (e.g., 'USD')
 * @param {string} toCurrency - Target currency code (e.g., 'HKD')
 * @returns {Promise<number>} - Exchange rate
 */
async function getExchangeRate(fromCurrency, toCurrency) {
  const cacheKey = `exchange_${fromCurrency}_${toCurrency}`;
  
  // Check if data exists in cache
  const cachedData = stockCache.get(cacheKey);
  if (cachedData) {
    console.log(`Using cached exchange rate for ${fromCurrency}/${toCurrency}`);
    return cachedData;
  }
  
  try {
    console.log(`Fetching fresh exchange rate for ${fromCurrency}/${toCurrency}`);
    const symbol = `${fromCurrency}${toCurrency}=X`;
    const quote = await yahooFinance.quote(symbol);
    
    // Store in cache
    stockCache.set(cacheKey, quote.regularMarketPrice);
    
    return quote.regularMarketPrice;
  } catch (error) {
    console.error(`Error fetching exchange rate for ${fromCurrency}/${toCurrency}:`, error);
    throw error;
  }
}

/**
 * Get multiple stock quotes in a batch
 * @param {Array<string>} symbols - Array of stock symbols
 * @returns {Promise<Object>} - Object with stock symbols as keys and quote data as values
 */
async function getBatchQuotes(symbols) {
  const result = {};
  const uncachedSymbols = [];
  
  // Check cache first for each symbol
  for (const symbol of symbols) {
    const cacheKey = `quote_${symbol}`;
    const cachedData = stockCache.get(cacheKey);
    
    if (cachedData) {
      result[symbol] = cachedData;
    } else {
      uncachedSymbols.push(symbol);
    }
  }
  
  // Fetch uncached symbols
  if (uncachedSymbols.length > 0) {
    try {
      const quotes = await yahooFinance.quote(uncachedSymbols);
      
      // Handle both single quote and array of quotes
      if (Array.isArray(quotes)) {
        quotes.forEach(quote => {
          const symbol = quote.symbol;
          result[symbol] = quote;
          stockCache.set(`quote_${symbol}`, quote);
        });
      } else if (quotes && quotes.symbol) {
        const symbol = quotes.symbol;
        result[symbol] = quotes;
        stockCache.set(`quote_${symbol}`, quotes);
      }
    } catch (error) {
      console.error('Error fetching batch quotes:', error);
      throw error;
    }
  }
  
  return result;
}

/**
 * Force refresh of cached data for a symbol
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Object>} - Fresh stock data
 */
async function refreshStockData(symbol) {
  try {
    // Clear existing cache for this symbol
    stockCache.del(`quote_${symbol}`);
    stockCache.del(`dividends_${symbol}`);
    
    // Fetch fresh data
    const quote = await getStockQuote(symbol);
    await getDividendHistory(symbol);
    
    return quote;
  } catch (error) {
    console.error(`Error refreshing data for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Clear all cached data
 */
function clearCache() {
  stockCache.flushAll();
  console.log('Cache cleared');
}

module.exports = {
  getStockQuote,
  getDividendHistory,
  getExchangeRate,
  getBatchQuotes,
  refreshStockData,
  clearCache
};
