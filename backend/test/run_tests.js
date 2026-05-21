const assert = require('assert');
const { normalizeData } = require('../src/normalization/normalizer');
const { runOnce } = require('../src/scrapers/scheduler');
const { scoreProfile } = require('../src/scoring/scoringService');

async function tests() {
  console.log('Running tests...');

  // Normalizer basic sanity
  const n = normalizeData([]);
  assert(Array.isArray(n), 'Normalizer should return an array of normalized sources');

  // Scheduler run
  const s = await runOnce();
  assert(s && s.sessionId, 'Scheduler should return sessionId');

  // Scoring service
  const profile = { location: 'Lahore', budget: 5000000, targetReturn: 10, riskTolerance: 'Moderate' };
  const scored = await scoreProfile(profile);
  assert(scored && scored.recommendations && Array.isArray(scored.recommendations), 'Scoring should return recommendations');

  console.log('All tests passed.');
}

tests().catch(err => { console.error('Tests failed:', err); process.exit(1); });
