// ═══════════════════════════════════════════════════════════════
// CSV Parser - Extracts time-series property price data
// Uses PapaParse to process property_prices.csv
// Computes YoY trends and detects temporal changes
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// CSV Parser - Extracts time-series property price data
// Uses PapaParse to process property_prices.csv and adds location context to claims
// ═══════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

/**
 * Parse property prices CSV and compute temporal analytics, with location context.
 * @param {string} [filePath] - Optional custom path to CSV file
 * @param {string} [location='Lahore'] - City/location name for claim context
 * @returns {object} Parsed data with time series, area summaries, trends, and location-aware claims
 */
function parsePropertyPrices(filePath, location = 'Lahore') {
  const defaultPath = path.resolve(__dirname, '../../../data/sources/property_prices.csv');
  const csvPath = filePath || defaultPath;
  const csvText = fs.readFileSync(csvPath, 'utf-8');

  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
    transformHeader: (header) => header.trim()
  });

  if (parsed.errors.length > 0) {
    console.warn('[CSV Parser] Parse warnings:', parsed.errors.map(e => e.message));
  }

  const rows = parsed.data;
  const areaData = groupByArea(rows);
  const areaSummaries = computeAreaSummaries(areaData);
  const trends = computeTrends(areaData);
  const claims = generateClaims(areaSummaries, trends, location);

  return {
    sourceId: 'csv-property-prices',
    sourceType: 'csv',
    sourceName: `${location} Property Prices - Historical Time Series`,
    totalRows: rows.length,
    areas: Object.keys(areaData),
    areaData,
    areaSummaries,
    trends,
    claims,
    rawData: rows
  };
}

/**
 * Group CSV rows by area name
 */
function groupByArea(rows) {
  const grouped = {};
  for (const row of rows) {
    const area = row.area;
    if (!area) continue;
    if (!grouped[area]) grouped[area] = [];
    grouped[area].push({
      year: row.year,
      quarter: row.quarter,
      period: `${row.year}-${row.quarter}`,
      avgPricePerMarla: row.avg_price_per_marla_pkr,
      rentalYield: row.rental_yield_pct,
      vacancyRate: row.vacancy_rate_pct,
      numTransactions: row.num_transactions,
      priceChangeYoY: row.price_change_yoy_pct,
      sourceConfidence: row.source_confidence
    });
  }

  // Sort each area's data chronologically
  for (const area of Object.keys(grouped)) {
    grouped[area].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      const qOrder = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
      return (qOrder[a.quarter] || 0) - (qOrder[b.quarter] || 0);
    });
  }

  return grouped;
}

/**
 * Compute summary statistics for each area
 */
function computeAreaSummaries(areaData) {
  const summaries = {};

  for (const [area, records] of Object.entries(areaData)) {
    const latest = records[records.length - 1];
    const earliest = records[0];
    const prices = records.map(r => r.avgPricePerMarla).filter(Boolean);
    const yields = records.map(r => r.rentalYield).filter(Boolean);
    const yoyChanges = records.map(r => r.priceChangeYoY).filter(v => v !== null && v !== undefined);

    // Compute CAGR
    const yearsSpan = (latest.year - earliest.year) || 1;
    const cagr = earliest.avgPricePerMarla > 0
      ? (Math.pow(latest.avgPricePerMarla / earliest.avgPricePerMarla, 1 / yearsSpan) - 1) * 100
      : 0;

    summaries[area] = {
      area,
      latestPrice: latest.avgPricePerMarla,
      latestPeriod: latest.period,
      latestYoYChange: latest.priceChangeYoY,
      latestRentalYield: latest.rentalYield,
      latestVacancy: latest.vacancyRate,
      avgConfidence: average(records.map(r => r.sourceConfidence)),
      priceRange: { min: Math.min(...prices), max: Math.max(...prices) },
      yieldRange: { min: Math.min(...yields), max: Math.max(...yields) },
      totalGrowth: ((latest.avgPricePerMarla - earliest.avgPricePerMarla) / earliest.avgPricePerMarla * 100).toFixed(1),
      cagr: cagr.toFixed(1),
      totalDataPoints: records.length,
      avgYoYChange: average(yoyChanges).toFixed(1)
    };
  }

  return summaries;
}

