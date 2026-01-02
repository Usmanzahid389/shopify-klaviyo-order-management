require('dotenv').config();
const express = require('express');
const cors = require('cors');
const shopifyRoutes = require('./routes/shopify');
const klaviyoRoutes = require('./routes/klaviyo');

const app = express();
const PORT = process.env.PORT || 3001;

const requiredEnvVars = [
  'SHOPIFY_STORE_URL',
  'SHOPIFY_ACCESS_TOKEN',
  'KLAVIYO_PUBLIC_KEY',
  'KLAVIYO_PRIVATE_KEY',
  'USERNAME',
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use('/api/shopify', shopifyRoutes);
app.use('/api/klaviyo', klaviyoRoutes);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    username: process.env.USERNAME,
    timestamp: new Date().toISOString(),
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Username: ${process.env.USERNAME}`);
  console.log(`Shopify Store: ${process.env.SHOPIFY_STORE_URL}`);
  console.log(`API Base URL: http://localhost:${PORT}/api`);
});

