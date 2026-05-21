const { v4: uuidv4 } = require('uuid');

// Normalize all parsers into source-centric structure expected by analysis modules.
function normalizeData(parsedSources = []) {
  const normalized = [];

  for (const source of parsedSources) {
    if (!source) continue;

    const normSource = {
      sourceId: source.sourceId || uuidv4(),
      sourceType: source.sourceType || 'unknown',
      sourceName: source.sourceName || source.metadata?.source || 'Unknown Source',
      credibilityScore: source.metadata?.credibilityScore || source.credibilityScore || source.feed_meta?.credibility || 0.5,
      freshness: source.metadata?.parsedDate || source.metadata?.date || source.feed_meta?.last_check || new Date().toISOString(),
      claims: [],
      temporalData: source.temporalData || [],
      rawData: source.rawHtml || source.rawText || source.rawData || source
    };

    if (Array.isArray(source.claims)) {
      normSource.claims = source.claims.map(c => ({
        metric: c.metric,
        value: c.value,
        unit: c.unit || null,
        confidence: c.confidence || 0.5,
        context: c.context || ''
      }));
    }

    if (Array.isArray(source.entries)) {
      for (const entry of source.entries) {
        if (entry.metric && entry.value !== undefined) {
          normSource.claims.push({
            metric: entry.metric,
            value: entry.value,
            unit: entry.unit || null,
            confidence: entry.confidence || 0.5,
            context: `${entry.headline || ''} (${entry.source_type || 'feed'})`
          });
        }
      }
    }

    normalized.push(normSource);
  }

  return normalized;
}

module.exports = { normalizeData };

