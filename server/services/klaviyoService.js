const axios = require('axios');

const KLAVIYO_PUBLIC_KEY = process.env.KLAVIYO_PUBLIC_KEY;
const KLAVIYO_PRIVATE_KEY = process.env.KLAVIYO_PRIVATE_KEY;
const USERNAME = process.env.USERNAME;

const KLAVIYO_API_URL = 'https://a.klaviyo.com/api';

/**
 * KlaviyoService handles all Klaviyo API interactions
 * Uses Klaviyo Events API v3 format
 */
class KlaviyoService {
  /**
   * Send an event to Klaviyo
   * @param {string} eventName - Name of the event (e.g., "Order Created")
   * @param {string} orderId - Shopify order ID
   * @param {object} properties - Additional event properties
   * @returns {Promise<object>} Klaviyo API response
   */
  async sendEvent(eventName, orderId, properties = {}) {
    try {
      const email = properties.email || 'test@example.com';
      const uniqueId = `${orderId}-${eventName}-${Date.now()}`;
      
      const event = {
        data: {
          type: 'event',
          attributes: { 
            properties: {
              ...properties,
              ShopifyOrderID: orderId,
              Username: USERNAME,
            },
            metric: {
              data: {
                type: 'metric',
                attributes: {
                  name: eventName,
                },
              },
            },
            profile: {
              data: {
                type: 'profile',
                attributes: {
                  email: email,
                },
              },
            },
            unique_id: uniqueId,
          },
        },
      };

      const response = await axios.post(
        `${KLAVIYO_API_URL}/events/`,
        event,
        {
          headers: {
            'Authorization': `Klaviyo-API-Key ${KLAVIYO_PRIVATE_KEY}`,
            'revision': '2024-02-15',
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.errors?.[0]?.detail 
        || error.response?.data?.message 
        || error.message;
      
      console.error('Error sending Klaviyo event:', {
        eventName,
        orderId,
        error: errorMessage,
        response: error.response?.data,
      });
      
      return { 
        error: errorMessage,
        success: false 
      };
    }
  }

  async sendOrderCreated(orderId, orderData) {
    return await this.sendEvent('Order Created', orderId, {
      email: orderData.email || 'test@example.com',
      orderName: orderData.name,
      totalPrice: orderData.totalPrice,
      currencyCode: orderData.currencyCode,
    });
  }

  async sendOrderModified(orderId, orderData) {
    return await this.sendEvent('Order Modified', orderId, {
      email: orderData.email || 'test@example.com',
      orderName: orderData.name,
      totalPrice: orderData.totalPrice,
      currencyCode: orderData.currencyCode,
    });
  }
}

module.exports = new KlaviyoService();

