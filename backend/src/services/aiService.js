const { inferCatalogProfile } = require('./catalogService');

async function analyzeImageWithAI(file, qualityProfile) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const base64Image = file.buffer.toString('base64');
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a catalogue intelligence engine for Meesho sellers. Return only JSON.',
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Identify the product, category, and keywords. Return JSON with productName, category, tags, description.' },
                { type: 'image_url', image_url: { url: `data:${file.mimetype};base64,${base64Image}` } },
              ],
            },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (response.ok) {
        const payload = await response.json();
        const content = payload?.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          return {
            productName: parsed.productName || 'Unknown Product',
            category: parsed.category || 'General',
            tags: Array.isArray(parsed.tags) ? parsed.tags : [],
            description: parsed.description || '',
          };
        }
      }
    } catch (error) {
      // Fallback to heuristics below.
    }
  }

  return inferCatalogProfile(file.originalname, qualityProfile);
}

module.exports = {
  analyzeImageWithAI,
};
