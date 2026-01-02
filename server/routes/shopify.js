const express = require('express');
const router = express.Router();
const shopifyService = require('../services/shopifyService');
const klaviyoService = require('../services/klaviyoService');

router.get('/products', async (req, res) => {
  try {
    const products = await shopifyService.getProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
 
router.get('/orders', async (req, res) => {
  try {
    const orders = await shopifyService.getOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/orders', async (req, res) => {
  try {
    const { lineItems, email } = req.body;
    
    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({ error: 'Line items are required' });
    }

    for (const item of lineItems) {
      if (!item.variantId || !item.quantity || item.quantity < 1) {
        return res.status(400).json({ 
          error: 'Each line item must have a valid variantId and quantity >= 1' 
        });
      }
    }

    const customerEmail = email || 'test@example.com';
    const order = await shopifyService.createOrder(lineItems, customerEmail);
    
    const orderData = {
      email: customerEmail,
      name: order.name,
      totalPrice: order.totalPriceSet?.shopMoney?.amount || '0',
      currencyCode: order.totalPriceSet?.shopMoney?.currencyCode || 'USD',
    };
    
    klaviyoService.sendOrderCreated(order.id, orderData).catch(err => {
      console.error('Failed to send Klaviyo Order Created event:', err);
    });

    res.json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

router.delete('/orders/:orderId/line-items/:lineItemId', async (req, res) => {
  try {
    const orderId = decodeURIComponent(req.params.orderId);
    const lineItemId = decodeURIComponent(req.params.lineItemId);

    if (!orderId || !lineItemId) {
      return res.status(400).json({ error: 'Order ID and Line Item ID are required' });
    }

    const originalOrder = await shopifyService.getOrderById(orderId);
    const order = await shopifyService.removeLineItem(orderId, lineItemId);
    
    const customerEmail = originalOrder.email || `order-${order.id.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20)}@${shopifyService.getUsername() || 'shopify'}.orders`;
    
    const orderData = {
      email: customerEmail,
      name: order.name,
      totalPrice: order.totalPriceSet?.shopMoney?.amount || '0',
      currencyCode: order.totalPriceSet?.shopMoney?.currencyCode || 'USD',
    };
    
    klaviyoService.sendOrderModified(order.id, orderData).catch(err => {
      console.error('Failed to send Klaviyo Order Modified event:', err);
    });

    res.json(order);
  } catch (error) {
    console.error('Error removing line item:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

router.post('/orders/:orderId/line-items', async (req, res) => {
  try {
    const orderId = decodeURIComponent(req.params.orderId);
    const { variantId, quantity } = req.body;

    if (!variantId) {
      return res.status(400).json({ error: 'Variant ID is required' });
    }

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    const originalOrder = await shopifyService.getOrderById(orderId);
    const order = await shopifyService.addLineItem(orderId, variantId, parseInt(quantity, 10));
    
    const customerEmail = originalOrder.email || `order-${order.id.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20)}@${shopifyService.getUsername() || 'shopify'}.orders`;
    
    const orderData = {
      email: customerEmail,
      name: order.name,
      totalPrice: order.totalPriceSet?.shopMoney?.amount || '0',
      currencyCode: order.totalPriceSet?.shopMoney?.currencyCode || 'USD',
    };
    
    klaviyoService.sendOrderModified(order.id, orderData).catch(err => {
      console.error('Failed to send Klaviyo Order Modified event:', err);
    });

    res.json(order);
  } catch (error) {
    console.error('Error adding line item:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

router.get('/username', (req, res) => {
  res.json({ username: shopifyService.getUsername() });
});

router.get('/discount-codes', async (req, res) => {
  try {
    const discountCodes = await shopifyService.getDiscountCodes();
    if (!discountCodes || discountCodes.length === 0) {
      return res.json([]);
    }
    res.json(discountCodes);
  } catch (error) {
    console.error('Error fetching discount codes:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch discount codes' });
  }
});

module.exports = router;

