const { CATEGORY_LIBRARY } = require('./catalogService');

function getCategoryProfile(category) {
  return CATEGORY_LIBRARY.find((item) => item.category === category) || CATEGORY_LIBRARY[0];
}

function getMarketInsights(category, tags) {
  const profile = getCategoryProfile(category);
  const keywordSet = new Set([...(tags || []), ...profile.tags]);

  return {
    priceRange: profile.priceRange,
    demandLevel: profile.demandLevel,
    competitionLevel: profile.competitionLevel,
    trendingKeywords: Array.from(keywordSet).slice(0, 8),
    amazonSnapshot: `${profile.category} listings show stable conversion around ${profile.priceRange}.`,
    flipkartSnapshot: `${profile.category} catalogue mix remains competitive with strong search visibility.`,
    googleTrendsIndex: profile.googleTrendsIndex,
    estimatedMargin: profile.marginRange,
  };
}

function getDashboardCategories() {
  return CATEGORY_LIBRARY.slice(0, 4).map((item, index) => ({
    name: item.category,
    trend: index === 0 ? 'High' : index === 1 ? 'Rising' : index === 2 ? 'Stable' : 'Competitive',
    margin: item.marginRange,
    risk: item.returnRisk.replace(' Risk', ''),
    badgeClass: item.returnRisk === 'Low Risk' ? 'badge-soft-success' : item.returnRisk === 'Medium Risk' ? 'badge-soft-warning' : 'badge-soft-danger',
  }));
}

module.exports = {
  getMarketInsights,
  getDashboardCategories,
};
