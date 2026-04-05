const { CATEGORY_LIBRARY } = require('./catalogService');

function getCategoryFallback(category) {
  return CATEGORY_LIBRARY.find((item) => item.category === category) || CATEGORY_LIBRARY[0];
}

async function fetchPublicSignals(category, tags = []) {
  const profile = getCategoryFallback(category);
  const query = encodeURIComponent([category, ...tags].slice(0, 5).join(' '));

  const sources = [
    `https://trends.google.com/trends/explore?date=today%205-y&geo=IN&q=${query}`,
    `https://www.amazon.in/s?k=${query}`,
    `https://www.flipkart.com/search?q=${query}`,
  ];

  const snapshots = await Promise.allSettled(
    sources.map(async (url) => {
      const response = await fetch(url, {
        headers: {
          'User-Agent': process.env.SCRAPER_USER_AGENT || 'Mozilla/5.0 DKTrendifyBot',
        },
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const text = await response.text();
      return text.slice(0, 240);
    })
  );

  return {
    priceRange: profile.priceRange,
    demandLevel: profile.demandLevel,
    competitionLevel: profile.competitionLevel,
    trendingKeywords: Array.from(new Set([...profile.tags, ...tags])).slice(0, 10),
    amazonSnapshot: snapshots[1].status === 'fulfilled' ? snapshots[1].value : `${profile.category} Amazon search snapshot unavailable.`,
    flipkartSnapshot: snapshots[2].status === 'fulfilled' ? snapshots[2].value : `${profile.category} Flipkart search snapshot unavailable.`,
    googleTrendsSnapshot: snapshots[0].status === 'fulfilled' ? snapshots[0].value : `${profile.category} Google Trends snapshot unavailable.`,
    googleTrendsIndex: profile.googleTrendsIndex,
    estimatedMargin: profile.marginRange,
    searchQueryUsed: decodeURIComponent(query),
    contextApplied: [],
  };
}

function buildContextTokens(context = {}) {
  const customKeywords = String(context.customKeywords || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 5);

  const contextValues = [
    context.targetAudience,
    context.style,
    context.material,
    context.useCase,
    context.region,
    context.season,
    context.competitorReference,
    ...customKeywords,
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .slice(0, 7);

  return {
    contextValues,
    customKeywords,
  };
}

async function fetchPublicSignalsWithContext(category, tags = [], context = {}) {
  const profile = getCategoryFallback(category);
  const { contextValues, customKeywords } = buildContextTokens(context);
  const queryTerms = [category, ...tags.slice(0, 3), ...contextValues].slice(0, 8);
  const query = encodeURIComponent(queryTerms.join(' '));

  const sources = [
    `https://trends.google.com/trends/explore?date=today%205-y&geo=IN&q=${query}`,
    `https://www.amazon.in/s?k=${query}`,
    `https://www.flipkart.com/search?q=${query}`,
  ];

  const snapshots = await Promise.allSettled(
    sources.map(async (url) => {
      const response = await fetch(url, {
        headers: {
          'User-Agent': process.env.SCRAPER_USER_AGENT || 'Mozilla/5.0 DKTrendifyBot',
        },
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const text = await response.text();
      return text.slice(0, 240);
    })
  );

  return {
    priceRange: profile.priceRange,
    demandLevel: profile.demandLevel,
    competitionLevel: profile.competitionLevel,
    trendingKeywords: Array.from(new Set([...profile.tags, ...tags, ...customKeywords, ...contextValues])).slice(0, 12),
    amazonSnapshot: snapshots[1].status === 'fulfilled' ? snapshots[1].value : `${profile.category} Amazon search snapshot unavailable.`,
    flipkartSnapshot: snapshots[2].status === 'fulfilled' ? snapshots[2].value : `${profile.category} Flipkart search snapshot unavailable.`,
    googleTrendsSnapshot: snapshots[0].status === 'fulfilled' ? snapshots[0].value : `${profile.category} Google Trends snapshot unavailable.`,
    googleTrendsIndex: profile.googleTrendsIndex,
    estimatedMargin: profile.marginRange,
    searchQueryUsed: decodeURIComponent(query),
    contextApplied: contextValues,
  };
}

module.exports = {
  fetchPublicSignals,
  fetchPublicSignalsWithContext,
};
