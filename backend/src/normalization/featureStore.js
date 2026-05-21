const fs = require('fs');
const path = require('path');

const featuresDir = path.resolve(__dirname, '../../../data/features');

function ensureDir() {
  try { fs.mkdirSync(featuresDir, { recursive: true }); } catch (e) { /* ignore */ }
}

function saveFeatures(sessionId, features) {
  ensureDir();
  const file = path.join(featuresDir, `${sessionId}.json`);
  fs.writeFileSync(file, JSON.stringify({ sessionId, savedAt: new Date().toISOString(), features }, null, 2), 'utf-8');
}

function loadFeatures(sessionId) {
  const file = path.join(featuresDir, `${sessionId}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (e) { return null; }
}

function listFeatureFiles() {
  ensureDir();
  return fs.readdirSync(featuresDir).filter(f => f.endsWith('.json'));
}

module.exports = { saveFeatures, loadFeatures, listFeatureFiles };
