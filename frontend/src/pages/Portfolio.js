import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Form, Row, Col, Alert, Spinner, Modal, Tab, Tabs } from 'react-bootstrap';
import { getPortfolio, getHoldings, getRebalanceRecommendations, updateHoldingPrices } from '../services/api';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

const Portfolio = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currency, setCurrency] = useState('USD');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [portfolioData, holdingsData, rebalanceData] = await Promise.all([
        getPortfolio(),
        getHoldings(),
        getRebalanceRecommendations()
      ]);
      
      setPortfolio(portfolioData);
      setHoldings(holdingsData);
      setRecommendations(rebalanceData);
      setError(null);
    } catch (err) {
      setError('Failed to load portfolio data. Please try again.');
      console.error('Portfolio data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshPrices = async () => {
    try {
      setRefreshing(true);
      await updateHoldingPrices();
      
      // Refetch data after update
      fetchData();
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

  // Prepare data for holdings pie chart
  const prepareHoldingsData = () => {
    if (!holdings.length) return null;
    
    // Group small holdings together for better visualization
    const threshold = 0.03; // 3% threshold
    let mainHoldings = [];
    let otherHoldingsValue = 0;
    
    const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    
    holdings.forEach(holding => {
      const percentage = holding.currentValue / totalValue;
      
      if (percentage >= threshold) {
        mainHoldings.push({
          symbol: holding.stock.symbol,
          value: holding.currentValue,
          percentage
        });
      } else {
        otherHoldingsValue += holding.currentValue;
      }
    });
    
    // Add "Other" category if needed
    if (otherHoldingsValue > 0) {
      mainHoldings.push({
        symbol: 'Other',
        value: otherHoldingsValue,
        percentage: otherHoldingsValue / totalValue
      });
    }
    
    // Sort by value (descending)
    mainHoldings.sort((a, b) => b.value - a.value);
    
    return {
      labels: mainHoldings.map(h => h.symbol),
      datasets: [
        {
          data: mainHoldings.map(h => h.value),
          backgroundColor: [
            'rgba(25, 135, 84, 0.6)',
            'rgba(13, 110, 253, 0.6)',
            'rgba(220, 53, 69, 0.6)',
            'rgba(255, 193, 7, 0.6)',
            'rgba(111, 66, 193, 0.6)',
            'rgba(23, 162, 184, 0.6)',
            'rgba(102, 16, 242, 0.6)',
            'rgba(40, 167, 69, 0.6)',
            'rgba(0, 123, 255, 0.6)',
            'rgba(108, 117, 125, 0.6)'
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Get tier badge variant
  const getTierBadgeVariant = (tier) => {
    switch (tier) {
      case 1: return 'success';
      case 2: return 'primary';
      case 3: return 'danger';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading portfolio data...</p>
      </div>
    );
  }

  return (
    <div className="portfolio">
      <h1 className="mb-4">Portfolio Management</h1>
      
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
      
      <Tabs defaultActiveKey="holdings" className="mb-4">
        <Tab eventKey="holdings" title="Holdings">
          <Row className="mb-4">
            <Col lg={4} className="mb-3">
              <Card className="h-100">
                <Card.Header>Portfolio Allocation</Card.Header>
                <Card.Body className="text-center">
                  {holdings.length > 0 && (
                    <Pie 
                      data={prepareHoldingsData()} 
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'right',
                          },
                          title: {
                            display: true,
                            text: 'Holdings by Value'
                          }
                        }
                      }}
                    />
                  )}
                </Card.Body>
              </Card>
            </Col>
            
            <Col lg={8} className="mb-3">
              <Card className="h-100">
                <Card.Header>Portfolio Summary</Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6} className="mb-3">
                      <h5>Total Investment</h5>
                      <h3>
                        {currency === 'USD' ? '$' : 'HK$'}
                        {portfolio ? portfolio.totalInvestment.toLocaleString() : 0}
                      </h3>
                    </Col>
                    
                    <Col md={6} className="mb-3">
                      <h5>Current Portfolio Value</h5>
                      <h3>
                        {currency === 'USD' ? '$' : 'HK$'}
                        {recommendations ? recommendations.totalValue.toLocaleString() : 0}
                      </h3>
                    </Col>
                    
                    <Col md={6} className="mb-3">
                      <h5>Cash Reserve</h5>
                      <h3>
                        {currency === 'USD' ? '$' : 'HK$'}
                        {portfolio ? portfolio.cashReserve.toLocaleString() : 0}
                      </h3>
                    </Col>
                    
                    <Col md={6} className="mb-3">
                      <h5>Total with Cash</h5>
                      <h3>
                        {currency === 'USD' ? '$' : 'HK$'}
                        {recommendations ? recommendations.totalWithCash.toLocaleString() : 0}
                      </h3>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">All Holdings</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Name</th>
                      <th>Tier</th>
                      <th>Shares</th>
                      <th>Avg. Cost</th>
                      <th>Current Price</th>
                      <th>Current Value</th>
                      <th>Allocation %</th>
                      <th>Target %</th>
                      <th>Gain/Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map(holding => {
                      const gainLoss = holding.currentValue - (holding.averageCostBasis * holding.shares);
                      const gainLossPercent = (gainLoss / (holding.averageCostBasis * holding.shares)) * 100;
                      const currentPrice = holding.currentValue / holding.shares;
                      
                      return (
                        <tr key={holding._id}>
                          <td><strong>{holding.stock.symbol}</strong></td>
                          <td>{holding.stock.name}</td>
                          <td>
                            <span className={`badge bg-${getTierBadgeVariant(holding.stock.tier)}`}>
                              Tier {holding.stock.tier}
                            </span>
                          </td>
                          <td>{holding.shares}</td>
                          <td>${holding.averageCostBasis.toFixed(2)}</td>
                          <td>${currentPrice.toFixed(2)}</td>
                          <td>${holding.currentValue.toFixed(2)}</td>
                          <td>{holding.allocationPercentage.toFixed(2)}%</td>
                          <td>{holding.targetAllocationPercentage.toFixed(2)}%</td>
                          <td className={gainLoss >= 0 ? 'text-success' : 'text-danger'}>
                            ${gainLoss.toFixed(2)} ({gainLossPercent.toFixed(2)}%)
                          </td>
                        </tr>
                      );
                    })}
                    {holdings.length === 0 && (
                      <tr>
                        <td colSpan="10" className="text-center">No holdings found</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="rebalance" title="Rebalance Recommendations">
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Rebalancing Recommendations</h5>
            </Card.Header>
            <Card.Body>
              {recommendations && recommendations.recommendations.length > 0 ? (
                <div className="table-responsive">
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th>Symbol</th>
                        <th>Name</th>
                        <th>Tier</th>
                        <th>Current %</th>
                        <th>Target %</th>
                        <th>Difference</th>
                        <th>Action</th>
                        <th>Amount</th>
                        <th>Shares</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recommendations.recommendations.map((rec, index) => (
                        <tr key={index}>
                          <td><strong>{rec.symbol}</strong></td>
                          <td>{rec.name}</td>
                          <td>
                            <span className={`badge bg-${getTierBadgeVariant(rec.tier)}`}>
                              Tier {rec.tier}
                            </span>
                          </td>
                          <td>{rec.currentAllocation.toFixed(2)}%</td>
                          <td>{rec.targetAllocation.toFixed(2)}%</td>
                          <td className={rec.difference >= 0 ? 'text-success' : 'text-danger'}>
                            {rec.difference.toFixed(2)}%
                          </td>
                          <td>
                            <span className={`badge bg-${rec.action === 'Buy' ? 'success' : 'danger'}`}>
                              {rec.action}
                            </span>
                          </td>
                          <td>${rec.amountToAdjust.toFixed(2)}</td>
                          <td>{rec.sharesCount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <Alert variant="info">
                  No rebalancing recommendations at this time. Your portfolio is well balanced.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="allocation" title="Tier Allocation">
          <Row className="mb-4">
            <Col md={4} className="mb-3">
              <Card className="tier-1-bg h-100">
                <Card.Header>
                  <h5 className="mb-0">Tier 1: Anchor Funds</h5>
                </Card.Header>
                <Card.Body>
                  <h4 className="mb-3">
                    Target: ${portfolio ? portfolio.tier1Allocation.toLocaleString() : 0}
                  </h4>
                  <p>
                    Core positions with moderate to high yields (8-20%) and relatively lower risk.
                  </p>
                  <p>
                    <strong>Allocation:</strong> 55% of total investment
                  </p>
                  <Button variant="success" href="/stocks/1">View Tier 1 Stocks</Button>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={4} className="mb-3">
              <Card className="tier-2-bg h-100">
                <Card.Header>
                  <h5 className="mb-0">Tier 2: Index-Based Funds</h5>
                </Card.Header>
                <Card.Body>
                  <h4 className="mb-3">
                    Target: ${portfolio ? portfolio.tier2Allocation.toLocaleString() : 0}
                  </h4>
                  <p>
                    Higher yield positions (20-90%) with moderate risk and weekly income distributions.
                  </p>
                  <p>
                    <strong>Allocation:</strong> 25% of total investment
                  </p>
                  <Button variant="primary" href="/stocks/2">View Tier 2 Stocks</Button>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={4} className="mb-3">
              <Card className="tier-3-bg h-100">
                <Card.Header>
                  <h5 className="mb-0">Tier 3: High-Yield Funds</h5>
                </Card.Header>
                <Card.Body>
                  <h4 className="mb-3">
                    Target: ${portfolio ? portfolio.tier3Allocation.toLocaleString() : 0}
                  </h4>
                  <p>
                    Extremely high yield positions (38-78%) with significant risk and price erosion potential.
                  </p>
                  <p>
                    <strong>Allocation:</strong> 5% of total investment
                  </p>
                  <Button variant="danger" href="/stocks/3">View Tier 3 Stocks</Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Card>
            <Card.Header>
              <h5 className="mb-0">Cash Reserve</h5>
            </Card.Header>
            <Card.Body>
              <h4 className="mb-3">
                Target: ${portfolio ? portfolio.cashReserve.toLocaleString() : 0}
              </h4>
              <p>
                Buffer against market volatility to avoid margin calls.
              </p>
              <p>
                <strong>Allocation:</strong> 15% of total investment
              </p>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
};

export default Portfolio;
