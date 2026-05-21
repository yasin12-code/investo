const { parsePropertyReport } = require('../ingestion/pdfParser');
const { parsePropertyPrices } = require('../ingestion/csvParser');
const { parseReitDashboard } = require('../ingestion/jsonParser');
const { parseMarketArticle } = require('../ingestion/htmlParser');
const { parseRealtimeFeed } = require('../ingestion/feedParser');
const { normalizeData } = require('../normalization/normalizer');
const { saveFeatures } = require('../normalization/featureStore');
const { v4: uuidv4 } = require('uuid');

async function runOnce() {
  const sessionId = uuidv4();
  const sources = [];
  try { sources.push(parsePropertyReport()); } catch (e) { }
  try { sources.push(parsePropertyPrices()); } catch (e) { }
  try { sources.push(parseReitDashboard()); } catch (e) { }
  try { sources.push(parseMarketArticle()); } catch (e) { }
  try { sources.push(parseRealtimeFeed()); } catch (e) { }

  const normalizedPack = normalizeData(sources);
  const normalizedList = Array.isArray(normalizedPack) ? normalizedPack : normalizedPack.normalized;
  const summary = Array.isArray(normalizedPack)
    ? { sourceCount: sources.length, claimCount: normalizedList.length }
    : normalizedPack.summary;
  // Save features snapshot
  saveFeatures(sessionId, { sourcesCount: sources.length, summary, normalized: normalizedList });
  console.log('Scrape complete. Session:', sessionId, 'sources:', sources.length, 'claims:', summary.claimCount);
  return { sessionId, summary };
}

if (require.main === module) {
  runOnce().catch(err => { console.error(err); process.exit(1); });
}

module.exports = { runOnce };
