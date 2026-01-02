const { GraphQLClient } = require('graphql-request');

const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const USERNAME = process.env.USERNAME;

const client = new GraphQLClient(
  `https://${SHOPIFY_STORE_URL}/admin/api/2024-10/graphql.json`,
  {
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
  }
);
 
const GET_PRODUCTS = `
  query getProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          description
          featuredImage {
            url
            altText
          }
          images(first: 1) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                price
                sku
                inventoryQuantity
                availableForSale
                image {
                  url
                  altText
                }
              }
            }
          }
        }
      }
    }
  }
`;

const CREATE_ORDER = `
  mutation orderCreate($order: OrderCreateOrderInput!) {
    orderCreate(order: $order) {
      order {
        id
        name
        totalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        tags
        lineItems(first: 10) {
          edges {
            node {
              id
              title
              quantity
              variant {
                id
                title
                price
              }
            }
          }
        }
        discountApplications(first: 10) {
          edges {
            node {
              ... on DiscountCodeApplication {
                code
                value {
                  ... on MoneyV2 {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const ORDER_EDIT_BEGIN = `
  mutation orderEditBegin($id: ID!) {
    orderEditBegin(id: $id) {
      calculatedOrder {
        id
        totalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        lineItems(first: 10) {
          edges {
            node {
              id
              title
              quantity
              variant {
                id
                title
                price
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const ORDER_EDIT_ADD_VARIANT = `
  mutation orderEditAddVariant($id: ID!, $variantId: ID!, $quantity: Int!) {
    orderEditAddVariant(id: $id, variantId: $variantId, quantity: $quantity) {
      calculatedOrder {
        id
        totalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        lineItems(first: 10) {
          edges {
            node {
              id
              title
              quantity
              variant {
                id
                title
                price
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const ORDER_EDIT_SET_QUANTITY = `
  mutation orderEditSetQuantity($id: ID!, $lineItemId: ID!, $quantity: Int!) {
    orderEditSetQuantity(id: $id, lineItemId: $lineItemId, quantity: $quantity) {
      calculatedOrder {
        id
        totalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        lineItems(first: 10) {
          edges {
            node {
              id
              title
              quantity
              variant {
                id
                title
                price
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const ORDER_EDIT_COMMIT = `
  mutation orderEditCommit($id: ID!, $notifyCustomer: Boolean, $staffNote: String) {
    orderEditCommit(id: $id, notifyCustomer: $notifyCustomer, staffNote: $staffNote) {
      order {
        id
        name
        totalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        tags
        lineItems(first: 10) {
          edges {
            node {
              id
              title
              quantity
              variant {
                id
                title
                price
              }
            }
          }
        }
        discountApplications(first: 10) {
          edges {
            node {
              ... on DiscountCodeApplication {
                code
                value {
                  ... on MoneyV2 {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const GET_DISCOUNT_CODES = `
  query getDiscountCodes($first: Int!) {
    codeDiscountNodes(first: $first) {
      edges {
        node {
          id
          codeDiscount {
            ... on DiscountCodeBasic {
              codes(first: 10) {
                edges {
                  node {
                    code
                    id
                  }
                }
              }
              status
              title
              summary
              usageLimit
              appliesOncePerCustomer
              startsAt
              endsAt
            }
            ... on DiscountCodeBxgy {
              codes(first: 10) {
                edges {
                  node {
                    code
                    id
                  }
                }
              }
              status
              title
              summary
              usageLimit
              appliesOncePerCustomer
              startsAt
              endsAt
            }
            ... on DiscountCodeFreeShipping {
              codes(first: 10) {
                edges {
                  node {
                    code
                    id
                  }
                }
              }
              status
              title
              summary
              usageLimit
              appliesOncePerCustomer
              startsAt
              endsAt
            }
          }
        }
      }
    }
  }
`;

const GET_ORDERS = `
  query getOrders($first: Int!, $query: String!) {
    orders(first: $first, query: $query) {
      edges {
        node {
          id
          name
          createdAt
          displayFulfillmentStatus
          displayFinancialStatus
          cancelledAt
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          tags
          lineItems(first: 10) {
            edges {
              node {
                id
                title
                quantity
                variant {
                  id
                  title
                  price
                }
              }
            }
          }
          discountApplications(first: 10) {
            edges {
              node {
                ... on DiscountCodeApplication {
                  code
                  value {
                    ... on MoneyV2 {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

class ShopifyService {
  async getProducts() {
    try {
      const data = await client.request(GET_PRODUCTS, { first: 50 });
      return data.products.edges.map(edge => {
        const featuredImage = edge.node.featuredImage?.url || 
                             (edge.node.images?.edges?.[0]?.node?.url) || 
                             null;
        const imageAlt = edge.node.featuredImage?.altText || 
                        (edge.node.images?.edges?.[0]?.node?.altText) || 
                        edge.node.title;
        
        return {
          id: edge.node.id,
          title: edge.node.title,
          description: edge.node.description,
          image: featuredImage,
          imageAlt: imageAlt,
          variants: edge.node.variants.edges.map(v => ({
            id: v.node.id,
            title: v.node.title,
            price: v.node.price,
            sku: v.node.sku,
            inventoryQuantity: v.node.inventoryQuantity,
            availableForSale: v.node.availableForSale,
            image: v.node.image?.url || null,
          })),
        };
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  async createOrder(lineItems, email = 'test@example.com') {
    try {
      if (!lineItems || lineItems.length === 0) {
        throw new Error('Line items are required');
      }

      const totalAmount = lineItems.reduce(
        (sum, item) => sum + parseFloat(item.price || 0) * (item.quantity || 0),
        0
      ).toFixed(2);

      const emailTag = email ? `email-${Buffer.from(email).toString('base64')}` : null;
      const tags = emailTag ? [USERNAME, emailTag] : [USERNAME];

      const orderInput = {
        email,
        lineItems: lineItems.map(item => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        tags: tags,
        transactions: [
          {
            kind: 'SALE',
            status: 'SUCCESS',
            amountSet: {
              shopMoney: {
                amount: totalAmount,
                currencyCode: 'USD',
              },
            },
          },
        ],
      };

      const data = await client.request(CREATE_ORDER, { order: orderInput });

      if (data.orderCreate.userErrors && data.orderCreate.userErrors.length > 0) {
        const errors = data.orderCreate.userErrors.map(e => `${e.field}: ${e.message}`).join(', ');
        throw new Error(`Order creation failed: ${errors}`);
      }

      if (!data.orderCreate.order) {
        throw new Error('Order creation failed: No order returned');
      }

      return data.orderCreate.order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  getEmailFromTags(tags) {
    if (!tags || !Array.isArray(tags)) {
      return null;
    }
    
    const emailTag = tags.find(tag => tag && tag.startsWith('email-'));
    if (!emailTag) {
      return null;
    }
    
    try {
      const encodedEmail = emailTag.replace('email-', '');
      return Buffer.from(encodedEmail, 'base64').toString('utf-8');
    } catch (error) {
      console.error('Error decoding email from tag:', error);
      return null;
    }
  }

  async getOrderById(orderId) {
    try {
      const query = `tag:${USERNAME}`;
      const data = await client.request(GET_ORDERS, { first: 50, query });
      const orderEdge = data.orders.edges.find(edge => edge.node.id === orderId);
      
      if (!orderEdge) {
        throw new Error('Order not found or does not belong to this user');
      }
      
      const emailFromTags = this.getEmailFromTags(orderEdge.node.tags);
      
      return {
        id: orderEdge.node.id,
        name: orderEdge.node.name,
        email: emailFromTags,
        createdAt: orderEdge.node.createdAt,
        totalPrice: orderEdge.node.totalPriceSet.shopMoney.amount,
        currencyCode: orderEdge.node.totalPriceSet.shopMoney.currencyCode,
        tags: orderEdge.node.tags,
        fulfillmentStatus: orderEdge.node.displayFulfillmentStatus || 'UNFULFILLED',
        financialStatus: orderEdge.node.displayFinancialStatus || 'PENDING',
        cancelledAt: orderEdge.node.cancelledAt,
        lineItems: (orderEdge.node.lineItems?.edges || []).map(li => ({
          id: li.node.id,
          title: li.node.title,
          quantity: li.node.quantity,
          variant: li.node.variant ? {
            id: li.node.variant.id,
            title: li.node.variant.title,
            price: li.node.variant.price,
          } : null,
        })),
        discounts: (orderEdge.node.discountApplications?.edges || []).map(d => ({
          code: d.node.code,
          amount: d.node.value.amount,
          currencyCode: d.node.value.currencyCode,
        })),
      };
    } catch (error) {
      console.error('Error fetching order by ID:', error);
      throw error;
    }
  }

  async removeLineItem(orderId, lineItemId) {
    try {
      const originalOrder = await this.getOrderById(orderId);

      const beginData = await client.request(ORDER_EDIT_BEGIN, { id: orderId });
      
      if (beginData.orderEditBegin.userErrors && beginData.orderEditBegin.userErrors.length > 0) {
        const errors = beginData.orderEditBegin.userErrors.map(e => e.message).join(', ');
        if (errors.includes('cannot be edited') || errors.includes('not editable') || errors.includes('The order cannot be edited')) {
          throw new Error(`This order cannot be edited. Orders that are fulfilled, cancelled, or archived cannot be modified. Please select a different order.`);
        }
        throw new Error(errors);
      }

      const calculatedOrderId = beginData.orderEditBegin.calculatedOrder.id;
      const currentLineItems = beginData.orderEditBegin.calculatedOrder.lineItems.edges;
      
      if (currentLineItems.length <= 1) {
        throw new Error('Cannot remove all line items from an order');
      }

      // Find the original line item to get its variant ID
      const originalLineItem = originalOrder.lineItems.find(li => li.id === lineItemId);
      
      if (!originalLineItem) {
        throw new Error('Line item not found in order');
      }

      // Find the matching line item in calculated order by variant ID
      // The calculated order has different line item IDs, so we match by variant
      const calculatedLineItem = currentLineItems.find(
        item => item.node.variant && item.node.variant.id === originalLineItem.variant?.id
      );

      if (!calculatedLineItem) {
        // Line item might already be removed
        const currentOrder = await this.getOrderById(orderId);
        return currentOrder;
      }

      // Use orderEditSetQuantity with quantity 0 to remove the line item
      const removeData = await client.request(ORDER_EDIT_SET_QUANTITY, {
        id: calculatedOrderId,
        lineItemId: calculatedLineItem.node.id,
        quantity: 0,
      });

      if (removeData.orderEditSetQuantity.userErrors && removeData.orderEditSetQuantity.userErrors.length > 0) {
        const errors = removeData.orderEditSetQuantity.userErrors.map(e => e.message).join(', ');
        if (errors.includes('cannot be edited because it is removed') || errors.includes('removed')) {
          const currentOrder = await this.getOrderById(orderId);
          return currentOrder;
        }
        throw new Error(errors);
      }

      const commitData = await client.request(ORDER_EDIT_COMMIT, {
        id: calculatedOrderId,
        notifyCustomer: false,
      });

      if (commitData.orderEditCommit.userErrors && commitData.orderEditCommit.userErrors.length > 0) {
        throw new Error(commitData.orderEditCommit.userErrors.map(e => e.message).join(', '));
      }

      // Wait for Shopify to process and fetch fresh order with all details
      await new Promise(resolve => setTimeout(resolve, 2000));
      const updatedOrder = await this.getOrderById(orderId);
      
      return updatedOrder;
    } catch (error) {
      console.error('Error removing line item:', error);
      throw error;
    }
  }

  async addLineItem(orderId, variantId, quantity) {
    try {
      if (!variantId || quantity < 1) {
        throw new Error('Invalid variant ID or quantity');
      }

      await this.getOrderById(orderId);

      const beginData = await client.request(ORDER_EDIT_BEGIN, { id: orderId });
      
      if (beginData.orderEditBegin.userErrors && beginData.orderEditBegin.userErrors.length > 0) {
        throw new Error(beginData.orderEditBegin.userErrors.map(e => e.message).join(', '));
      }

      const calculatedOrderId = beginData.orderEditBegin.calculatedOrder.id;
      const currentLineItems = beginData.orderEditBegin.calculatedOrder.lineItems.edges;
      const existingItem = currentLineItems.find(
        item => item.node.variant && item.node.variant.id === variantId
      );

      if (existingItem) {
        const newQuantity = existingItem.node.quantity + quantity;
        const setQuantityData = await client.request(ORDER_EDIT_SET_QUANTITY, {
          id: calculatedOrderId,
          lineItemId: existingItem.node.id,
          quantity: newQuantity,
        });

        if (setQuantityData.orderEditSetQuantity.userErrors && setQuantityData.orderEditSetQuantity.userErrors.length > 0) {
          throw new Error(setQuantityData.orderEditSetQuantity.userErrors.map(e => e.message).join(', '));
        }
      } else {
        const addVariantData = await client.request(ORDER_EDIT_ADD_VARIANT, {
          id: calculatedOrderId,
          variantId,
          quantity,
        });

        if (addVariantData.orderEditAddVariant.userErrors && addVariantData.orderEditAddVariant.userErrors.length > 0) {
          throw new Error(addVariantData.orderEditAddVariant.userErrors.map(e => e.message).join(', '));
        }
      }

      const commitData = await client.request(ORDER_EDIT_COMMIT, {
        id: calculatedOrderId,
        notifyCustomer: false,
      });

      if (commitData.orderEditCommit.userErrors && commitData.orderEditCommit.userErrors.length > 0) {
        throw new Error(commitData.orderEditCommit.userErrors.map(e => e.message).join(', '));
      }

      return commitData.orderEditCommit.order;
    } catch (error) {
      console.error('Error adding line item:', error);
      throw error;
    }
  }

  async getOrders() {
    try {
      const query = `tag:${USERNAME}`;
      const data = await client.request(GET_ORDERS, { first: 50, query });
      
      return data.orders.edges.map(edge => {
        const emailFromTags = this.getEmailFromTags(edge.node.tags);
        
        return {
          id: edge.node.id,
          name: edge.node.name,
          email: emailFromTags,
          createdAt: edge.node.createdAt,
          totalPrice: edge.node.totalPriceSet.shopMoney.amount,
          currencyCode: edge.node.totalPriceSet.shopMoney.currencyCode,
          tags: edge.node.tags,
          fulfillmentStatus: edge.node.displayFulfillmentStatus || 'UNFULFILLED',
          financialStatus: edge.node.displayFinancialStatus || 'PENDING',
          cancelledAt: edge.node.cancelledAt,
          lineItems: (edge.node.lineItems?.edges || []).map(li => ({
            id: li.node.id,
            title: li.node.title,
            quantity: li.node.quantity,
            variant: li.node.variant ? {
              id: li.node.variant.id,
              title: li.node.variant.title,
              price: li.node.variant.price,
            } : null,
          })),
          discounts: (edge.node.discountApplications?.edges || []).map(d => ({
            code: d.node.code,
            amount: d.node.value.amount,
            currencyCode: d.node.value.currencyCode,
          })),
        };
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  async getDiscountCodes() {
    try {
      const data = await client.request(GET_DISCOUNT_CODES, { first: 50 });
      
      if (!data || !data.codeDiscountNodes) {
        return [];
      }
      
      if (!data.codeDiscountNodes.edges || data.codeDiscountNodes.edges.length === 0) {
        return [];
      }
      
      const discountCodes = [];
      
      data.codeDiscountNodes.edges.forEach((edge) => {
        if (!edge || !edge.node) {
          return;
        }
        
        const discount = edge.node.codeDiscount;
        if (!discount) {
          return;
        }
        
        if (discount.status === 'ACTIVE' || discount.status === 'SCHEDULED') {
          if (!discount.codes || !discount.codes.edges) {
            return;
          }
          
          discount.codes.edges.forEach((codeEdge) => {
            if (!codeEdge || !codeEdge.node) {
              return;
            }
            
            const code = codeEdge.node.code;
            if (!code) {
              return;
            }
            
            const now = new Date();
            const startsAt = discount.startsAt ? new Date(discount.startsAt) : null;
            const endsAt = discount.endsAt ? new Date(discount.endsAt) : null;
            
            const isActive = (!startsAt || now >= startsAt) && (!endsAt || now <= endsAt);
            
            if (isActive || discount.status === 'ACTIVE') {
              discountCodes.push({
                code: code,
                title: discount.title || 'Discount',
                summary: discount.summary || '',
                status: discount.status,
                startsAt: discount.startsAt,
                endsAt: discount.endsAt,
                usageLimit: discount.usageLimit,
                appliesOncePerCustomer: discount.appliesOncePerCustomer,
              });
            }
          });
        }
      });
      
      return discountCodes;
    } catch (error) {
      console.error('Error fetching discount codes:', error);
      return [];
    }
  }

  getUsername() {
    return USERNAME;
  }
}

module.exports = new ShopifyService();

