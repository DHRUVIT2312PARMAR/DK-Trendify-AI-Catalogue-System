require('dotenv').config();

const { connectDatabase, isDatabaseReady } = require('../src/config/db');
const Analysis = require('../src/models/Analysis');

async function seed() {
  await connectDatabase();

  if (!isDatabaseReady()) {
    console.log('MongoDB is not configured. Seed skipped.');
    return;
  }

  await Analysis.deleteMany({});

  await Analysis.insertMany([
    {
      sourceImageName: 'home-decor-sample.jpg',
      productName: 'Decorative Wall Accent - Home Decor',
      category: 'Home Decor',
      description: 'Discover decorative wall accent for buyers who want elevated and lifestyle-led catalogue listings. Built for value, search visibility, and strong Meesho conversion potential.',
      tags: ['home decor', 'wall accent', 'aesthetic'],
      market: {
        priceRange: '₹249 - ₹899',
        demandLevel: 'High',
        competitionLevel: 'Medium',
        trendingKeywords: ['home decor', 'wall accent', 'aesthetic'],
        amazonSnapshot: 'Home Decor listings show stable conversion.',
        flipkartSnapshot: 'Home Decor catalogue mix remains competitive.',
        googleTrendsIndex: 86,
        estimatedMargin: '36% - 52%',
      },
      returnRisk: {
        label: 'Low Risk',
        note: 'Decor products are less exposed to size and fit complaints.',
        score: 20,
      },
      quality: {
        passed: true,
        status: 'Passed',
        note: 'Image passed catalogue quality validation.',
        resolution: { width: 1400, height: 1400 },
        blurScore: 28,
        watermarkScore: 0.08,
      },
      suggestions: [],
      status: 'accepted',
    },
  ]);

  console.log('Seed data inserted successfully.');
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
