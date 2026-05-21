function extractInsights(normalizedSources) {
  const insights = [];
  
  // Basic insight extraction based on available metrics
  let topPropertyGrowth = null;
  let topYield = null;
  
  for (const source of normalizedSources) {
    for (const claim of source.claims) {
      if (claim.metric === 'property_price_growth_yoy' && typeof claim.value === 'number') {
        insights.push({
            type: 'trend',
            title: 'Property Growth Trend',
            description: `Source ${source.sourceName} indicates a growth of ${claim.value}%.`,
            confidence: claim.confidence
        });
      }
      if (claim.metric === 'avg_rental_yield_lahore' || claim.metric === 'avg_rental_yield_premium') {
         insights.push({
             type: 'yield',
             title: 'Rental Yield',
             description: `Rental yield is reported around ${claim.value}%.`,
             confidence: claim.confidence
         });
      }
      if (claim.metric === 'market_sentiment') {
         insights.push({
             type: 'live_news',
             title: 'Live Market Sentiment',
             description: claim.value,
             confidence: claim.confidence
         });
      }
    }
  }
  
  return insights;
}

module.exports = { extractInsights };
