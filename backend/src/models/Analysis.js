const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema(
  {
    sourceImageName: { type: String, required: true },
    imageUrl: { type: String },
    storageProvider: { type: String, default: 'local' },
    productName: { type: String, required: true },
    category: { type: String, required: true, index: true },
    description: { type: String, required: true },
    tags: [{ type: String }],
    costPrice: { type: Number },
    market: {
      priceRange: String,
      demandLevel: String,
      competitionLevel: String,
      trendingKeywords: [String],
      amazonSnapshot: String,
      flipkartSnapshot: String,
      googleTrendsIndex: Number,
      estimatedMargin: String,
    },
    returnRisk: {
      label: String,
      note: String,
      score: Number,
    },
    customCatalogContext: {
      targetAudience: String,
      style: String,
      material: String,
      useCase: String,
      region: String,
      season: String,
      customKeywords: String,
      competitorReference: String,
    },
    customizedCatalog: {
      optimizedTitle: String,
      buyerPersona: String,
      googleSearchQuery: String,
      suggestedBullets: [String],
    },
    profit: {
      suggestedSellingPrice: Number,
      commission: Number,
      netProfit: Number,
      profitMargin: Number,
    },
    quality: {
      passed: Boolean,
      status: String,
      note: String,
      resolution: {
        width: Number,
        height: Number,
      },
      blurScore: Number,
      watermarkScore: Number,
    },
    suggestions: [
      {
        name: String,
        label: String,
        reason: String,
        badgeClass: String,
      },
    ],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    status: {
      type: String,
      enum: ['accepted', 'rejected'],
      default: 'accepted',
    },
  },
  {
    timestamps: true,
  }
);

analysisSchema.index({ category: 1, createdAt: -1 });
analysisSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Analysis', analysisSchema);
