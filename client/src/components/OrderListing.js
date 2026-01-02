import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

const OrderListing = ({ onModifyOrder }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); 

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getOrders();
      setOrders(data);
      setCurrentPage(1);
    } catch (err) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (order) => {
    if (order.cancelledAt) {
      return <span style={{ 
        padding: '4px 8px', 
        borderRadius: '4px', 
        backgroundColor: '#e74c3c', 
        color: 'white', 
        fontSize: '12px',
        fontWeight: 'bold'
      }}>CANCELLED</span>;
    }
    
    const fulfillmentStatus = order.fulfillmentStatus || 'UNFULFILLED';
    const financialStatus = order.financialStatus || 'PENDING';
    
    let statusColor = '#3498db'; // Default blue
    let statusText = 'PENDING';
    
    if (fulfillmentStatus === 'FULFILLED') {
      statusColor = '#27ae60';
      statusText = 'FULFILLED';
    } else if (fulfillmentStatus === 'PARTIAL') {
      statusColor = '#f39c12';
      statusText = 'PARTIAL';
    } else if (financialStatus === 'PAID') {
      statusColor = '#3498db';
      statusText = 'PAID';
    } else if (financialStatus === 'REFUNDED') {
      statusColor = '#e67e22';
      statusText = 'REFUNDED';
    } else if (financialStatus === 'PARTIALLY_PAID') {
      statusColor = '#3498db';
      statusText = 'PARTIALLY PAID';
    }
    
    return (
      <span style={{ 
        padding: '4px 8px', 
        borderRadius: '4px', 
        backgroundColor: statusColor, 
        color: 'white', 
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        {statusText}
      </span>
    );
  };

  const filteredOrders = orders
    .filter(order => {
      const searchLower = searchTerm.toLowerCase();
      return (
        order.name.toLowerCase().includes(searchLower) ||
        (order.email && order.email.toLowerCase().includes(searchLower)) ||
        order.totalPrice.toString().includes(searchTerm) ||
        order.lineItems.some(item => item.title.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA;
    });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const handleModify = (orderId) => {
    if (onModifyOrder) {
      onModifyOrder(orderId);
    }
  };

  if (loading) {
    return <div className="loading">Loading orders...</div>;
  }

  return (
    <div className="section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ margin: 0 }}>My Orders</h2>
        <button
          className="button"
          onClick={fetchOrders}
        >
          Refresh
        </button>
      </div>
      
      {error && <div className="error">{error}</div>}

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          className="input"
          placeholder="Search by order name, email, total, or items..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          style={{ width: '100%', maxWidth: '400px' }}
        />
      </div>

      {orders.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '20px' }}>
          No orders found. Create an order from the Products tab.
        </p>
      ) : filteredOrders.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '20px' }}>
          No orders match your search.
        </p>
      ) : (
        <>
          <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Order Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Total</th>
                  <th>Line Items</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => (
                  <tr key={order.id}>
                    <td><strong>{order.name}</strong></td>
                    <td>{order.email || 'N/A'}</td>
                    <td>{getStatusBadge(order)}</td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>
                      <strong>
                        {order.currencyCode} {parseFloat(order.totalPrice).toFixed(2)}
                      </strong>
                    </td>
                    <td>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                        {order.lineItems.slice(0, 2).map((item, idx) => (
                          <li key={idx} style={{ marginBottom: '3px' }}>
                            {item.title} (Qty: {item.quantity})
                          </li>
                        ))}
                        {order.lineItems.length > 2 && (
                          <li style={{ fontStyle: 'italic', color: '#7f8c8d' }}>
                            +{order.lineItems.length - 2} more
                          </li>
                        )}
                      </ul>
                    </td>
                    <td>
                      <button
                        className="button"
                        onClick={() => handleModify(order.id)}
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                      >
                        Modify
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                className="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{ minWidth: '80px' }}
              >
                Previous
              </button>
              <span style={{ color: '#7f8c8d' }}>
                Page {currentPage} of {totalPages} ({filteredOrders.length} orders)
              </span>
              <button
                className="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{ minWidth: '80px' }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrderListing;
