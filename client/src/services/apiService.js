import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      }, 
      timeout: 30000,
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const message = error.response?.data?.error || error.message || 'An error occurred';
        return Promise.reject(new Error(message));
      }
    );
  }

  async getProducts() {
    const response = await this.client.get('/shopify/products');
    return response.data;
  }

  async getOrders() {
    const response = await this.client.get('/shopify/orders');
    return response.data;
  }

  async createOrder(lineItems, email) {
    const response = await this.client.post('/shopify/orders', {
      lineItems,
      email,
    });
    return response.data;
  }

  async removeLineItem(orderId, lineItemId) {
    const encodedOrderId = encodeURIComponent(orderId);
    const encodedLineItemId = encodeURIComponent(lineItemId);
    const response = await this.client.delete(
      `/shopify/orders/${encodedOrderId}/line-items/${encodedLineItemId}`
    );
    return response.data;
  }

  async addLineItem(orderId, variantId, quantity) {
    const encodedOrderId = encodeURIComponent(orderId);
    const response = await this.client.post(`/shopify/orders/${encodedOrderId}/line-items`, {
      variantId,
      quantity,
    });
    return response.data;
  }

  async getUsername() {
    const response = await this.client.get('/shopify/username');
    return response.data;
  }

  async getDiscountCodes() {
    const response = await this.client.get('/shopify/discount-codes');
    return response.data;
  }
}

export const apiService = new ApiService();