/**
 * Detect temporal trends: rising, falling, stable, or volatile
 */
function computeTrends(areaData) {
  const trends = {};

  for (const [area, records] of Object.entries(areaData)) {
    if (records.length < 3) {
      trends[area] = { direction: 'insufficient_data', momentum: 0 };
      continue;
    }

    const recentRecords = records.slice(-4); // Last 4 data points
    const yoyChanges = recentRecords
      .map(r => r.priceChangeYoY)
      .filter(v => v !== null && v !== undefined);

    if (yoyChanges.length < 2) {
      trends[area] = { direction: 'insufficient_data', momentum: 0 };
      continue;
    }

    const avgRecentChange = average(yoyChanges);
    const isAccelerating = yoyChanges[yoyChanges.length - 1] > yoyChanges[0];
    const volatility = standardDeviation(yoyChanges);

    let direction;
    if (avgRecentChange > 15) direction = 'strongly_rising';
    else if (avgRecentChange > 8) direction = 'rising';
    else if (avgRecentChange > 3) direction = 'moderately_rising';
    else if (avgRecentChange > -3) direction = 'stable';
    else if (avgRecentChange > -8) direction = 'declining';
    else direction = 'strongly_declining';

    trends[area] = {
      direction,
      avgRecentYoYChange: avgRecentChange.toFixed(1),
      isAccelerating,
      volatility: volatility.toFixed(2),
      momentum: isAccelerating ? 'gaining' : 'losing',
      recentDataPoints: yoyChanges
    };
  }

  return trends;
}

/**
 * Generate normalized claims from computed summaries and trends, now including location.
 */
function generateClaims(summaries, trends, location) {
  const claims = [];

  for (const [area, summary] of Object.entries(summaries)) {
    claims.push({
      metric: `latest_price_${area.toLowerCase().replace(/\s+/g, '_')}`,
      value: summary.latestPrice,
      unit: 'PKR/marla',
      confidence: parseFloat(summary.avgConfidence.toFixed(2)),
      context: `Latest average price per marla in ${area} (${summary.latestPeriod}) for ${location}`,
      location
    });

    claims.push({
      metric: `yoy_growth_${area.toLowerCase().replace(/\s+/g, '_')}`,
      value: summary.latestYoYChange,
      unit: 'percent',
      confidence: parseFloat(summary.avgConfidence.toFixed(2)),
      context: `Year-over-year price growth in ${area} as of ${summary.latestPeriod} for ${location}`,
      location
    });

    claims.push({
      metric: `rental_yield_${area.toLowerCase().replace(/\s+/g, '_')}`,
      value: summary.latestRentalYield,
      unit: 'percent',
      confidence: parseFloat(summary.avgConfidence.toFixed(2)),
      context: `Current rental yield in ${area} for ${location}`,
      location
    });

    const trend = trends[area];
    if (trend && trend.direction !== 'insufficient_data') {
      claims.push({
        metric: `trend_${area.toLowerCase().replace(/\s+/g, '_')}`,
        value: trend.direction,
        unit: 'trend',
        confidence: parseFloat(summary.avgConfidence.toFixed(2)),
        context: `Price trend in ${area}: ${trend.direction}, momentum ${trend.momentum} for ${location}`,
        location
      });
    }
  }

  return claims;
}

// ── Utility Functions ──

function average(arr) {
  if (!arr.length) return 0;
  return arr.reduce((sum, v) => sum + v, 0) / arr.length;
}

function standardDeviation(arr) {
  const avg = average(arr);
  const sqDiffs = arr.map(v => Math.pow(v - avg, 2));
  return Math.sqrt(average(sqDiffs));
}

module.exports = { parsePropertyPrices };
