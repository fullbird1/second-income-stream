import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Form, Row, Col, Alert, Spinner, Modal } from 'react-bootstrap';
import { getStocksByTier, getHoldingsByTier, addHolding, updateHolding, deleteHolding } from '../services/api';

const StocksByTier = ({ match }) => {
  const [stocks, setStocks] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tier, setTier] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [formData, setFormData] = useState({
    shares: '',
    averageCostBasis: '',
    targetAllocationPercentage: ''
  });

  useEffect(() => {
    // Extract tier from URL params
    const tierParam = match?.params?.tier || 1;
    setTier(parseInt(tierParam));
    
    fetchData(parseInt(tierParam));
  }, [match?.params?.tier]);

  const fetchData = async (tierNumber) => {
    try {
      setLoading(true);
      const [stocksData, holdingsData] = await Promise.all([
        getStocksByTier(tierNumber),
        getHoldingsByTier(tierNumber)
      ]);
      
      setStocks(stocksData);
      setHoldings(holdingsData.holdings || []);
      setError(null);
    } catch (err) {
      setError(`Failed to load Tier ${tierNumber} data. Please try again.`);
      console.error(`Tier ${tierNumber} data fetch error:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHolding = (stock) => {
    setSelectedStock(stock);
    setFormData({
      shares: '',
      averageCostBasis: stock.currentPrice,
      targetAllocationPercentage: ''
    });
    setShowAddModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async () => {
    try {
      if (!selectedStock) return;
      
      const holdingData = {
        stockId: selectedStock._id,
        shares: parseFloat(formData.shares),
        averageCostBasis: parseFloat(formData.averageCostBasis),
        targetAllocationPercentage: parseFloat(formData.targetAllocationPercentage)
      };
      
      await addHolding(holdingData);
      setShowAddModal(false);
      
      // Refresh data
      fetchData(tier);
    } catch (err) {
      setError('Failed to add holding. Please try again.');
      console.error('Add holding error:', err);
    }
  };

  const getTierName = (tierNumber) => {
    switch (tierNumber) {
      case 1:
        return 'Anchor Funds';
      case 2:
        return 'Index-Based Funds';
      case 3:
        return 'High-Yield Funds';
      default:
        return 'Unknown Tier';
    }
  };

  const getTierDescription = (tierNumber) => {
    switch (tierNumber) {
      case 1:
        return 'Core positions with moderate to high yields (8-20%) and relatively lower risk.';
      case 2:
        return 'Higher yield positions (20-90%) with moderate risk and weekly income distributions.';
      case 3:
        return 'Extremely high yield positions (38-78%) with significant risk and price erosion potential.';
      default:
        return '';
    }
  };

  const getTierClass = (tierNumber) => {
    switch (tierNumber) {
      case 1:
        return 'tier-1-bg';
      case 2:
        return 'tier-2-bg';
      case 3:
        return 'tier-3-bg';
      default:
        return '';
    }
  };

  const getTierButtonVariant = (tierNumber) => {
    switch (tierNumber) {
      case 1:
        return 'success';
      case 2:
        return 'primary';
      case 3:
        return 'danger';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading Tier {tier} stocks...</p>
      </div>
    );
  }

  return (
    <div className="stocks-by-tier">
      <h1 className="mb-4">Tier {tier}: {getTierName(tier)}</h1>
      <p className="lead mb-4">{getTierDescription(tier)}</p>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className={`mb-4 ${getTierClass(tier)}`}>
        <Card.Header>
          <h5 className="mb-0">Tier {tier} Stocks</h5>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <Table striped hover>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Current Price</th>
                  <th>Dividend Yield</th>
                  <th>Dividend Frequency</th>
                  <th>Risk Level</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map(stock => (
                  <tr key={stock._id}>
                    <td><strong>{stock.symbol}</strong></td>
                    <td>{stock.name}</td>
                    <td>{stock.subCategory || '-'}</td>
                    <td>${stock.currentPrice.toFixed(2)}</td>
                    <td>{stock.dividendYield.toFixed(2)}%</td>
                    <td>{stock.dividendFrequency}</td>
                    <td>{stock.riskLevel}</td>
                    <td>
                      <Button 
                        variant={getTierButtonVariant(tier)} 
                        size="sm"
                        onClick={() => handleAddHolding(stock)}
                      >
                        Add to Portfolio
                      </Button>
                    </td>
                  </tr>
                ))}
                {stocks.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center">No stocks found in Tier {tier}</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
      
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Your Tier {tier} Holdings</h5>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <Table striped hover>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Name</th>
                  <th>Shares</th>
                  <th>Avg. Cost</th>
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
                  
                  return (
                    <tr key={holding._id}>
                      <td><strong>{holding.stock.symbol}</strong></td>
                      <td>{holding.stock.name}</td>
                      <td>{holding.shares}</td>
                      <td>${holding.averageCostBasis.toFixed(2)}</td>
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
                    <td colSpan="8" className="text-center">No holdings in Tier {tier}</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
      
      {/* Add Holding Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add {selectedStock?.symbol} to Portfolio</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Stock</Form.Label>
              <Form.Control 
                type="text" 
                value={`${selectedStock?.symbol} - ${selectedStock?.name}`} 
                disabled 
              />
            </Form.Group>
            
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
            
            <Form.Group className="mb-3">
              <Form.Label>Average Cost Basis (per share)</Form.Label>
              <Form.Control 
                type="number" 
                name="averageCostBasis" 
                value={formData.averageCostBasis} 
                onChange={handleFormChange} 
                required 
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Target Allocation Percentage</Form.Label>
              <Form.Control 
                type="number" 
                name="targetAllocationPercentage" 
                value={formData.targetAllocationPercentage} 
                onChange={handleFormChange} 
                required 
              />
              <Form.Text className="text-muted">
                Percentage of your portfolio you want to allocate to this stock
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button variant={getTierButtonVariant(tier)} onClick={handleSubmit}>
            Add to Portfolio
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default StocksByTier;
