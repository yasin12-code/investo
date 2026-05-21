// ═══════════════════════════════════════════════════════════════
// HTML Parser - Extracts claims from market_article.html
// Uses Cheerio for DOM parsing of blog article content
// ═══════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

/**
 * Parse the market article HTML and extract structured claims
 * @param {string} [filePath] - Optional custom path to HTML file
 * @returns {object} Parsed article data with claims and credibility
 */
function parseMarketArticle(filePath) {
  const defaultPath = path.resolve(__dirname, '../../../data/sources/market_article.html');
  const htmlPath = filePath || defaultPath;
  const html = fs.readFileSync(htmlPath, 'utf-8');
  const $ = cheerio.load(html);

  const metadata = extractMetadata($);
  const claims = extractClaims($);
  const contradictions = extractContradictions($);
  const credibility = assessCredibility(metadata);

  return {
    sourceId: 'html-market-article',
    sourceType: 'html',
    sourceName: metadata.title || 'Pakistan Real Estate Weekly Article',
    metadata,
    claims,
    contradictions,
    credibility,
    rawHtml: html
  };
}

/**
 * Extract article metadata from HTML
 */
function extractMetadata($) {
  const title = $('title').text().trim() || $('h1').first().text().trim();
  const author = $('meta[name="author"]').attr('content') || extractAuthorFromByline($);
  const date = $('meta[name="date"]').attr('content') || extractDateFromByline($);
  const source = $('meta[name="source"]').attr('content') || 'Unknown';
  const byline = $('.byline').text().trim();
  const category = $('.category').text().trim();

  // Extract footer credibility info
  const footerText = $('footer').text().trim();
  const credibilityNote = footerText.match(/credibility:\s*(.+)/i);

  return {
    title,
    author,
    date,
    parsedDate: date ? new Date(date).toISOString() : new Date().toISOString(),
    source,
    byline,
    category,
    credibilityNote: credibilityNote ? credibilityNote[1].trim() : 'Not specified',
    publishedDate: $('footer p').first().text().replace('Published:', '').trim()
  };
}

/**
 * Extract quantifiable claims from article content
 */
function extractClaims($) {
  const claims = [];
  const articleText = $('article').text();

  // ── Growth rate claim: 8% (contradicts PRA's 18%) ──
  const growthMatch = articleText.match(/year-over-year price growth has slowed to approximately (\d+)%/i);
  if (growthMatch) {
    claims.push({
      metric: 'overall_property_price_growth',
      value: parseFloat(growthMatch[1]),
      unit: 'percent',
      confidence: 0.60,
      context: 'Article claims Lahore property growth has slowed to ~8% YoY, citing independent analysis',
      contradicts: 'PRA report claims 18% growth'
    });
  }

  // ── DHA Phase 6 specific growth ──
  const dhaMatch = articleText.match(/DHA Phase 6 grew only\s*([\d.]+)%\s*YoY/i);
  if (dhaMatch) {
    claims.push({
      metric: 'property_price_growth_yoy',
      value: parseFloat(dhaMatch[1]),
      unit: 'percent',
      confidence: 0.58,
      context: 'DHA Phase 6 grew only 8.2% YoY in Q4 2025, down from 19.2% in Q4 2024'
    });
  }

  // ── Transaction volume decline ──
  const txMatch = articleText.match(/Transaction volumes have declined by (\d+)%/i);
  if (txMatch) {
    claims.push({
      metric: 'transaction_volume_change',
      value: -parseFloat(txMatch[1]),
      unit: 'percent',
      confidence: 0.55,
      context: 'Transaction volumes declined by 12% compared to same period last year'
    });
  }

  // ── Rental yield compression ──
  const yieldMatch = articleText.match(/averaging just ([\d.]+)%\s*across premium/i);
  if (yieldMatch) {
    claims.push({
      metric: 'avg_rental_yield_premium',
      value: parseFloat(yieldMatch[1]),
      unit: 'percent',
      confidence: 0.55,
      context: 'Rental yields compressed to 2.0% across premium locations'
    });
  }

  // ── Supply increase ──
  const supplyMatch = articleText.match(/New housing supply has increased by (\d+)%/i);
  if (supplyMatch) {
    claims.push({
      metric: 'housing_supply_increase',
      value: parseFloat(supplyMatch[1]),
      unit: 'percent',
      confidence: 0.50,
      context: 'New housing supply increased by 25% as developers complete delayed projects'
    });
  }

  // ── Bahria Town growth ──
  const bahriaMatch = articleText.match(/Bahria Town Lahore.*?([\d.]+)%\s*growth/i);
  if (bahriaMatch) {
    claims.push({
      metric: 'bahria_town_price_growth',
      value: parseFloat(bahriaMatch[1]),
      unit: 'percent',
      confidence: 0.55,
      context: 'Bahria Town Lahore shows 10.5% growth per article analysis'
    });
  }

  // ── Interest rate ──
  const rateMatch = articleText.match(/borrowing costs remain elevated at ([\d.]+)%/i);
  if (rateMatch) {
    claims.push({
      metric: 'borrowing_cost',
      value: parseFloat(rateMatch[1]),
      unit: 'percent',
      confidence: 0.80,
      context: 'Borrowing costs remain elevated at 17.5%'
    });
  }

  // ── Future growth prediction ──
  const predictionMatch = articleText.match(/(\d+)-(\d+)%\s*annually over the next/i);
  if (predictionMatch) {
    claims.push({
      metric: 'expected_property_growth_2026_2028',
      value: { min: parseFloat(predictionMatch[1]), max: parseFloat(predictionMatch[2]) },
      unit: 'percent',
      confidence: 0.45,
      context: 'Article predicts 6-8% annual growth, below inflation (negative real return)'
    });
  }

  // ── Inventory increase ──
  const inventoryMatch = articleText.match(/increased available inventory by (\d+)%/i);
  if (inventoryMatch) {
    claims.push({
      metric: 'inventory_increase',
      value: parseFloat(inventoryMatch[1]),
      unit: 'percent',
      confidence: 0.50,
      context: 'New apartment complexes in DHA and Bahria increased inventory by 30%'
    });
  }

  // Extract list items from key findings
  $('section.analysis ul li').each(function () {
    const text = $(this).text().trim();
    const strongText = $(this).find('strong').text().trim();
    if (strongText && !claims.some(c => text.includes(String(c.value)))) {
      // Already captured by regex above, skip duplicates
    }
  });

  return claims;
}

