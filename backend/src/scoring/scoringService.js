const { rankInvestments } = require('./rankingEngine');
const { parseRealtimeFeed } = require('../ingestion/feedParser');
const { parsePropertyPrices } = require('../ingestion/csvParser');
const { parseMarketArticle } = require('../ingestion/htmlParser');
const { parsePropertyReport } = require('../ingestion/pdfParser');
const { saveFeatures } = require('../normalization/featureStore');
const { v4: uuidv4 } = require('uuid');
const cache = require('../cache/cache');

async function scoreProfile(profile) {
  // Build a lightweight insights array from available parsers (local data)
  const sessionId = uuidv4();
  // Check cache first
  try {
    const cacheKey = `score:${Buffer.from(JSON.stringify(profile)).toString('base64')}`;
    const hit = await cache.get(cacheKey);
    if (hit) return hit;
  } catch (e) {
    // cache errors are non-fatal
  }
  const insights = [];

  try {
    const report = parsePropertyReport();
    insights.push({ type: 'report', description: report.sourceName, claims: report.claims });
  } catch (e) { /* ignore missing */ }

  try {
    const csv = parsePropertyPrices();
    insights.push({ type: 'csv', description: csv.sourceName, claims: csv.claims || csv.trends || [] });
  } catch (e) { }

  try {
    const article = parseMarketArticle();
    insights.push({ type: 'article', description: article.sourceName, claims: article.claims || [] });
  } catch (e) { }

  try {
    const feed = parseRealtimeFeed();
    insights.push({ type: 'live_news', description: feed.sourceName, claims: feed.clean || [] });
  } catch (e) { }

  // Save lightweight feature snapshot for later
  const features = {
    profile,
    derived: {
      sourceCount: insights.length,
      timestamp: new Date().toISOString()
    }
  };
  try { saveFeatures(sessionId, features); } catch (e) { /* ignore */ }

  // Use the ranking engine to produce recommendations
  const recommendations = rankInvestments(insights, profile);

  const result = { sessionId, insights, recommendations };
  try {
    const cacheKey = `score:${Buffer.from(JSON.stringify(profile)).toString('base64')}`;
    await cache.set(cacheKey, result, 30);
  } catch (e) { }

  return result;
}

module.exports = { scoreProfile };
