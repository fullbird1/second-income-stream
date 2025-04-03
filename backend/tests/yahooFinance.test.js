// Test script for Yahoo Finance integration
const yahooFinance = require('../utils/yahooFinance');

// List of stocks from the Second Income Stream strategy
const tierOneStocks = ['CLM', 'CRF', 'YYY', 'REM', 'GOF', 'ECC', 'USA', 'GUT', 'BXMT', 'PSEC', 'BCAT'];
const tierTwoStocks = ['QQQY', 'WDTE', 'IWMY', 'SPYT', 'QQQT', 'USOY'];
const tierThreeStocks = ['YMAX', 'YMAG', 'ULTY'];

// All stocks combined
const allStocks = [...tierOneStocks, ...tierTwoStocks, ...tierThreeStocks];

// Test exchange rate
async function testExchangeRate() {
  try {
    console.log('Testing USD to HKD exchange rate...');
    const rate = await yahooFinance.getExchangeRate('USD', 'HKD');
    console.log(`Current USD to HKD exchange rate: ${rate}`);
    return true;
  } catch (error) {
    console.error('Exchange rate test failed:', error);
    return false;
  }
}

// Test batch quotes
async function testBatchQuotes() {
  try {
    console.log('Testing batch quotes for Tier 1 stocks...');
    const tier1Quotes = await yahooFinance.getBatchQuotes(tierOneStocks);
    console.log(`Retrieved ${Object.keys(tier1Quotes).length} Tier 1 stock quotes`);
    
    console.log('Testing batch quotes for Tier 2 stocks...');
    const tier2Quotes = await yahooFinance.getBatchQuotes(tierTwoStocks);
    console.log(`Retrieved ${Object.keys(tier2Quotes).length} Tier 2 stock quotes`);
    
    console.log('Testing batch quotes for Tier 3 stocks...');
    const tier3Quotes = await yahooFinance.getBatchQuotes(tierThreeStocks);
    console.log(`Retrieved ${Object.keys(tier3Quotes).length} Tier 3 stock quotes`);
    
    return true;
  } catch (error) {
    console.error('Batch quotes test failed:', error);
    return false;
  }
}

// Test dividend history
async function testDividendHistory() {
  try {
    // Test with a few stocks known to pay dividends
    const dividendStocks = ['CLM', 'CRF', 'PSEC'];
    
    for (const symbol of dividendStocks) {
      console.log(`Testing dividend history for ${symbol}...`);
      const dividends = await yahooFinance.getDividendHistory(symbol);
      console.log(`Retrieved ${dividends.length} dividend records for ${symbol}`);
    }
    
    return true;
  } catch (error) {
    console.error('Dividend history test failed:', error);
    return false;
  }
}

// Test cache functionality
async function testCaching() {
  try {
    console.log('Testing cache functionality...');
    
    // First call should fetch from Yahoo Finance
    console.log('First call (should fetch from Yahoo Finance):');
    const firstCall = await yahooFinance.getStockQuote('CLM');
    
    // Second call should use cache
    console.log('Second call (should use cache):');
    const secondCall = await yahooFinance.getStockQuote('CLM');
    
    // Force refresh should bypass cache
    console.log('Force refresh (should bypass cache):');
    const refreshCall = await yahooFinance.refreshStockData('CLM');
    
    // Clear cache
    console.log('Clearing cache:');
    yahooFinance.clearCache();
    
    // After clearing cache, should fetch from Yahoo Finance again
    console.log('After clearing cache (should fetch from Yahoo Finance):');
    const afterClearCall = await yahooFinance.getStockQuote('CLM');
    
    return true;
  } catch (error) {
    console.error('Cache test failed:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('=== YAHOO FINANCE INTEGRATION TESTS ===');
  
  let allTestsPassed = true;
  
  console.log('\n--- Exchange Rate Test ---');
  allTestsPassed = allTestsPassed && await testExchangeRate();
  
  console.log('\n--- Batch Quotes Test ---');
  allTestsPassed = allTestsPassed && await testBatchQuotes();
  
  console.log('\n--- Dividend History Test ---');
  allTestsPassed = allTestsPassed && await testDividendHistory();
  
  console.log('\n--- Cache Functionality Test ---');
  allTestsPassed = allTestsPassed && await testCaching();
  
  console.log('\n=== TEST RESULTS ===');
  if (allTestsPassed) {
    console.log('All tests passed successfully!');
  } else {
    console.log('Some tests failed. Check the logs for details.');
  }
}

// Run the tests
runAllTests().catch(error => {
  console.error('Test execution failed:', error);
});
