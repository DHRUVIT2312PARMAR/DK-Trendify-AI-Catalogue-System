const { analyzeUploadedImage } = require('../services/analysisService');

function buildCustomCatalogContext(body = {}) {
  return {
    targetAudience: body.targetAudience || '',
    style: body.style || '',
    material: body.material || '',
    useCase: body.useCase || '',
    region: body.region || '',
    season: body.season || '',
    customKeywords: body.customKeywords || '',
    competitorReference: body.competitorReference || '',
  };
}

async function analyzeSingle(request, response, next) {
  try {
    if (!request.file) {
      return response.status(400).json({ success: false, message: 'Please upload a product image.' });
    }

    const customCatalogContext = buildCustomCatalogContext(request.body);
    const result = await analyzeUploadedImage(request.file, request.user, request.body?.costPrice, customCatalogContext);
    return response.json({ success: true, message: 'Catalogue analysis completed successfully.', data: result });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  analyzeSingle,
};
