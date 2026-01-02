import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

const OrderModification = ({ initialOrderId = null }) => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(initialOrderId || '');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [action, setAction] = useState(null);
  const [selectedLineItemId, setSelectedLineItemId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (initialOrderId && initialOrderId !== selectedOrderId) {
      setSelectedOrderId(initialOrderId);
    }
  }, [initialOrderId]);

  useEffect(() => {
    if (selectedOrderId) {
      const order = orders.find((o) => o.id === selectedOrderId);
      setSelectedOrder(order);
    } else {
      setSelectedOrder(null);
    }
  }, [selectedOrderId, orders]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ordersData, productsData] = await Promise.all([
        apiService.getOrders(),
        apiService.getProducts(),
      ]);
      setOrders(ordersData);
      setProducts(productsData);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLineItem = async () => {
    if (!selectedOrderId || !selectedLineItemId) {
      setError('Please select an order and a line item to remove');
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      setSuccess(null);

      const updatedOrder = await apiService.removeLineItem(selectedOrderId, selectedLineItemId);
      
      setSuccess(`Line item removed successfully! Order updated.`);
      setSelectedLineItemId('');
      setAction(null);
      await fetchData();
      setSelectedOrderId(updatedOrder.id);
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err.message || 'Failed to remove line item');
    } finally {
      setProcessing(false);
    }
  };

  const handleAddLineItem = async () => {
    if (!selectedOrderId || !selectedVariantId || quantity < 1) {
      setError('Please select an order, variant, and enter a valid quantity');
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      setSuccess(null);

      const updatedOrder = await apiService.addLineItem(selectedOrderId, selectedVariantId, quantity);
      
      setSuccess(`Line item added successfully! Order updated.`);
      setSelectedVariantId('');
      setQuantity(1);
      setAction(null);
      await fetchData();
      setSelectedOrderId(updatedOrder.id);
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err.message || 'Failed to add line item');
    } finally {
      setProcessing(false);
    }
  };

  const getAllVariants = () => {
    return products.flatMap((product) =>
      product.variants.map((variant) => ({
        ...variant,
        productTitle: product.title,
      }))
    );
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="section">
      <h2>Modify Order</h2>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div style={{ marginBottom: '20px' }}>
        <label className="label">Select Order:</label>
        <select
          className="input"
          value={selectedOrderId}
          onChange={(e) => {
            setSelectedOrderId(e.target.value);
            setAction(null);
            setError(null);
            setSuccess(null);
          }}
        >
          <option value="">Choose an order</option>
          {orders.map((order) => {
            const statusText = order.cancelledAt 
              ? 'CANCELLED' 
              : (order.fulfillmentStatus || 'UNFULFILLED').replace('_', ' ');
            return (
              <option key={order.id} value={order.id}>
                {order.name} - {order.currencyCode} {parseFloat(order.totalPrice).toFixed(2)} - {statusText}
              </option>
            );
          })}
        </select>
      </div>

      {selectedOrder && (
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px' 
        }}>
          <h3 style={{ marginBottom: '10px' }}>Order Details: {selectedOrder.name}</h3>
          <p><strong>Email:</strong> {selectedOrder.email || 'N/A'}</p>
          <p><strong>Status:</strong> {
            selectedOrder.cancelledAt ? (
              <span style={{ 
                padding: '4px 8px', 
                borderRadius: '4px', 
                backgroundColor: '#e74c3c', 
                color: 'white', 
                fontSize: '12px',
                fontWeight: 'bold',
                marginLeft: '8px'
              }}>CANCELLED</span>
            ) : (
              <span style={{ 
                padding: '4px 8px', 
                borderRadius: '4px', 
                backgroundColor: (selectedOrder.fulfillmentStatus === 'FULFILLED' ? '#27ae60' : '#3498db'), 
                color: 'white', 
                fontSize: '12px',
                fontWeight: 'bold',
                marginLeft: '8px'
              }}>
                {(selectedOrder.fulfillmentStatus || 'UNFULFILLED').replace('_', ' ')}
              </span>
            )
          }</p>
          <p><strong>Total:</strong> {selectedOrder.currencyCode} {parseFloat(selectedOrder.totalPrice).toFixed(2)}</p>
          <p><strong>Line Items:</strong></p>
          <ul style={{ marginLeft: '20px' }}>
            {selectedOrder.lineItems.map((item, idx) => (
              <li key={idx}>
                {item.title} - Qty: {item.quantity}
                {item.variant && ` - $${item.variant.price}`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedOrderId && (
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <button
              className={`button ${action === 'remove' ? 'button-danger' : ''}`}
              onClick={() => {
                setAction(action === 'remove' ? null : 'remove');
                setError(null);
              }}
            >
              Remove Item
            </button>
            <button
              className={`button ${action === 'add' ? 'button-success' : ''}`}
              onClick={() => {
                setAction(action === 'add' ? null : 'add');
                setError(null);
              }}
            >
              Add Item
            </button>
          </div>

          {action === 'remove' && (
            <div style={{ 
              backgroundColor: '#fff', 
              padding: '20px', 
              borderRadius: '8px',
              border: '1px solid #ddd'
            }}>
              <h3 style={{ marginBottom: '15px' }}>Remove Line Item</h3>
              <label className="label">Select Line Item to Remove:</label>
              <select
                className="input"
                value={selectedLineItemId}
                onChange={(e) => setSelectedLineItemId(e.target.value)}
              >
                <option value="">Choose a line item</option>
                {selectedOrder.lineItems.map((item, idx) => (
                  <option key={item.id || idx} value={item.id}>
                    {item.title} - Qty: {item.quantity}
                  </option>
                ))}
              </select>
              <button
                className="button button-danger"
                onClick={handleRemoveLineItem}
                disabled={processing || !selectedLineItemId}
                style={{ width: '100%', marginTop: '10px' }}
              >
                {processing ? 'Removing...' : 'Remove Line Item'}
              </button>
            </div>
          )}

          {action === 'add' && (
            <div style={{ 
              backgroundColor: '#fff', 
              padding: '20px', 
              borderRadius: '8px',
              border: '1px solid #ddd'
            }}>
              <h3 style={{ marginBottom: '15px' }}>Add Line Item</h3>
              <label className="label">Select Variant:</label>
              <select
                className="input"
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(e.target.value)}
              >
                <option value="">Choose a variant</option>
                {getAllVariants().map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.productTitle} - {variant.title} - ${variant.price}
                  </option>
                ))}
              </select>
              <label className="label" style={{ marginTop: '10px' }}>Quantity:</label>
              <input
                type="number"
                className="input"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
              />
              <button
                className="button button-success"
                onClick={handleAddLineItem}
                disabled={processing || !selectedVariantId || quantity < 1}
                style={{ width: '100%', marginTop: '10px' }}
              >
                {processing ? 'Adding...' : 'Add Line Item'}
              </button>
            </div>
          )}
        </div>
      )}

      {!selectedOrderId && (
        <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '20px' }}>
          Please select an order to modify.
        </p>
      )}
    </div>
  );
};

export default OrderModification;

