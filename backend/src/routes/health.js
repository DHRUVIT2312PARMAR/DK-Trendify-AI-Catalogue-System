const express = require('express');
const { isDatabaseReady } = require('../config/db');

const healthRouter = express.Router();
const SERVER_NAME = process.env.SERVER_NAME || 'DK';

healthRouter.get('/', (_request, response) => {
  response.json({
    success: true,
    service: `${SERVER_NAME} API`,
    status: 'healthy',
    database: isDatabaseReady() ? 'connected' : 'fallback',
    timestamp: new Date().toISOString(),
  });
});

module.exports = {
  healthRouter,
};
