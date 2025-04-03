import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { getCurrentExchangeRate, convertCurrency, getExchangeRateHistory, refreshExchangeRates } from '../services/api';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const CurrencyConverter = () => {
  const [amount, setAmount] = useState('1000');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('HKD');
  const [result, setResult] = useState(null);
  const [currentRate, setCurrentRate] = useState(null);
  const [rateHistory, setRateHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [rateData, historyData] = await Promise.all([
        getCurrentExchangeRate('USD', 'HKD'),
        getExchangeRateHistory('USD', 'HKD', 30)
      ]);
      
      setCurrentRate(rateData);
      setRateHistory(historyData);
      
      // Initial conversion
      const initialConversion = await convertCurrency(1000, 'USD', 'HKD');
      setResult(initialConversion);
      
      setError(null);
    } catch (err) {
      setError('Failed to load currency data. Please try again.');
      console.error('Currency data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async (e) => {
    e.preventDefault();
    
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    
    try {
      setConverting(true);
      setError(null);
      
      const conversionResult = await convertCurrency(
        parseFloat(amount),
        fromCurrency,
        toCurrency
      );
      
      setResult(conversionResult);
    } catch (err) {
      setError('Failed to convert currency. Please try again.');
      console.error('Currency conversion error:', err);
    } finally {
      setConverting(false);
    }
  };

  const handleRefreshRates = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      await refreshExchangeRates();
      
      // Refetch data after refresh
      const [rateData, historyData] = await Promise.all([
        getCurrentExchangeRate(fromCurrency, toCurrency),
        getExchangeRateHistory(fromCurrency, toCurrency, 30)
      ]);
      
      setCurrentRate(rateData);
      setRateHistory(historyData);
      
      // Update conversion result
      if (amount && !isNaN(amount)) {
        const conversionResult = await convertCurrency(
          parseFloat(amount),
          fromCurrency,
          toCurrency
        );
        setResult(conversionResult);
      }
    } catch (err) {
      setError('Failed to refresh exchange rates. Please try again.');
      console.error('Exchange rate refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    
    // Trigger conversion with swapped currencies
    if (amount && !isNaN(amount)) {
      convertCurrency(parseFloat(amount), toCurrency, fromCurrency)
        .then(conversionResult => {
          setResult(conversionResult);
        })
        .catch(err => {
          console.error('Currency swap conversion error:', err);
        });
    }
  };

  // Prepare data for exchange rate history chart
  const prepareChartData = () => {
    if (!rateHistory.length) return null;
    
    // Sort by date (ascending)
    const sortedHistory = [...rateHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return {
      labels: sortedHistory.map(item => new Date(item.date).toLocaleDateString()),
      datasets: [
        {
          label: `${fromCurrency} to ${toCurrency} Exchange Rate`,
          data: sortedHistory.map(item => item.rate),
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }
      ]
    };
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading currency data...</p>
      </div>
    );
  }

  return (
    <div className="currency-converter">
      <h1 className="mb-4">Currency Converter</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row>
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Convert Currency</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleConvert}>
                <Form.Group className="mb-3">
                  <Form.Label>Amount</Form.Label>
                  <Form.Control 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </Form.Group>
                
                <Row className="mb-3">
                  <Col>
                    <Form.Group>
                      <Form.Label>From</Form.Label>
                      <Form.Select 
                        value={fromCurrency} 
                        onChange={(e) => setFromCurrency(e.target.value)}
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="HKD">HKD - Hong Kong Dollar</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  
                  <Col xs="auto" className="d-flex align-items-center pt-4">
                    <Button 
                      variant="outline-secondary" 
                      onClick={handleSwapCurrencies}
                      className="px-3"
                    >
                      ⇄
                    </Button>
                  </Col>
                  
                  <Col>
                    <Form.Group>
                      <Form.Label>To</Form.Label>
                      <Form.Select 
                        value={toCurrency} 
                        onChange={(e) => setToCurrency(e.target.value)}
                      >
                        <option value="HKD">HKD - Hong Kong Dollar</option>
                        <option value="USD">USD - US Dollar</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                
                <div className="d-grid gap-2">
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={converting}
                  >
                    {converting ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                        <span className="ms-2">Converting...</span>
                      </>
                    ) : 'Convert'}
                  </Button>
                </div>
              </Form>
              
              {result && (
                <div className="mt-4 p-3 bg-light rounded">
                  <h4 className="mb-3">Conversion Result</h4>
                  <p className="mb-1">
                    <strong>{result.originalAmount.toLocaleString()} {result.fromCurrency}</strong>
                  </p>
                  <h3 className="mb-1">
                    = {result.convertedAmount.toLocaleString()} {result.toCurrency}
                  </h3>
                  <p className="text-muted mb-0">
                    Exchange Rate: 1 {result.fromCurrency} = {result.rate.toFixed(4)} {result.toCurrency}
                  </p>
                  <p className="text-muted mb-0">
                    Last Updated: {new Date(result.date).toLocaleString()}
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={6} className="mb-4">
          <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Exchange Rate History</h5>
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={handleRefreshRates}
                disabled={refreshing}
              >
                {refreshing ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    <span className="ms-2">Refreshing...</span>
                  </>
                ) : 'Refresh Rates'}
              </Button>
            </Card.Header>
            <Card.Body>
              {currentRate && (
                <div className="mb-4">
                  <h5>Current Rate</h5>
                  <h3>1 {currentRate.fromCurrency} = {currentRate.rate.toFixed(4)} {currentRate.toCurrency}</h3>
                  <p className="text-muted">
                    Last Updated: {new Date(currentRate.date).toLocaleString()}
                  </p>
                </div>
              )}
              
              {rateHistory.length > 0 && (
                <div className="chart-container">
                  <Line 
                    data={prepareChartData()} 
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        title: {
                          display: true,
                          text: '30-Day Exchange Rate History'
                        }
                      }
                    }}
                  />
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Card>
        <Card.Header>
          <h5 className="mb-0">About Currency Conversion</h5>
        </Card.Header>
        <Card.Body>
          <p>
            This currency converter allows you to convert between USD and HKD, which is essential for managing your investments with Interactive Brokers in Hong Kong.
          </p>
          <p>
            The exchange rates are updated in real-time from Yahoo Finance. You can use this tool to:
          </p>
          <ul>
            <li>Convert investment amounts between USD and HKD</li>
            <li>Track exchange rate fluctuations over time</li>
            <li>Calculate dividend values in your preferred currency</li>
          </ul>
          <p className="mb-0">
            <strong>Note:</strong> Exchange rates are subject to market fluctuations. The Second Income Stream app updates rates daily to ensure accuracy.
          </p>
        </Card.Body>
      </Card>
    </div>
  );
};

export default CurrencyConverter;
