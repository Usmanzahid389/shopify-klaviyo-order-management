import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

const ProductDisplay = () => {
  const [products, setProducts] = useState([]);
  const [discountCodes, setDiscountCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItems, setSelectedItems] = useState({});
  const [email, setEmail] = useState('test@example.com');
  const [discountCode, setDiscountCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const [productsData, discountCodesData] = await Promise.all([
        apiService.getProducts(),
        apiService.getDiscountCodes().catch(() => [])
      ]);
      setProducts(productsData);
      setDiscountCodes(discountCodesData);
    } catch (err) {
      setError(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleVariantSelect = (productId, variant) => {
    setSelectedItems((prev) => ({
      ...prev,
      [productId]: {
        variantId: variant.id,
        price: variant.price,
        quantity: prev[productId]?.quantity || 1,
      },
    }));
  };

  const handleQuantityChange = (productId, quantity) => {
    const quantityNum = parseInt(quantity, 10);
    if (quantityNum > 0 && selectedItems[productId]) {
      setSelectedItems((prev) => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          quantity: quantityNum,
        },
      }));
    }
  };

  const handleCreateOrder = async () => {
    const lineItems = Object.values(selectedItems).filter((item) => item.variantId);
    
    if (lineItems.length === 0) {
      setError('Please select at least one product variant');
      return;
    }

    if (discountCode.trim()) {
      const isValidDiscount = discountCodes.some(dc => 
        dc.code.toLowerCase() === discountCode.trim().toLowerCase()
      );
      
      if (!isValidDiscount) {
        setError(`Invalid discount code "${discountCode}". Please enter a valid discount code or leave it empty.`);
        return;
      }
    }

    try {
      setCreating(true);
      setError(null);
      setSuccess(null);

      const formattedLineItems = lineItems.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
        price: item.price,
      }));

      const order = await apiService.createOrder(formattedLineItems, email);
      
      setSuccess(`Order ${order.name} created successfully!${discountCode ? ` Note: Apply discount code "${discountCode}" manually in Shopify Admin.` : ''}`);
      setSelectedItems({});
      setDiscountCode('');
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err.message || 'Failed to create order');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  return (
    <div className="section">
      <h2>Products</h2>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="product-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <div style={{ 
              marginBottom: '15px', 
              textAlign: 'center',
              minHeight: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }}>
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.imageAlt || product.title}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '200px',
                    objectFit: 'contain',
                    borderRadius: '8px'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              {!product.image && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#bdc3c7',
                  fontSize: '14px',
                  padding: '20px'
                }}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '8px' }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <span>No Image</span>
                </div>
              )}
            </div>
            <h3>{product.title}</h3>
            {product.description && (
              <p style={{ color: '#7f8c8d', marginBottom: '10px', fontSize: '14px' }}>
                {product.description.substring(0, 100)}...
              </p>
            )}
            
            <div className="variant-select">
              <label className="label">Select Variant:</label>
              <select
                value={selectedItems[product.id]?.variantId || ''}
                onChange={(e) => {
                  const variant = product.variants.find((v) => v.id === e.target.value);
                  if (variant) {
                    handleVariantSelect(product.id, variant);
                  }
                }}
              >
                <option value="">Choose a variant</option>
                {product.variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.title} - ${variant.price} 
                    {variant.inventoryQuantity !== null && (
                      ` (Stock: ${variant.inventoryQuantity})`
                    )}
                  </option>
                ))}
              </select>
            </div>

            {selectedItems[product.id] && (
              <div className="quantity-input">
                <label className="label">Quantity:</label>
                <input
                  type="number"
                  min="1"
                  value={selectedItems[product.id].quantity}
                  onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                />
                <span style={{ color: '#7f8c8d' }}>
                  Total: ${(selectedItems[product.id].price * selectedItems[product.id].quantity).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {products.length === 0 && !loading && (
        <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '20px' }}>
          No products found.
        </p>
      )}

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <label className="label">Customer Email:</label>
        <input
          type="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="customer@example.com"
        />
        
        <label className="label" style={{ marginTop: '15px' }}>Discount Code (Optional):</label>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <input
            type="text"
            className="input"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value)}
            placeholder="Enter discount code"
            style={{ flex: 1 }}
          />
          {discountCodes.length > 0 && (
            <select
              className="input"
              onChange={(e) => {
                if (e.target.value) {
                  setDiscountCode(e.target.value);
                }
              }}
              value=""
              style={{ width: 'auto', minWidth: '180px' }}
            >
              <option value="">Select a code</option>
              {discountCodes.map((dc, idx) => (
                <option key={idx} value={dc.code}>
                  {dc.code} {dc.title ? `- ${dc.title}` : ''}
                </option>
              ))}
            </select>
          )}
        </div>
        {discountCodes.length > 0 && (
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#7f8c8d', padding: '10px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
            <strong>Available Discount Codes:</strong>
            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
              {discountCodes.slice(0, 5).map((dc, idx) => (
                <li key={idx} style={{ marginBottom: '3px' }}>
                  <strong>{dc.code}</strong>
                  {dc.title && ` - ${dc.title}`}
                  {dc.summary && ` (${dc.summary})`}
                </li>
              ))}
              {discountCodes.length > 5 && (
                <li style={{ fontStyle: 'italic', color: '#999' }}>
                  ... and {discountCodes.length - 5} more
                </li>
              )}
            </ul>
            <p style={{ margin: '10px 0 0 0', fontStyle: 'italic', color: '#666', fontSize: '11px' }}>
              Note: Discount codes must be applied manually in Shopify Admin after order creation.
            </p>
          </div>
        )}
        
        <button
          className="button button-success"
          onClick={handleCreateOrder}
          disabled={creating || Object.keys(selectedItems).length === 0}
          style={{ width: '100%', marginTop: '10px' }}
        >
          {creating ? 'Creating Order...' : 'Create Order'}
        </button>
      </div>
    </div>
  );
};

export default ProductDisplay;

