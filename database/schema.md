# MongoDB Schema

## Collection: `users`
Stores authenticated seller and admin accounts.

### Fields
- `name` - Display name.
- `email` - Unique login identifier.
- `passwordHash` - bcrypt hash.
- `role` - `Admin` or `Seller`.
- `lastLoginAt` - Most recent login timestamp.
- timestamps

### Indexes
- `{ email: 1 }` unique

## Collection: `analyses`
Stores every catalogue analysis request and result for reporting, review, and future model training.

### Fields
- `userId` - Owner of the analysis.
- `sourceImageName` - Original uploaded filename.
- `imageUrl` - Local or Cloudinary asset URL.
- `storageProvider` - `local` or `cloudinary`.
- `productName` - AI-generated catalogue title.
- `category` - Inferred product category.
- `description` - SEO-friendly catalogue description.
- `tags` - Search keywords and category tags.
- `costPrice` - Seller's cost price input.
- `market.priceRange` - Estimated selling range.
- `market.demandLevel` - Low, Medium, or High.
- `market.competitionLevel` - Relative marketplace competition.
- `market.trendingKeywords` - Search phrases and trending terms.
- `market.amazonSnapshot` - Amazon research snapshot or fallback.
- `market.flipkartSnapshot` - Flipkart research snapshot or fallback.
- `market.googleTrendsIndex` - Trend score from 0 to 100.
- `market.estimatedMargin` - Estimated gross margin band.
- `returnRisk.label` - Low Risk, Medium Risk, or High Risk.
- `returnRisk.note` - Human-readable return-risk explanation.
- `returnRisk.score` - Numeric risk score.
- `profit.suggestedSellingPrice` - Recommended selling price.
- `profit.commission` - Estimated commission.
- `profit.netProfit` - Estimated net profit.
- `profit.profitMargin` - Estimated margin percentage.
- `quality.passed` - Whether the image passed validation.
- `quality.status` - Passed or Rejected.
- `quality.note` - Validation summary.
- `quality.resolution.width` - Image width.
- `quality.resolution.height` - Image height.
- `quality.blurScore` - Edge sharpness score.
- `quality.watermarkScore` - Heuristic watermark likelihood.
- `quality.edgeVariance` - Blur/clarity indicator.
- `quality.hasText` - OCR text detection flag.
- `suggestions[]` - Suggested products with labels and reasoning.
- `status` - `accepted` or `rejected`.
- timestamps

### Indexes
- `{ userId: 1, createdAt: -1 }`
- `{ category: 1, createdAt: -1 }`
- `{ status: 1, createdAt: -1 }`
- `{ 'returnRisk.label': 1 }`

## Future Collections
- `projects` for seller storefronts or batch catalogues
- `subscriptions` for SaaS billing and plan management
