function detectContradictions(normalizedSources) {
  const contradictions = [];
  const metricsMap = {};
  
  // Group claims by metric
  for (const source of normalizedSources) {
    for (const claim of source.claims) {
      if (!metricsMap[claim.metric]) {
        metricsMap[claim.metric] = [];
      }
      metricsMap[claim.metric].push({
        sourceId: source.sourceId,
        sourceName: source.sourceName,
        credibilityScore: source.credibilityScore,
        value: claim.value,
        confidence: claim.confidence,
        context: claim.context
      });
    }
  }
  
  // Find contradictions (claims for same metric with significantly different values)
  for (const [metric, claims] of Object.entries(metricsMap)) {
    if (claims.length > 1) {
      // Check if values differ
      const firstValue = claims[0].value;
      const hasContradiction = claims.some(c => {
         if (typeof c.value === 'number' && typeof firstValue === 'number') {
             // More than 20% difference or 5 absolute points difference
             return Math.abs(c.value - firstValue) > 5 || Math.abs(c.value - firstValue) / firstValue > 0.2;
         }
         return false; // Complex values ignored for simple check
      });
      
      if (hasContradiction) {
        // Resolve by credibility
        const sortedClaims = [...claims].sort((a, b) => b.credibilityScore - a.credibilityScore);
        const resolution = sortedClaims[0]; // Pick highest credibility
        
        contradictions.push({
          metric,
          sources: claims.map(c => c.sourceName),
          values: claims.map(c => c.value),
          sourceA: claims[0]?.sourceName || '',
          valA: claims[0]?.value !== undefined ? `${claims[0].value}${claims[0].unit === 'percent' ? '%' : ''}` : '',
          sourceB: claims[1]?.sourceName || '',
          valB: claims[1]?.value !== undefined ? `${claims[1].value}${claims[1].unit === 'percent' ? '%' : ''}` : '',
          resolution: `Resolved in favor of ${resolution.sourceName} due to higher credibility (${resolution.credibilityScore.toFixed(2)}).`,
          confidence: resolution.credibilityScore,
          resolvedValue: resolution.value
        });
      }
    }
  }
  
  return contradictions;
}

module.exports = { detectContradictions };
