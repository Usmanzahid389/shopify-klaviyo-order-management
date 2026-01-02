import React, { useState, useEffect } from 'react';
import ProductDisplay from './components/ProductDisplay';
import OrderListing from './components/OrderListing';
import OrderModification from './components/OrderModification';
import { apiService } from './services/apiService';
import './App.css';

function App() {
  const [username, setUsername] = useState('');
  const [activeTab, setActiveTab] = useState('products');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  useEffect(() => {
    fetchUsername();
  }, []);

  const fetchUsername = async () => {
    try {
      const data = await apiService.getUsername();
      setUsername(data.username);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch username. Please check server connection.');
      setLoading(false);
    }
  };

  const handleModifyOrder = (orderId) => {
    setSelectedOrderId(orderId);
    setActiveTab('modify');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <div className="header">
        <div className="header-content">
          <img 
            src="https://nebroo.com/cdn/shop/files/Screen_Shot_2024-06-09_at_7.13.16_AM.png?v=1717902821&width=200" 
            alt="Logo" 
            className="header-logo"
          />
          <div className="header-text">
            <h1>Order Management Interface</h1>
            <p>Shopify & Klaviyo Integration | Username: <strong>{username}</strong></p>
          </div>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('products');
            setSelectedOrderId(null);
          }}
        >
          Products
        </button>
        <button
          className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('orders');
            setSelectedOrderId(null);
          }}
        >
          Orders
        </button>
        <button
          className={`tab-button ${activeTab === 'modify' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('modify');
            setSelectedOrderId(null);
          }}
        >
          Modify Order
        </button>
      </div>

      {activeTab === 'products' && <ProductDisplay />}
      {activeTab === 'orders' && <OrderListing onModifyOrder={handleModifyOrder} />}
      {activeTab === 'modify' && <OrderModification initialOrderId={selectedOrderId} />}
    </div>
  );
}

export default App;

