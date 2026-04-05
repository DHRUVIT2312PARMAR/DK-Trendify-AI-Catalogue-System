const { getDashboardData } = require('../services/dashboardService');

async function getDashboard(request, response, next) {
  try {
    const data = await getDashboardData(request.user);
    return response.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getDashboard,
};
