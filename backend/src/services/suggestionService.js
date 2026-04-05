const { CATEGORY_LIBRARY } = require('./catalogService');

function getProductSuggestions(category, market) {
  const profile = CATEGORY_LIBRARY.find((item) => item.category === category) || CATEGORY_LIBRARY[0];
  return profile.suggestions.map((suggestion) => ({
    ...suggestion,
    label: suggestion.label || (market.googleTrendsIndex >= 80 ? 'High Profit Potential' : 'Low Return Risk'),
  }));
}

module.exports = {
  getProductSuggestions,
};
