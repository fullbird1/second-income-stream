import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getPortfolio, getHoldings, updateHoldingPrices } from '../services/api';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Dashboard = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currency, setCurrency] = useState('USD');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const portfolioData = await getPortfolio();
        const holdingsData = await getHoldings();
        
        setPortfolio(portfolioData);
        setHoldings(holdingsData);
        setError(null);
      } catch (err) {
        setError('Failed to load dashboard data. Please try again.');
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRefreshPrices = async () => {
    try {
      setRefreshing(true);
      await updateHoldingPrices();
      
      // Refetch data after update
      const portfolioData = await getPortfolio();
      const holdingsData = await getHoldings();
      
      setPortfolio(portfolioData);
      setHoldings(holdingsData);
      
      setError(null);
    } catch (err) {
      setError('Failed to refresh prices. Please try again.');
      console.error('Price refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleCurrency = () => {
    setCurrency(prev => prev === 'USD' ? 'HKD' : 'USD');
  };

  // Calculate total portfolio value
  const calculateTotalValue = () => {
    if (!holdings.length) return 0;
    return holdings.reduce((sum, holding) => sum + holding.currentValue, 0);
  };

  // Prepare data for allocation pie chart
  const prepareAllocationData = () => {
    if (!portfolio) return null;
    
    return {
      labels: ['Tier 1 (Anchor Funds)', 'Tier 2 (Index-Based Funds)', 'Tier 3 (High-Yield Funds)', 'Cash Reserve'],
      datasets: [
        {
          data: [
            portfolio.tier1Allocation,
            portfolio.tier2Allocation,
            portfolio.tier3Allocation,
            portfolio.cashReserve
          ],
          backgroundColor: [
            'rgba(25, 135, 84, 0.6)',
            'rgba(13, 110, 253, 0.6)',
            'rgba(220, 53, 69, 0.6)',
            'rgba(108, 117, 125, 0.6)'
          ],
          borderColor: [
            'rgba(25, 135, 84, 1)',
            'rgba(13, 110, 253, 1)',
            'rgba(220, 53, 69, 1)',
            'rgba(108, 117, 125, 1)'
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Group holdings by tier for the bar chart
  const prepareHoldingsByTierData = () => {
    if (!holdings.length) return null;
    
    const tier1Holdings = holdings.filter(h => h.stock.tier === 1);
    const tier2Holdings = holdings.filter(h => h.stock.tier === 2);
    const tier3Holdings = holdings.filter(h => h.stock.tier === 3);
    
    const tier1Value = tier1Holdings.reduce((sum, h) => sum + h.currentValue, 0);
    const tier2Value = tier2Holdings.reduce((sum, h) => sum + h.currentValue, 0);
    const tier3Value = tier3Holdings.reduce((sum, h) => sum + h.currentValue, 0);
    
    return {
      labels: ['Tier 1 (Anchor Funds)', 'Tier 2 (Index-Based Funds)', 'Tier 3 (High-Yield Funds)'],
      datasets: [
        {
          label: 'Current Value',
          data: [tier1Value, tier2Value, tier3Value],
          backgroundColor: [
            'rgba(25, 135, 84, 0.6)',
            'rgba(13, 110, 253, 0.6)',
            'rgba(220, 53, 69, 0.6)'
          ],
          borderColor: [
            'rgba(25, 135, 84, 1)',
            'rgba(13, 110, 253, 1)',
            'rgba(220, 53, 69, 1)'
          ],
          borderWidth: 1,
        },
        {
          label: 'Target Allocation',
          data: portfolio ? [
            portfolio.tier1Allocation,
            portfolio.tier2Allocation,
            portfolio.tier3Allocation
          ] : [0, 0, 0],
          backgroundColor: [
            'rgba(25, 135, 84, 0.2)',
            'rgba(13, 110, 253, 0.2)',
            'rgba(220, 53, 69, 0.2)'
          ],
          borderColor: [
            'rgba(25, 135, 84, 0.5)',
            'rgba(13, 110, 253, 0.5)',
            'rgba(220, 53, 69, 0.5)'
          ],
          borderWidth: 1,
        }
      ],
    };
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1 className="mb-4">Second Income Stream Dashboard</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <div className="d-flex justify-content-between mb-4">
        <Button 
          variant="primary" 
          onClick={handleRefreshPrices}
          disabled={refreshing}
        >
          {refreshing ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
              <span className="ms-2">Refreshing...</span>
            </>
          ) : 'Refresh Prices'}
        </Button>
        
        <Button 
          variant="outline-secondary" 
          onClick={toggleCurrency}
        >
          Switch to {currency === 'USD' ? 'HKD' : 'USD'}
        </Button>
      </div>
      
      <Row className="mb-4">
        <Col md={6} lg={3} className="mb-3">
          <Card className="dashboard-card h-100">
            <Card.Body className="text-center">
              <Card.Title>Total Investment</Card.Title>
              <h3>
                {currency === 'USD' ? '$' : 'HK$'}
                {portfolio ? portfolio.totalInvestment.toLocaleString() : 0}
              </h3>
              <Card.Text>Initial investment amount</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={3} className="mb-3">
          <Card className="dashboard-card h-100">
            <Card.Body className="text-center">
              <Card.Title>Current Portfolio Value</Card.Title>
              <h3>
                {currency === 'USD' ? '$' : 'HK$'}
                {calculateTotalValue().toLocaleString()}
              </h3>
              <Card.Text>Total value of all holdings</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={3} className="mb-3">
          <Card className="dashboard-card h-100">
            <Card.Body className="text-center">
              <Card.Title>Cash Reserve</Card.Title>
              <h3>
                {currency === 'USD' ? '$' : 'HK$'}
                {portfolio ? portfolio.cashReserve.toLocaleString() : 0}
              </h3>
              <Card.Text>Available cash (15% of total)</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={3} className="mb-3">
          <Card className="dashboard-card h-100">
            <Card.Body className="text-center">
              <Card.Title>Total Holdings</Card.Title>
              <h3>{holdings.length}</h3>
              <Card.Text>Number of stocks in portfolio</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col lg={6} className="mb-3">
          <Card className="h-100">
            <Card.Header>Portfolio Allocation</Card.Header>
            <Card.Body>
              {portfolio && (
                <Pie 
                  data={prepareAllocationData()} 
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                      title: {
                        display: true,
                        text: 'Target Allocation by Tier'
                      }
                    }
                  }}
                />
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={6} className="mb-3">
          <Card className="h-100">
            <Card.Header>Current vs Target Allocation</Card.Header>
            <Card.Body>
              {holdings.length > 0 && portfolio && (
                <Bar 
                  data={prepareHoldingsByTierData()} 
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                      title: {
                        display: true,
                        text: 'Current vs Target Allocation by Tier'
                      }
                    }
                  }}
                />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <Card className="dashboard-card tier-1-bg">
            <Card.Body>
              <Card.Title>Tier 1: Anchor Funds</Card.Title>
              <Card.Text>
                Core positions with moderate to high yields (8-20%) and relatively lower risk.
              </Card.Text>
              <Link to="/stocks/1">
                <Button variant="success">View Tier 1 Stocks</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className="mb-3">
          <Card className="dashboard-card tier-2-bg">
            <Card.Body>
              <Card.Title>Tier 2: Index-Based Funds</Card.Title>
              <Card.Text>
                Higher yield positions (20-90%) with moderate risk and weekly income distributions.
              </Card.Text>
              <Link to="/stocks/2">
                <Button variant="primary">View Tier 2 Stocks</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className="mb-3">
          <Card className="dashboard-card tier-3-bg">
            <Card.Body>
              <Card.Title>Tier 3: High-Yield Funds</Card.Title>
              <Card.Text>
                Extremely high yield positions (38-78%) with significant risk and price erosion potential.
              </Card.Text>
              <Link to="/stocks/3">
                <Button variant="danger">View Tier 3 Stocks</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col>
          <Card>
            <Card.Header>Quick Actions</Card.Header>
            <Card.Body>
              <Row>
                <Col md={4} className="mb-2">
                  <Link to="/portfolio">
                    <Button variant="outline-primary" className="w-100">Manage Portfolio</Button>
                  </Link>
                </Col>
                <Col md={4} className="mb-2">
                  <Link to="/dividends">
                    <Button variant="outline-success" className="w-100">Track Dividends</Button>
                  </Link>
                </Col>
                <Col md={4} className="mb-2">
                  <Link to="/currency">
                    <Button variant="outline-secondary" className="w-100">Convert Currency</Button>
                  </Link>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