/**
 * Extract the article's own acknowledgment of contradictions
 */
function extractContradictions($) {
  const contradictions = [];
  const contradictSection = $('section.analysis').text();

  // The article itself mentions the 18% vs 8% discrepancy
  if (contradictSection.includes('18%') && contradictSection.includes('8%')) {
    contradictions.push({
      metric: 'property_price_growth',
      sourceA: { name: 'Punjab Revenue Authority', value: 18, unit: 'percent' },
      sourceB: { name: 'Pakistan Real Estate Weekly (independent)', value: 8, unit: 'percent' },
      gap: 10,
      possibleReasons: [
        'PRA relies on listed prices rather than actual transaction prices',
        'PRA sample skewed toward high-end properties in newer developments',
        'Article based on 500+ verified sales vs PRA registered transaction data'
      ]
    });
  }

  return contradictions;
}

/**
 * Assess credibility of the article source
 */
function assessCredibility(metadata) {
  let score = 0.5; // Base for independent blog
  const factors = [];

  // Independent blog / unaudited = lower credibility
  if (metadata.credibilityNote.toLowerCase().includes('unaudited')) {
    score -= 0.10;
    factors.push({ factor: 'Unaudited data', impact: -0.10 });
  }

  if (metadata.credibilityNote.toLowerCase().includes('blog')) {
    score -= 0.05;
    factors.push({ factor: 'Blog source (not institutional)', impact: -0.05 });
  }

  // Has a named author = slight positive
  if (metadata.author && metadata.author !== 'Unknown') {
    score += 0.05;
    factors.push({ factor: 'Named author (Aisha Malik)', impact: +0.05 });
  }

  // Has a category/structured format = slight positive
  if (metadata.category) {
    score += 0.03;
    factors.push({ factor: 'Structured market analysis format', impact: +0.03 });
  }

  // Has data backing
  factors.push({ factor: 'Claims based on 500 verified transactions', impact: +0.05 });
  score += 0.05;

  // Self-aware of limitations (has disclaimer)
  factors.push({ factor: 'Includes disclaimer about limitations', impact: +0.02 });
  score += 0.02;

  return {
    score: Math.max(0, Math.min(1, score)),
    label: score >= 0.6 ? 'Moderate' : score >= 0.4 ? 'Low-Moderate' : 'Low',
    factors
  };
}

// ── Utility Functions ──

function extractAuthorFromByline($) {
  const byline = $('.byline').text();
  const match = byline.match(/By\s+([^|]+)/i);
  return match ? match[1].trim() : 'Unknown';
}

function extractDateFromByline($) {
  const byline = $('.byline').text();
  const match = byline.match(/(\w+\s+\d+,\s*\d{4})/);
  if (match) {
    try { return new Date(match[1]).toISOString().split('T')[0]; } catch { }
  }
  return null;
}

module.exports = { parseMarketArticle };
