const Analysis = require('../models/Analysis');
const { isDatabaseReady } = require('../config/db');
const { getDashboardCategories } = require('./marketService');
const mongoose = require('mongoose');

function buildQuery(user) {
  if (!user?.id || user.role !== 'Seller') {
    return {};
  }

  return {
    userId: new mongoose.Types.ObjectId(user.id),
  };
}

function buildFallbackMetrics() {
  return [
    { label: 'Trending Products', value: '128' },
    { label: 'Most Searched Categories', value: '42' },
    { label: 'Avg. Profit Margin', value: '34%' },
    { label: 'Low Return Risk Items', value: '67' },
  ];
}

async function getDashboardData(user = null) {
  if (!isDatabaseReady()) {
    return {
      metrics: buildFallbackMetrics(),
      categories: getDashboardCategories(),
    };
  }

  const query = buildQuery(user);
  const totalDocuments = await Analysis.countDocuments(query);
  const rejectedCount = await Analysis.countDocuments({ ...query, status: 'rejected' });
  const categoryAggregation = await Analysis.aggregate([
    { $match: { ...query, status: 'accepted' } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 4 },
  ]);

  const riskAggregation = await Analysis.aggregate([
    { $match: { ...query, status: 'accepted' } },
    { $group: { _id: '$returnRisk.label', count: { $sum: 1 } } },
  ]);

  const marginAggregation = await Analysis.aggregate([
    { $match: { ...query, status: 'accepted' } },
    {
      $project: {
        numericMargin: {
          $toDouble: {
            $arrayElemAt: [{ $split: ['$market.estimatedMargin', '%'] }, 0],
          },
        },
      },
    },
    { $group: { _id: null, avgMargin: { $avg: '$numericMargin' } } },
  ]);

  const categories = categoryAggregation.length > 0 ? categoryAggregation.map((item, index) => ({
    name: item._id,
    trend: index === 0 ? 'High' : index === 1 ? 'Rising' : index === 2 ? 'Stable' : 'Competitive',
    margin: 'Derived from recent analyses',
    risk: 'Market-driven',
    badgeClass: index === 0 ? 'badge-soft-success' : index === 1 ? 'badge-soft-warning' : 'badge-soft-danger',
  })) : getDashboardCategories();

  const lowRiskCount = riskAggregation.find((item) => item._id === 'Low Risk')?.count || 0;
  const avgMargin = marginAggregation[0]?.avgMargin ? `${Math.round(marginAggregation[0].avgMargin)}%` : 'N/A';

  return {
    metrics: [
      { label: 'Trending Products', value: String(totalDocuments || 0) },
      { label: 'Most Searched Categories', value: String(categoryAggregation.length || 0) },
      { label: 'Avg. Profit Margin', value: avgMargin },
      { label: 'Low Return Risk Items', value: String(lowRiskCount) },
      { label: 'Rejected Uploads', value: String(rejectedCount) },
    ],
    categories,
  };
}

module.exports = {
  getDashboardData,
};
