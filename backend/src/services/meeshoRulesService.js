function buildGuidanceItem(rule, status, reason, action) {
  return { rule, status, reason, action };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function generateMeeshoCatalogGuidance({ quality, returnRisk, category, market }) {
  const checks = [];

  checks.push(
    buildGuidanceItem(
      'No text or price overlay',
      quality?.hasText ? 'fail' : 'pass',
      quality?.hasText ? 'Detected visible text through OCR.' : 'No major text overlay detected.',
      quality?.hasText ? 'Upload a clean image without price labels or text stickers.' : 'Keep image text-free for better acceptance.'
    )
  );

  checks.push(
    buildGuidanceItem(
      'No watermark-like overlay',
      (quality?.watermarkScore || 0) >= 0.38 ? 'fail' : 'pass',
      (quality?.watermarkScore || 0) >= 0.38 ? 'Possible corner overlay watermark signal detected.' : 'No strong watermark signal detected.',
      (quality?.watermarkScore || 0) >= 0.38 ? 'Use original image without watermark or brand stamp overlays.' : 'Maintain clean corners and product focus.'
    )
  );

  checks.push(
    buildGuidanceItem(
      'Image clarity',
      (quality?.blurScore || 0) < 12 ? 'fail' : 'pass',
      (quality?.blurScore || 0) < 12 ? 'Image appears blurry.' : 'Image sharpness looks acceptable.',
      (quality?.blurScore || 0) < 12 ? 'Retake in better light and focus on product edges.' : 'Keep using high-clarity photos for listing trust.'
    )
  );

  checks.push(
    buildGuidanceItem(
      'Distortion check',
      quality?.profile?.aspectRatio > 3 || quality?.profile?.aspectRatio < 0.33 ? 'fail' : 'pass',
      quality?.profile?.aspectRatio > 3 || quality?.profile?.aspectRatio < 0.33 ? 'Image may look stretched or distorted.' : 'No strong distortion signal detected.',
      quality?.profile?.aspectRatio > 3 || quality?.profile?.aspectRatio < 0.33 ? 'Use original proportions and avoid extreme crop stretch.' : 'Maintain natural product proportions.'
    )
  );

  const riskHint = returnRisk?.label === 'High Risk'
    ? 'High return-risk category. Add more precise attributes and expectation-setting points.'
    : returnRisk?.label === 'Medium Risk'
      ? 'Medium return-risk category. Improve description clarity to reduce mismatch returns.'
      : 'Lower return-risk category. Continue with utility-first listing details.';

  const listingRecommendations = [
    `Use category-consistent keywords in title and attributes: ${category || 'General category'}.`,
    `Set pricing inside market signal range: ${market?.priceRange || 'Use competitive category range'}.`,
    riskHint,
  ];

  const weights = {
    'No text or price overlay': 0.25,
    'No watermark-like overlay': 0.2,
    'Image clarity': 0.35,
    'Distortion check': 0.2,
  };

  const weightedScore = checks.reduce((sum, check) => {
    const weight = weights[check.rule] || 0.25;
    return sum + (check.status === 'pass' ? weight : 0);
  }, 0);

  const blurSignal = clamp((quality?.blurScore || 0) / 18, 0, 1);
  const edgeSignal = clamp((quality?.edgeVariance || 0) / 350, 0, 1);
  const watermarkPenalty = clamp((quality?.watermarkScore || 0) / 0.55, 0, 1);
  const textPenalty = quality?.hasText ? 0.25 : 0;
  const confidenceRaw = ((blurSignal * 0.4) + (edgeSignal * 0.4) + ((1 - watermarkPenalty) * 0.2) - textPenalty) * 100;

  const score = Math.round(weightedScore * 100);
  const confidence = Math.round(clamp(confidenceRaw, 8, 99));

  const failedChecks = checks.filter((item) => item.status === 'fail');
  const qcPassSuggestions = failedChecks.length > 0
    ? failedChecks.map((item, index) => `${index + 1}. ${item.action}`)
    : [
      '1. Keep plain or neutral backgrounds for stronger click-through quality.',
      '2. Add at least one close-up and one full-product angle in catalogue media.',
      '3. Keep title, attributes, and first image tightly aligned to reduce returns.',
    ];

  const verdict = score >= 85
    ? 'Ready to Upload'
    : score >= 60
      ? 'Upload with Improvements'
      : 'Fix Before Upload';

  const nextBestAction = failedChecks[0]?.action || 'Proceed to title and attribute optimization for better conversion.';

  return {
    score,
    confidence,
    verdict,
    nextBestAction,
    checks,
    qcPassSuggestions,
    listingRecommendations,
  };
}

module.exports = {
  generateMeeshoCatalogGuidance,
};
