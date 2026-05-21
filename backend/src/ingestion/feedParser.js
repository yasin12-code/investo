// ═══════════════════════════════════════════════════════════════
// Feed Parser - Processes realtime_feed.json entries
// Filters stale, corrupt, duplicate, and spam entries
// Returns clean entries with noise flagging
// ═══════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

const STALE_THRESHOLD_MONTHS = 6;
const SPAM_CONFIDENCE_THRESHOLD = 0.25;

/**
 * Parse and clean the realtime feed data
 * @param {string} [filePath] - Optional custom path to feed JSON
 * @returns {object} Cleaned feed with filter log
 */
function parseRealtimeFeed(filePath) {
  const defaultPath = path.resolve(__dirname, '../../../data/sources/realtime_feed.json');
  const feedPath = filePath || defaultPath;
  const rawJSON = JSON.parse(fs.readFileSync(feedPath, 'utf-8'));

  const meta = rawJSON.feed_meta;
  const entries = rawJSON.entries || [];

  const filterLog = [];
  const clean = [];
  const filtered = [];

  // Track headlines for duplicate detection
  const seenHeadlines = new Set();

  for (const entry of entries) {
    const issues = [];

    // ── Check 1: Stale entries (>6 months old) ──
    if (isStale(entry.timestamp)) {
      issues.push({
        type: 'stale',
        reason: `Entry timestamp ${entry.timestamp} is older than ${STALE_THRESHOLD_MONTHS} months`,
        severity: 'high'
      });
    }

    // ── Check 2: Corrupt entries (null values, ERROR markers) ──
    if (entry.is_corrupt || entry.value === null || entry.change_pct === 'ERROR') {
      issues.push({
        type: 'corrupt',
        reason: 'Entry contains null values or ERROR markers, likely API failure',
        severity: 'critical'
      });
    }

    // ── Check 3: Duplicate detection (by headline) ──
    if (entry.headline) {
      const normalizedHeadline = entry.headline.toLowerCase().trim();
      if (seenHeadlines.has(normalizedHeadline)) {
        issues.push({
          type: 'duplicate',
          reason: `Duplicate headline: "${entry.headline}"`,
          severity: 'medium'
        });
      } else {
        seenHeadlines.add(normalizedHeadline);
      }
    }

    // Also check the explicit 'duplicate' type
    if (entry.type === 'duplicate') {
      if (!issues.some(i => i.type === 'duplicate')) {
        issues.push({
          type: 'duplicate',
          reason: 'Entry explicitly marked as duplicate type',
          severity: 'medium'
        });
      }
    }

    // ── Check 4: Spam / low-confidence entries ──
    if (entry.confidence !== undefined && entry.confidence < SPAM_CONFIDENCE_THRESHOLD) {
      issues.push({
        type: 'spam',
        reason: `Very low confidence (${entry.confidence}), source: ${entry.source_type}`,
        severity: 'high'
      });
    } else if (isSpamLike(entry)) {
      issues.push({
        type: 'spam',
        reason: 'Content exhibits spam-like characteristics (excessive punctuation, ALL CAPS urgency)',
        severity: 'medium'
      });
    }

    // ── Routing: clean or filtered ──
    if (issues.length > 0) {
      filtered.push({
        ...entry,
        filterReasons: issues
      });
      filterLog.push({
        entryId: entry.id,
        action: 'FILTERED',
        issues,
        originalConfidence: entry.confidence
      });
    } else {
      clean.push({
        id: entry.id,
        timestamp: entry.timestamp,
        type: entry.type,
        category: entry.category,
        location: entry.location || 'Pakistan',
        signal: entry.signal || null,
        headline: entry.headline || null,
        metric: entry.metric || null,
        value: entry.value,
        unit: entry.unit || null,
        changePct: entry.change_pct,
        period: entry.period || null,
        confidence: entry.confidence,
        sourceType: entry.source_type,
        qualityScore: computeQualityScore(entry)
      });
    }
  }

  const claims = generateClaims(clean);

  return {
    sourceId: 'realtime-feed',
    sourceType: 'feed',
    sourceName: meta.source || 'MarketPulse Pakistan Live Feed',
    metadata: {
      feedSource: meta.source,
      feedType: meta.type,
      credibilityScore: meta.credibility,
      lastCheck: meta.last_check,
      refreshInterval: meta.refresh_interval_seconds
    },
    stats: {
      totalEntries: entries.length,
      cleanEntries: clean.length,
      filteredEntries: filtered.length,
      filteredBreakdown: {
        stale: filterLog.filter(l => l.issues.some(i => i.type === 'stale')).length,
        corrupt: filterLog.filter(l => l.issues.some(i => i.type === 'corrupt')).length,
        duplicate: filterLog.filter(l => l.issues.some(i => i.type === 'duplicate')).length,
        spam: filterLog.filter(l => l.issues.some(i => i.type === 'spam')).length
      }
    },
    clean,
    filtered,
    filterLog,
    claims
  };
}

