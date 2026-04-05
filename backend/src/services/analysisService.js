const Analysis = require('../models/Analysis');
const { inspectImage } = require('./qualityService');
const { analyzeImageWithAI } = require('./aiService');
const { fetchPublicSignalsWithContext } = require('./scrapingService');
const { classifyReturnRisk } = require('./riskService');
const { getProductSuggestions } = require('./suggestionService');
const { calculateProfitScenario } = require('./profitService');
const { persistFile } = require('./storageService');
const { generateMeeshoCatalogGuidance } = require('./meeshoRulesService');
const { isDatabaseReady } = require('../config/db');

function buildCustomizedCatalog(catalog, market, context = {}) {
  const tone = context.style ? `${context.style} style` : 'market-ready style';
  const materialHint = context.material ? `${context.material} finish` : 'buyer-friendly finish';
  const audience = context.targetAudience || 'general buyers';
  const useCase = context.useCase || 'daily usage';
  const region = context.region ? ` for ${context.region}` : '';

  return {
    optimizedTitle: `${catalog.productName} | ${tone} | ${materialHint}`,
    buyerPersona: `${audience}${region}`,
    googleSearchQuery: market.searchQueryUsed || `${catalog.category} ${catalog.productName}`,
    suggestedBullets: [
      `Designed for ${audience} with ${tone} positioning.`,
      `Best suited for ${useCase}.`,
      `Target pricing aligned with ${market.priceRange || 'category averages'}.`,
      `Use top keywords: ${(market.trendingKeywords || []).slice(0, 4).join(', ') || 'category keywords'}.`,
    ],
  };
}

async function analyzeUploadedImage(file, user = null, costPrice = 0, customCatalogContext = {}) {
  if (!file || !file.buffer) {
    throw new Error('Image buffer is missing.');
  }

  const quality = await inspectImage(file.buffer);
  const storage = await persistFile(file);

  if (!quality.passed) {
    const rejectedGuidance = generateMeeshoCatalogGuidance({
      quality,
      returnRisk: { label: 'High Risk' },
      category: 'Rejected',
      market: { priceRange: 'N/A' },
    });

    const rejectedPayload = {
      productName: 'Rejected Image',
      category: 'Rejected',
      description: 'The uploaded image failed catalogue quality validation.',
      tags: ['rejected', 'quality-check'],
      market: {
        priceRange: 'N/A',
        demandLevel: 'Low',
        competitionLevel: 'Unknown',
        trendingKeywords: [],
        amazonSnapshot: 'Quality validation failed before market analysis.',
        flipkartSnapshot: 'Quality validation failed before market analysis.',
        googleTrendsIndex: 0,
        estimatedMargin: 'N/A',
      },
      returnRisk: {
        label: 'High Risk',
        note: quality.note,
        score: 100,
      },
      quality,
      suggestions: [],
      profit: calculateProfitScenario({ costPrice: Number(costPrice) || 0, commissionRate: 12, targetMargin: 0 }),
      meeshoGuidance: rejectedGuidance,
      customCatalogContext,
      customizedCatalog: {
        optimizedTitle: 'Improve image quality first',
        buyerPersona: customCatalogContext.targetAudience || 'General buyers',
        googleSearchQuery: customCatalogContext.customKeywords || 'product category keyword',
        suggestedBullets: [
          'Fix image quality issues before generating final catalogue copy.',
          'Use clean product image without overlays.',
          'Retest with custom audience and style fields.',
        ],
      },
      imageUrl: storage.url,
      storageProvider: storage.provider,
    };

    if (isDatabaseReady()) {
      await Analysis.create({
        sourceImageName: file.originalname,
        imageUrl: storage.url,
        storageProvider: storage.provider,
        userId: user?.id,
        ...rejectedPayload,
        status: 'rejected',
      });
    }

    return rejectedPayload;
  }

  const catalog = await analyzeImageWithAI(file, quality.profile);
  const market = await fetchPublicSignalsWithContext(catalog.category, catalog.tags, customCatalogContext);
  const returnRisk = classifyReturnRisk(catalog.category);
  const suggestions = getProductSuggestions(catalog.category, market);
  const profit = calculateProfitScenario({
    costPrice: Number(costPrice) || 0,
    commissionRate: 12,
    targetMargin: market?.googleTrendsIndex >= 80 ? 40 : 35,
  });
  const meeshoGuidance = generateMeeshoCatalogGuidance({
    quality,
    returnRisk,
    category: catalog.category,
    market,
  });
  const customizedCatalog = buildCustomizedCatalog(catalog, market, customCatalogContext);

  const payload = {
    productName: catalog.productName,
    category: catalog.category,
    description: catalog.description,
    tags: catalog.tags,
    market,
    returnRisk,
    customCatalogContext,
    customizedCatalog,
    profit,
    quality: {
      passed: quality.passed,
      status: quality.status,
      note: quality.note,
      resolution: quality.resolution,
      blurScore: quality.blurScore,
      watermarkScore: quality.watermarkScore,
      edgeVariance: quality.edgeVariance,
      hasText: quality.hasText,
    },
    suggestions,
    meeshoGuidance,
    imageUrl: storage.url,
    storageProvider: storage.provider,
  };

  if (isDatabaseReady()) {
    await Analysis.create({
      sourceImageName: file.originalname,
      imageUrl: storage.url,
      storageProvider: storage.provider,
      userId: user?.id,
      ...payload,
      status: 'accepted',
    });
  }

  return payload;
}

module.exports = {
  analyzeUploadedImage,
};
