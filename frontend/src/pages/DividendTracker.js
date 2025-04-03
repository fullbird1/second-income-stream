import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Form, Row, Col, Alert, Spinner, Modal, Tab, Tabs } from 'react-bootstrap';
import { getDividends, getMonthlyIncome, getYearlyIncome, getUpcomingDividends, getDividendForecast, addDividend } from '../services/api';
import { getStocks } from '../services/api';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const DividendTracker = () => {
  const [dividends, setDividends] = useState([]);
  const [monthlyIncome, setMonthlyIncome] = useState(null);
  const [yearlyIncome, setYearlyIncome] = useState(null);
  const [upcomingDividends, setUpcomingDividends] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currency, setCurrency] = useState('USD');
  const [year, setYear] = useState(new Date().getFullYear());
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    stockId: '',
    exDate: '',
    paymentDate: '',
    amountPerShare: '',
    shares: '',
    reinvested: false,
    notes: '',
    currency: 'USD'
  });

  useEffect(() => {
    fetchData();
  }, [currency, year]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [
        dividendsData,
        monthlyData,
        yearlyData,
        upcomingData,
        forecastData,
        stocksData
      ] = await Promise.all([
        getDividends(),
        getMonthlyIncome(year, currency),
        getYearlyIncome(year - 5, year, currency),
        getUpcomingDividends(30),
        getDividendForecast(12, currency),
        getStocks()
      ]);
      
      setDividends(dividendsData);
      setMonthlyIncome(monthlyData);
      setYearlyIncome(yearlyData);
      setUpcomingDividends(upcomingData);
      setForecast(forecastData);
      setStocks(stocksData);
      setError(null);
    } catch (err) {
      setError('Failed to load dividend data. Please try again.');
      console.error('Dividend data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCurrency = () => {
    setCurrency(prev => prev === 'USD' ? 'HKD' : 'USD');
  };

  const handleYearChange = (e) => {
    setYear(parseInt(e.target.value));
  };

  const handleAddDividend = () => {
    setFormData({
      stockId: '',
      exDate: '',
      paymentDate: '',
      amountPerShare: '',
      shares: '',
      reinvested: false,
      notes: '',
      currency: 'USD'
    });
    setShowAddModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async () => {
    try {
      const dividendData = {
        ...formData,
        amountPerShare: parseFloat(formData.amountPerShare),
        shares: parseFloat(formData.shares)
      };
      
      await addDividend(dividendData);
      setShowAddModal(false);
      
      // Refresh data
      fetchData();
    } catch (err) {
      setError('Failed to add dividend. Please try again.');
      console.error('Add dividend error:', err);
    }
  };

  // Prepare data for monthly income chart
  const prepareMonthlyChart = () => {
    if (!monthlyIncome) return null;
    
    return {
      labels: monthlyIncome.monthlyIncome.map(m => m.month),
      datasets: [
        {
          label: `Monthly Dividend Income (${currency})`,
          data: monthlyIncome.monthlyIncome.map(m => m.displayTotal),
          backgroundColor: 'rgba(25, 135, 84, 0.6)',
          borderColor: 'rgba(25, 135, 84, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  // Prepare data for yearly income chart
  const prepareYearlyChart = () => {
    if (!yearlyIncome) return null;
    
    return {
      labels: yearlyIncome.yearlyIncome.map(y => y.year),
      datasets: [
        {
          label: `Yearly Dividend Income (${currency})`,
          data: yearlyIncome.yearlyIncome.map(y => y.displayTotal),
          backgroundColor: 'rgba(13, 110, 253, 0.6)',
          borderColor: 'rgba(13, 110, 253, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  // Prepare data for forecast chart
  const prepareForecastChart = () => {
    if (!forecast) return null;
    
    return {
      labels: forecast.forecast.map(f => f.monthName),
      datasets: [
        {
          label: `Dividend Forecast (${currency})`,
          data: forecast.forecast.map(f => f.displayTotal),
          backgroundColor: 'rgba(111, 66, 193, 0.6)',
          borderColor: 'rgba(111, 66, 193, 1)',
          borderWidth: 1
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
        <p className="mt-2">Loading dividend data...</p>
      </div>
    );
  }

  return (
    <div className="dividend-tracker">
      <h1 className="mb-4">Dividend Income Tracker</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <div className="d-flex justify-content-between mb-4">
        <Button 
          variant="success" 
          onClick={handleAddDividend}
        >
          Add Dividend Payment
        </Button>
        
        <div className="d-flex">
          <Form.Select 
            value={year} 
            onChange={handleYearChange}
            className="me-2"
            style={{ width: 'auto' }}
          >
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Form.Select>
          
          <Button 
            variant="outline-secondary" 
            onClick={toggleCurrency}
          >
            Switch to {currency === 'USD' ? 'HKD' : 'USD'}
          </Button>
        </div>
      </div>
      
      <Row className="mb-4">
        <Col md={6} lg={3} className="mb-3">
          <Card className="dashboard-card h-100">
            <Card.Body className="text-center">
              <Card.Title>Monthly Average</Card.Title>
              <h3>
                {currency === 'USD' ? '$' : 'HK$'}
                {monthlyIncome ? (monthlyIncome.yearlyTotal / 12).toFixed(2) : 0}
              </h3>
              <Card.Text>Average monthly dividend income</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={3} className="mb-3">
          <Card className="dashboard-card h-100">
            <Card.Body className="text-center">
              <Card.Title>Annual Income</Card.Title>
              <h3>
                {currency === 'USD' ? '$' : 'HK$'}
                {monthlyIncome ? monthlyIncome.yearlyTotal.toFixed(2) : 0}
              </h3>
              <Card.Text>Total dividend income for {year}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={3} className="mb-3">
          <Card className="dashboard-card h-100">
            <Card.Body className="text-center">
              <Card.Title>Upcoming Payments</Card.Title>
              <h3>{upcomingDividends.length}</h3>
              <Card.Text>Dividend payments in next 30 days</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={3} className="mb-3">
          <Card className="dashboard-card h-100">
            <Card.Body className="text-center">
              <Card.Title>Yield on Investment</Card.Title>
              <h3>
                {monthlyIncome && forecast ? 
                  ((monthlyIncome.yearlyTotal / 165000) * 100).toFixed(2) : 0}%
              </h3>
              <Card.Text>Annual yield on total investment</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Tabs defaultActiveKey="monthly" className="mb-4">
        <Tab eventKey="monthly" title="Monthly Income">
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Monthly Dividend Income ({year})</h5>
            </Card.Header>
            <Card.Body>
              {monthlyIncome && (
                <Bar 
                  data={prepareMonthlyChart()} 
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: true,
                        text: `Monthly Dividend Income for ${year}`
                      }
                    }
                  }}
                />
              )}
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Header>
              <h5 className="mb-0">Monthly Breakdown</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Income ({currency})</th>
                      <th>Dividend Count</th>
                      <th>% of Annual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyIncome && monthlyIncome.monthlyIncome.map(month => {
                      const percentOfAnnual = monthlyIncome.yearlyTotal > 0 
                        ? (month.displayTotal / monthlyIncome.yearlyTotal) * 100 
                        : 0;
                      
                      return (
                        <tr key={month.monthNumber}>
                          <td>{month.month}</td>
                          <td>
                            {currency === 'USD' ? '$' : 'HK$'}
                            {month.displayTotal.toFixed(2)}
                          </td>
                          <td>{month.dividendCount}</td>
                          <td>{percentOfAnnual.toFixed(2)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="table-success">
                      <th>Total</th>
                      <th>
                        {currency === 'USD' ? '$' : 'HK$'}
                        {monthlyIncome ? monthlyIncome.yearlyTotal.toFixed(2) : 0}
                      </th>
                      <th>
                        {monthlyIncome 
                          ? monthlyIncome.monthlyIncome.reduce((sum, m) => sum + m.dividendCount, 0) 
                          : 0}
                      </th>
                      <th>100%</th>
                    </tr>
                  </tfoot>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="yearly" title="Yearly Income">
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Yearly Dividend Income</h5>
            </Card.Header>
            <Card.Body>
              {yearlyIncome && (
                <Bar 
                  data={prepareYearlyChart()} 
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: true,
                        text: 'Yearly Dividend Income'
                      }
                    }
                  }}
                />
              )}
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Header>
              <h5 className="mb-0">Yearly Breakdown</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>Income ({currency})</th>
                      <th>Dividend Count</th>
                      <th>Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyIncome && yearlyIncome.yearlyIncome.map((yearData, index) => {
                      const prevYear = index > 0 ? yearlyIncome.yearlyIncome[index - 1] : null;
                      const growth = prevYear && prevYear.displayTotal > 0 
                        ? ((yearData.displayTotal - prevYear.displayTotal) / prevYear.displayTotal) * 100 
                        : null;
                      
                      return (
                        <tr key={yearData.year}>
                          <td>{yearData.year}</td>
                          <td>
                            {currency === 'USD' ? '$' : 'HK$'}
                            {yearData.displayTotal.toFixed(2)}
                          </td>
                          <td>{yearData.dividendCount}</td>
                          <td>
                            {growth !== null 
                              ? <span className={growth >= 0 ? 'text-success' : 'text-danger'}>
                                  {growth.toFixed(2)}%
                                </span>
                              : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="table-primary">
                      <th>Average</th>
                      <th>
                        {currency === 'USD' ? '$' : 'HK$'}
                        {yearlyIncome && yearlyIncome.yearlyIncome.length > 0
                          ? (yearlyIncome.grandTotal / yearlyIncome.yearlyIncome.length).toFixed(2)
                          : 0}
                      </th>
                      <th>
                        {yearlyIncome && yearlyIncome.yearlyIncome.length > 0
                          ? Math.round(yearlyIncome.yearlyIncome.reduce((sum, y) => sum + y.dividendCount, 0) / yearlyIncome.yearlyIncome.length)
                          : 0}
                      </th>
                      <th>-</th>
                    </tr>
                  </tfoot>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="forecast" title="Dividend Forecast">
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">12-Month Dividend Forecast</h5>
            </Card.Header>
            <Card.Body>
              {forecast && (
                <Bar 
                  data={prepareForecastChart()} 
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: true,
                        text: '12-Month Dividend Forecast'
                      }
                    }
                  }}
                />
              )}
            </Card.Body>
          </Card>
          
          <Row>
            <Col lg={6} className="mb-4">
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Forecast Summary</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6} className="mb-3">
                      <h5>Total Forecast (12 months)</h5>
                      <h3>
                        {currency === 'USD' ? '$' : 'HK$'}
                        {forecast ? forecast.totalForecast.toFixed(2) : 0}
                      </h3>
                    </Col>
                    
                    <Col md={6} className="mb-3">
                      <h5>Monthly Average</h5>
                      <h3>
                        {currency === 'USD' ? '$' : 'HK$'}
                        {forecast ? (forecast.totalForecast / 12).toFixed(2) : 0}
                      </h3>
                    </Col>
                    
                    <Col md={6} className="mb-3">
                      <h5>Projected Yield</h5>
                      <h3>
                        {forecast ? ((forecast.totalForecast / 165000) * 100).toFixed(2) : 0}%
                      </h3>
                    </Col>
                    
                    <Col md={6} className="mb-3">
                      <h5>Exchange Rate</h5>
                      <h3>
                        {forecast ? forecast.exchangeRate.toFixed(4) : 0}
                      </h3>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
            
            <Col lg={6} className="mb-4">
              <Card className="dividend-forecast-card h-100">
                <Card.Header>
                  <h5 className="mb-0">Upcoming Dividends</h5>
                </Card.Header>
                <Card.Body>
                  {upcomingDividends.length > 0 ? (
                    <div className="table-responsive">
                      <Table striped hover>
                        <thead>
                          <tr>
                            <th>Stock</th>
                            <th>Ex-Date</th>
                            <th>Payment Date</th>
                            <th>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {upcomingDividends.map(dividend => (
                            <tr key={dividend._id}>
                              <td>{dividend.stock.symbol}</td>
                              <td>{new Date(dividend.exDate).toLocaleDateString()}</td>
                              <td>{new Date(dividend.paymentDate).toLocaleDateString()}</td>
                              <td>
                                {dividend.currency === 'USD' ? '$' : 'HK$'}
                                {dividend.totalAmount.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <Alert variant="info">
                      No upcoming dividend payments in the next 30 days.
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
        
        <Tab eventKey="history" title="Dividend History">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Dividend Payment History</h5>
              <Button 
                variant="success" 
                size="sm"
                onClick={handleAddDividend}
              >
                Add Dividend
              </Button>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Stock</th>
                      <th>Ex-Date</th>
                      <th>Payment Date</th>
                      <th>Amount/Share</th>
                      <th>Shares</th>
                      <th>Total Amount</th>
                      <th>Currency</th>
                      <th>Reinvested</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dividends.map(dividend => (
                      <tr key={dividend._id}>
                        <td>{dividend.stock.symbol}</td>
                        <td>{new Date(dividend.exDate).toLocaleDateString()}</td>
                        <td>{new Date(dividend.paymentDate).toLocaleDateString()}</td>
                        <td>${dividend.amountPerShare.toFixed(4)}</td>
                        <td>{dividend.shares}</td>
                        <td>
                          {dividend.currency === 'USD' ? '$' : 'HK$'}
                          {dividend.totalAmount.toFixed(2)}
                        </td>
                        <td>{dividend.currency}</td>
                        <td>{dividend.reinvested ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                    {dividends.length === 0 && (
                      <tr>
                        <td colSpan="8" className="text-center">No dividend payments recorded</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
      
      {/* Add Dividend Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Dividend Payment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Stock</Form.Label>
              <Form.Select 
                name="stockId" 
                value={formData.stockId} 
                onChange={handleFormChange}
                required
              >
                <option value="">Select a stock</option>
                {stocks.map(stock => (
                  <option key={stock._id} value={stock._id}>
                    {stock.symbol} - {stock.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ex-Dividend Date</Form.Label>
                  <Form.Control 
                    type="date" 
                    name="exDate" 
                    value={formData.exDate} 
                    onChange={handleFormChange} 
                    required 
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Payment Date</Form.Label>
                  <Form.Control 
                    type="date" 
                    name="paymentDate" 
                    value={formData.paymentDate} 
                    onChange={handleFormChange} 
                    required 
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Amount Per Share</Form.Label>
                  <Form.Control 
                    type="number" 
                    step="0.0001"
                    name="amountPerShare" 
                    value={formData.amountPerShare} 
                    onChange={handleFormChange} 
                    required 
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Number of Shares</Form.Label>
                  <Form.Control 
                    type="number" 
                    name="shares" 
                    value={formData.shares} 
                    onChange={handleFormChange} 
                    required 
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Currency</Form.Label>
                  <Form.Select 
                    name="currency" 
                    value={formData.currency} 
                    onChange={handleFormChange}
                  >
                    <option value="USD">USD</option>
                    <option value="HKD">HKD</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3 mt-4">
                  <Form.Check 
                    type="checkbox" 
                    label="Dividend Reinvested" 
                    name="reinvested"
                    checked={formData.reinvested}
                    onChange={handleFormChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={2}
                name="notes" 
                value={formData.notes} 
                onChange={handleFormChange} 
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleSubmit}>
            Add Dividend
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DividendTracker;