/**
 * Check if an entry is older than the stale threshold
 */
function isStale(timestamp) {
  if (!timestamp) return true;
  const entryDate = new Date(timestamp);
  const now = new Date();
  const monthsDiff = (now.getFullYear() - entryDate.getFullYear()) * 12
    + (now.getMonth() - entryDate.getMonth());
  return monthsDiff > STALE_THRESHOLD_MONTHS;
}

/**
 * Detect spam-like content via heuristics
 */
function isSpamLike(entry) {
  if (!entry.headline) return false;
  const headline = entry.headline;

  // Excessive punctuation (3+ exclamation/question marks)
  if ((headline.match(/[!?]{3,}/g) || []).length > 0) return true;

  // ALL CAPS words > 3
  const words = headline.split(/\s+/);
  const capsWords = words.filter(w => w.length > 2 && w === w.toUpperCase());
  if (capsWords.length >= 3) return true;

  // Urgency phrases
  const urgencyPhrases = ['buy now', 'act fast', 'too late', 'to the moon', 'guaranteed'];
  const lower = headline.toLowerCase();
  if (urgencyPhrases.some(phrase => lower.includes(phrase))) return true;

  return false;
}

/**
 * Compute a quality score for clean entries
 */
function computeQualityScore(entry) {
  let score = entry.confidence || 0.5;

  // Boost for institutional sources
  const highCredSources = ['sbp_data', 'exchange_data', 'news_wire', 'government_report'];
  if (highCredSources.includes(entry.source_type)) {
    score = Math.min(1, score + 0.05);
  }

  // Slight penalty for social media
  if (entry.source_type === 'social_media') {
    score = Math.max(0, score - 0.15);
  }

  // Slight penalty for unknown sources
  if (entry.source_type === 'unknown') {
    score = Math.max(0, score - 0.10);
  }

  return parseFloat(score.toFixed(2));
}

/**
 * Generate claims from clean feed entries
 */
function generateClaims(cleanEntries) {
  const claims = [];

  for (const entry of cleanEntries) {
    if (entry.type === 'price_update' && entry.value !== null) {
      claims.push({
        metric: entry.metric || `${entry.category}_price`,
        value: entry.value,
        unit: entry.unit || 'PKR',
        confidence: entry.confidence,
        context: `Feed: ${entry.headline || entry.metric} (${entry.period || 'latest'})`
      });
    }

    if (entry.type === 'sentiment' && entry.signal) {
      claims.push({
        metric: `sentiment_${entry.category}_${entry.location.toLowerCase()}`,
        value: entry.signal,
        unit: 'sentiment',
        confidence: entry.confidence,
        context: `Feed sentiment: ${entry.headline}`
      });
    }

    if (entry.type === 'market_event') {
      claims.push({
        metric: `market_event_${entry.category}`,
        value: entry.signal,
        unit: 'event',
        confidence: entry.confidence,
        context: `Market event: ${entry.headline}`
      });
    }
  }

  return claims;
}

module.exports = { parseRealtimeFeed };
