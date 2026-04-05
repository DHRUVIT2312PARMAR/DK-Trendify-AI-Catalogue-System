const { calculateProfitScenario } = require('../services/profitService');

function calculateProfit(request, response) {
  const result = calculateProfitScenario(request.body);
  return response.json({ success: true, data: result });
}

module.exports = {
  calculateProfit,
};
