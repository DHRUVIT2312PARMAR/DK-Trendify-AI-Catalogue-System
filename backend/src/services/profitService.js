function calculateProfitScenario({ costPrice, commissionRate = 12, targetMargin = 35 }) {
  const commission = (costPrice * commissionRate) / 100;
  const markup = (costPrice * targetMargin) / 100;
  const suggestedSellingPrice = costPrice + commission + markup;
  const netProfit = suggestedSellingPrice - costPrice - commission;
  const profitMargin = (netProfit / suggestedSellingPrice) * 100;

  return {
    costPrice: Number(costPrice.toFixed(2)),
    commissionRate: Number(commissionRate.toFixed(2)),
    commission: Number(commission.toFixed(2)),
    suggestedSellingPrice: Number(suggestedSellingPrice.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    profitMargin: Number(profitMargin.toFixed(2)),
  };
}

module.exports = {
  calculateProfitScenario,
};
