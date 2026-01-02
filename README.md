# Shopify-Klaviyo Order Management Interface

A full-stack order management application that integrates with Shopify Admin GraphQL API and Klaviyo for event tracking.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Data Flow](#data-flow)
- [Assumptions](#assumptions)
- [Scaling Considerations](#scaling-considerations)
- [Estimated Time](#estimated-time)

## Overview

This application provides a React-based interface for managing Shopify orders with automatic Klaviyo event tracking. It ensures data isolation by filtering orders based on a unique username tag, allowing multiple assessors to work independently without interfering with each other's data.

## Architecture

### System Architecture

```
┌─────────────────┐
│  React Client   │
│   (Port 3000)   │
└────────┬────────┘
         │ HTTP/REST
         │
┌────────▼────────┐
│  Express Server │
│   (Port 3001)   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│Shopify│ │Klaviyo│
│GraphQL│ │  API  │
│  API  │ │       │
└───────┘ └───────┘
```

### Component Structure

**Frontend (React)**
- `App.js` - Main application component with tab navigation and logo header
- `components/ProductDisplay.js` - Product listing with images and order creation
- `components/OrderListing.js` - Order listing with search, pagination, and sorting
- `components/OrderModification.js` - Order modification interface (add/remove items)
- `services/apiService.js` - API client with error handling

**Backend (Node.js/Express)**
- `server/index.js` - Express server setup and middleware
- `server/routes/shopify.js` - Shopify API routes
- `server/routes/klaviyo.js` - Klaviyo API routes
- `server/services/shopifyService.js` - Shopify GraphQL client
- `server/services/klaviyoService.js` - Klaviyo API client

## Technology Stack

### Frontend
- **React 18.2.0** - UI framework
- **Axios** - HTTP client for API calls
- **CSS3** - Styling (no external UI libraries for simplicity)

### Backend
- **Node.js** - Runtime environment
- **Express 4.18.2** - Web framework
- **graphql-request** - GraphQL client for Shopify
- **Axios** - HTTP client for Klaviyo REST API
- **dotenv** - Environment variable management

### External APIs
- **Shopify Admin GraphQL API** (2024-10 version)
- **Klaviyo Events API v3**

## Features

### 1. Product Display
- Fetches products and variants from Shopify using GraphQL
- Displays product information with variant selection
- Shows product images (with placeholder for missing images)
- Shows inventory quantities and pricing
- Quantity input with total calculation
- Discount code validation during order creation

### 2. Create Order
- Creates orders in Shopify via GraphQL mutation
- Automatically tags orders with username for data isolation
- Stores customer email in order tags (base64 encoded) for Klaviyo integration
- Marks orders as paid with transaction
- Validates discount codes before order creation
- Sends "Order Created" event to Klaviyo with order details
- Includes ShopifyOrderID and Username in Klaviyo event payload

### 3. Modify Order
- **Remove Item**: Remove line items from orders using Order Edit API
- **Add Item**: Add new line items to existing orders using Order Edit API
- Prevents removing all line items from an order
- Automatically updates quantity if adding an existing variant
- Extracts email from order tags for Klaviyo events
- Sends "Order Modified" event to Klaviyo after each modification
- Includes ShopifyOrderID and Username in Klaviyo event payload

**Note**: Discount codes cannot be applied to existing orders via API (Shopify limitation). Discounts can be validated during order creation but must be applied manually in Shopify Admin.

### 4. Order Listing
- Fetches orders filtered by username tag
- Displays comprehensive order details (name, email, total, line items, created date)
- Search functionality (by order name, email, total, or line items)
- Pagination (10 orders per page)
- Sorting by creation date (newest first)
- "Modify" button to navigate to order modification
- Real-time refresh capability
- Extracts and displays email from order tags

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- Shopify development store access
- Klaviyo account with API keys

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shopify
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```
   
   Or install separately:
   ```bash
   npm install
   cd server && npm install
   cd ../client && npm install
   ```

3. **Configure environment variables**
   
   Copy the example environment file:
   ```bash
   cp server/.env.example server/.env
   ```
   
   Edit `server/.env` and set your configuration:
   ```env
   SHOPIFY_STORE_URL=your-store.myshopify.com
   SHOPIFY_ACCESS_TOKEN=your-shopify-access-token-here
   KLAVIYO_PUBLIC_KEY=your-klaviyo-public-key
   KLAVIYO_PRIVATE_KEY=your-klaviyo-private-key
   USERNAME=your-username-here
   PORT=3001
   ```

   **Important**: Set `USERNAME` to your email prefix (e.g., `jane.smith` from `jane.smith@domain.com`)

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SHOPIFY_STORE_URL` | Shopify store domain (without https://) | Yes |
| `SHOPIFY_ACCESS_TOKEN` | Shopify Admin API access token | Yes |
| `KLAVIYO_PUBLIC_KEY` | Klaviyo public API key | Yes |
| `KLAVIYO_PRIVATE_KEY` | Klaviyo private API key | Yes |
| `USERNAME` | Unique identifier (email prefix) | Yes |
| `PORT` | Server port (default: 3001) | No |

## Running the Application

### Development Mode (Both Frontend and Backend)

From the root directory:
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:3001`
- React frontend on `http://localhost:3000`

### Run Separately

**Backend only:**
```bash
cd server
npm run dev
```

**Frontend only:**
```bash
cd client
npm start
```

### Production Build

```bash
cd client
npm run build
```

The built files will be in `client/build/` directory.

## API Endpoints

### Shopify Routes (`/api/shopify`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | Fetch all products with variants and images |
| GET | `/orders` | Fetch orders filtered by username tag |
| POST | `/orders` | Create a new order with email and line items |
| DELETE | `/orders/:orderId/line-items/:lineItemId` | Remove line item from order |
| POST | `/orders/:orderId/line-items` | Add line item to order |
| GET | `/username` | Get current username |
| GET | `/discount-codes` | Fetch active discount codes from Shopify |

### Klaviyo Routes (`/api/klaviyo`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Klaviyo service health check |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health and username |

## Data Flow

### Order Creation Flow

```
1. User selects products/variants in React UI
2. Frontend sends POST /api/shopify/orders
3. Backend validates input
4. Backend calls Shopify GraphQL orderCreate mutation
   - Includes username tag
   - Creates transaction (paid status)
5. Backend sends "Order Created" event to Klaviyo
   - Includes ShopifyOrderID and Username
6. Backend returns order data to frontend
7. Frontend displays success message
```

### Order Modification Flow

```
1. User selects order and modification type (add/remove item)
2. Frontend sends modification request to backend
3. Backend validates order ownership (username tag check)
4. Backend extracts email from order tags
5. Backend calls Shopify Order Edit API:
   - orderEditBegin (starts editing session)
   - orderEditAddVariant or orderEditRemoveLineItem (modifies order)
   - orderEditCommit (finalizes changes)
6. Backend sends "Order Modified" event to Klaviyo with extracted email
   - Includes ShopifyOrderID and Username
7. Backend returns updated order to frontend
8. Frontend refreshes order list and shows success message
```

### Order Listing Flow

```
1. Frontend requests GET /api/shopify/orders
2. Backend queries Shopify with tag filter: "tag:USERNAME"
3. Shopify returns only orders with matching tag
4. Backend transforms and returns order data
5. Frontend displays filtered orders
```

## Assumptions

1. **Username Format**: Username is derived from email prefix (before @). This is set in environment variables.

2. **Order Tagging**: All orders created through this interface are tagged with the username. Orders without this tag are not displayed or modifiable.

3. **Email Storage**: Customer emails are stored in order tags as `email-{base64-encoded-email}` due to Shopify Basic plan restrictions on accessing customer email directly. This allows the system to retrieve emails for Klaviyo events even when the customer object is not accessible.

4. **Email Address**: Default email `test@example.com` is used for orders if not provided. In production, this should be validated and required. The email is stored in order tags for later retrieval.

5. **Currency**: All orders are created with USD currency. The system supports other currencies but defaults to USD.

5. **Discount Codes**: 
   - Discount codes are validated during order creation (client-side validation)
   - Discount codes cannot be applied via API during order creation (Shopify API limitation)
   - Discount codes cannot be applied to existing orders via API (Shopify API limitation)
   - Users must apply discounts manually in Shopify Admin if needed
   - The system fetches and validates available discount codes before order creation

6. **Klaviyo Events**: 
   - Klaviyo event failures do not block order operations (non-blocking)
   - Events are sent asynchronously with error handling
   - All events include `ShopifyOrderID` and `Username` in the payload
   - Events use unique_id to prevent deduplication
   - Email is extracted from order tags for profile matching

7. **GraphQL API Version**: Uses Shopify Admin API version 2024-10. This can be updated in `shopifyService.js`.

8. **Order Modifications**: 
   - Uses Shopify Order Edit API (orderEditBegin → modify → orderEditCommit pattern)
   - Removing all line items from an order is not allowed
   - Adding an existing variant updates the quantity instead of creating a duplicate line item
   - Email is extracted from order tags for Klaviyo events (due to Shopify plan restrictions)

9. **Data Isolation**: Orders are strictly filtered by username tag. No cross-user data access is possible.

10. **Error Handling**: API errors are caught and returned as user-friendly messages. Detailed error logs are maintained server-side.

11. **UI Features**: 
    - Product images with placeholder fallback
    - Search and pagination for order listing
    - Logo in header
    - Responsive design
    - Real-time order updates after modifications

## Scaling Considerations

### Current Limitations

1. **Single Server**: Application runs on a single Node.js process
2. **No Caching**: Every request hits Shopify/Klaviyo APIs
3. **No Database**: No persistent storage for order history
4. **Synchronous Operations**: Order creation and Klaviyo events are synchronous

### Production Scaling Strategies

1. **Horizontal Scaling**
   - Deploy multiple server instances behind a load balancer
   - Use Redis for session management
   - Implement stateless API design (already achieved)

2. **Caching Layer**
   - Implement Redis cache for product data (TTL: 5-15 minutes)
   - Cache order lists with invalidation on mutations
   - Reduce Shopify API calls by 60-80%

3. **Database Integration**
   - Store order snapshots in PostgreSQL/MongoDB
   - Enable faster order listing without Shopify API calls
   - Maintain audit trail of modifications

4. **Asynchronous Processing**
   - Use message queue (RabbitMQ/AWS SQS) for Klaviyo events
   - Implement background workers for event processing
   - Ensure order operations are not blocked by Klaviyo delays

5. **API Rate Limiting**
   - Implement rate limiting middleware (express-rate-limit)
   - Respect Shopify API rate limits (40 requests/second)
   - Implement exponential backoff for rate limit errors

6. **Monitoring & Observability**
   - Add APM (Application Performance Monitoring)
   - Implement structured logging (Winston/Pino)
   - Set up error tracking (Sentry)
   - Monitor API response times and error rates

7. **Security Enhancements**
   - Implement authentication/authorization (JWT/OAuth)
   - Encrypt sensitive data at rest
   - Use HTTPS only
   - Implement API key rotation strategy
   - Add request validation middleware

8. **Frontend Optimization**
   - Implement code splitting and lazy loading
   - Add service worker for offline capability
   - Optimize bundle size (currently ~200KB)
   - Implement virtual scrolling for large order lists

9. **GraphQL Optimization**
   - Implement GraphQL query complexity analysis
   - Use DataLoader for N+1 query prevention
   - Implement query caching at GraphQL level

10. **Testing**
    - Add unit tests (Jest)
    - Integration tests for API endpoints
    - E2E tests (Cypress/Playwright)
    - Load testing (k6/Artillery)

### Estimated Scaling Metrics

- **Current Capacity**: ~100 concurrent users, ~1000 orders/day
- **With Caching**: ~500 concurrent users, ~5000 orders/day
- **With Database + Queue**: ~2000 concurrent users, ~50,000 orders/day
- **Fully Optimized**: ~10,000+ concurrent users, ~500,000+ orders/day


## Thanks!

