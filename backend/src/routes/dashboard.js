const express = require('express');
const { getDashboardData } = require('../services/dashboardService');
const { requireAuth } = require('../middleware/auth');

const dashboardRouter = express.Router();

dashboardRouter.get('/', requireAuth, async (request, response, next) => {
  try {
    const data = await getDashboardData(request.user);
    response.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = {
  dashboardRouter,
};
