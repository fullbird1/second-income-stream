import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Stock API calls
export const getStocks = async () => {
  try {
    const response = await axios.get(`${API_URL}/stocks`);
    return response.data;
  } catch (error) {
    console.error('Error fetching stocks:', error);
    throw error;
  }
};

export const getStocksByTier = async (tier) => {
  try {
    const response = await axios.get(`${API_URL}/stocks/tier/${tier}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching tier ${tier} stocks:`, error);
    throw error;
  }
};

export const initializeStocks = async () => {
  try {
    const response = await axios.get(`${API_URL}/stocks-management/initialize`);
    return response.data;
  } catch (error) {
    console.error('Error initializing stocks:', error);
    throw error;
  }
};

export const updateStockPrices = async () => {
  try {
    const response = await axios.get(`${API_URL}/stocks-management/update-prices`);
    return response.data;
  } catch (error) {
    console.error('Error updating stock prices:', error);
    throw error;
  }
};

// Portfolio API calls
export const getPortfolio = async () => {
  try {
    const response = await axios.get(`${API_URL}/portfolio`);
    return response.data;
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    throw error;
  }
};

export const updatePortfolio = async (portfolioData) => {
  try {
    const response = await axios.put(`${API_URL}/portfolio`, portfolioData);
    return response.data;
  } catch (error) {
    console.error('Error updating portfolio:', error);
    throw error;
  }
};

export const getHoldings = async () => {
  try {
    const response = await axios.get(`${API_URL}/portfolio/holdings`);
    return response.data;
  } catch (error) {
    console.error('Error fetching holdings:', error);
    throw error;
  }
};

export const addHolding = async (holdingData) => {
  try {
    const response = await axios.post(`${API_URL}/portfolio/holdings`, holdingData);
    return response.data;
  } catch (error) {
    console.error('Error adding holding:', error);
    throw error;
  }
};

export const updateHolding = async (id, holdingData) => {
  try {
    const response = await axios.put(`${API_URL}/portfolio/holdings/${id}`, holdingData);
    return response.data;
  } catch (error) {
    console.error('Error updating holding:', error);
    throw error;
  }
};

export const deleteHolding = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/portfolio/holdings/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting holding:', error);
    throw error;
  }
};

export const getRebalanceRecommendations = async () => {
  try {
    const response = await axios.get(`${API_URL}/portfolio/rebalance`);
    return response.data;
  } catch (error) {
    console.error('Error fetching rebalance recommendations:', error);
    throw error;
  }
};

export const getHoldingsByTier = async (tier) => {
  try {
    const response = await axios.get(`${API_URL}/portfolio/tier/${tier}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching tier ${tier} holdings:`, error);
    throw error;
  }
};

export const updateHoldingPrices = async () => {
  try {
    const response = await axios.get(`${API_URL}/portfolio/update-prices`);
    return response.data;
  } catch (error) {
    console.error('Error updating holding prices:', error);
    throw error;
  }
};

// Exchange Rate API calls
export const getCurrentExchangeRate = async (from = 'USD', to = 'HKD') => {
  try {
    const response = await axios.get(`${API_URL}/exchange-rates/current?from=${from}&to=${to}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    throw error;
  }
};

export const convertCurrency = async (amount, from = 'USD', to = 'HKD') => {
  try {
    const response = await axios.get(`${API_URL}/exchange-rates/convert?amount=${amount}&from=${from}&to=${to}`);
    return response.data;
  } catch (error) {
    console.error('Error converting currency:', error);
    throw error;
  }
};

export const getExchangeRateHistory = async (from = 'USD', to = 'HKD', days = 30) => {
  try {
    const response = await axios.get(`${API_URL}/exchange-rates/history?from=${from}&to=${to}&days=${days}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching exchange rate history:', error);
    throw error;
  }
};

export const refreshExchangeRates = async () => {
  try {
    const response = await axios.post(`${API_URL}/exchange-rates/refresh`);
    return response.data;
  } catch (error) {
    console.error('Error refreshing exchange rates:', error);
    throw error;
  }
};

// Dividend API calls
export const getDividends = async () => {
  try {
    const response = await axios.get(`${API_URL}/dividends`);
    return response.data;
  } catch (error) {
    console.error('Error fetching dividends:', error);
    throw error;
  }
};

export const getDividendsByStock = async (stockId) => {
  try {
    const response = await axios.get(`${API_URL}/dividends/stock/${stockId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching dividends by stock:', error);
    throw error;
  }
};

export const addDividend = async (dividendData) => {
  try {
    const response = await axios.post(`${API_URL}/dividends`, dividendData);
    return response.data;
  } catch (error) {
    console.error('Error adding dividend:', error);
    throw error;
  }
};

export const updateDividend = async (id, dividendData) => {
  try {
    const response = await axios.put(`${API_URL}/dividends/${id}`, dividendData);
    return response.data;
  } catch (error) {
    console.error('Error updating dividend:', error);
    throw error;
  }
};

export const deleteDividend = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/dividends/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting dividend:', error);
    throw error;
  }
};

export const getMonthlyIncome = async (year = new Date().getFullYear(), currency = 'USD') => {
  try {
    const response = await axios.get(`${API_URL}/dividends/income/monthly?year=${year}&currency=${currency}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching monthly income:', error);
    throw error;
  }
};

export const getYearlyIncome = async (startYear = new Date().getFullYear() - 5, endYear = new Date().getFullYear(), currency = 'USD') => {
  try {
    const response = await axios.get(`${API_URL}/dividends/income/yearly?startYear=${startYear}&endYear=${endYear}&currency=${currency}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching yearly income:', error);
    throw error;
  }
};

export const getUpcomingDividends = async (days = 30) => {
  try {
    const response = await axios.get(`${API_URL}/dividends/upcoming?days=${days}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching upcoming dividends:', error);
    throw error;
  }
};

export const getDividendForecast = async (months = 12, currency = 'USD') => {
  try {
    const response = await axios.get(`${API_URL}/dividends/forecast?months=${months}&currency=${currency}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching dividend forecast:', error);
    throw error;
  }
};
