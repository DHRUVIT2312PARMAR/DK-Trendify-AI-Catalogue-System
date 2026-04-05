# Custom Catalog Form Guide

## What Changed
- Bulk upload has been removed.
- The analysis flow is now single-image + custom strategy fields.
- Custom fields directly influence Google-focused scraping query context and final catalog answer.

## Custom Fields
- `targetAudience`
- `style`
- `material`
- `useCase`
- `region`
- `season`
- `customKeywords` (comma separated)
- `competitorReference`

## API Usage
Endpoint: `POST /api/uploads/analyze`

Form data:
- `image`
- `costPrice`
- all custom fields listed above

## How Query Customization Works
The backend combines:
- AI-detected category
- AI tags
- custom form values

Then it builds a Google-oriented query string (`market.searchQueryUsed`) used for trend and marketplace signal fetching.

## Output Additions
The response now includes:
- `customizedCatalog.optimizedTitle`
- `customizedCatalog.buyerPersona`
- `customizedCatalog.googleSearchQuery`
- `customizedCatalog.suggestedBullets[]`

## Recommended Seller Workflow
1. Upload clear product image.
2. Fill custom fields for target market intent.
3. Run analysis.
4. Use `customizedCatalog` output for listing title and bullet points.
5. Review compliance guidance before final publish.
