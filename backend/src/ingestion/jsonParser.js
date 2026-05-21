// ═══════════════════════════════════════════════════════════════
// JSON Parser - Extracts REIT, mutual fund, bond, and crypto data
// from the reit_dashboard.json investment dashboard
// ═══════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

/**
 * Parse the REIT dashboard JSON and normalize all investment data
 * @param {string} [filePath] - Optional custom path to JSON file
 * @returns {object} Parsed and normalized investment data
 */
function parseReitDashboard(filePath) {
  const defaultPath = path.resolve(__dirname, '../../../data/sources/reit_dashboard.json');
  const jsonPath = filePath || defaultPath;
  const rawJSON = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  const meta = rawJSON.dashboard_meta;
  const reits = normalizeReits(rawJSON.reit_funds || []);
  const mutualFunds = normalizeMutualFunds(rawJSON.mutual_funds || []);
  const bonds = normalizeBonds(rawJSON.government_bonds || []);
  const crypto = normalizeCrypto(rawJSON.crypto || []);
  const sentiment = rawJSON.market_sentiment || {};

  const allInvestments = [...reits, ...mutualFunds, ...bonds, ...crypto];
  const claims = generateClaims(allInvestments, sentiment);

  return {
    sourceId: 'reit-dashboard-q1-2026',
    sourceType: 'json',
    sourceName: meta.title || 'Pakistan Investment Dashboard',
    metadata: {
      generatedAt: meta.generated_at,
      source: meta.source,
      credibilityScore: meta.credibility,
      dataFreshness: meta.data_freshness
    },
    investments: allInvestments,
    investmentsByType: {
      reits,
      mutualFunds,
      bonds,
      crypto
    },
    sentiment,
    claims,
    rawData: rawJSON
  };
}

/**
 * Normalize REIT data into comparable format
 */
function normalizeReits(reitFunds) {
  return reitFunds.map(reit => ({
    id: `reit-${reit.ticker.toLowerCase()}`,
    name: reit.name,
    ticker: reit.ticker,
    category: 'REIT',
    subType: reit.property_type,
    location: reit.location,
    metrics: {
      currentPrice: { value: reit.current_price_pkr, unit: 'PKR' },
      navPerUnit: { value: reit.nav_per_unit, unit: 'PKR' },
      dividendYield: { value: reit.dividend_yield_pct, unit: 'percent' },
      return1Y: { value: reit.annualized_return_1y_pct, unit: 'percent' },
      return3Y: { value: reit.annualized_return_3y_pct, unit: 'percent' },
      return5Y: { value: reit.annualized_return_5y_pct, unit: 'percent' },
      occupancyRate: { value: reit.occupancy_rate_pct, unit: 'percent' }
    },
    scores: {
      risk: reit.risk_score,
      liquidity: reit.liquidity_score
    },
    marketCapBillionPKR: reit.market_cap_billion_pkr,
    minInvestmentPKR: reit.current_price_pkr * 500, // Minimum lot size estimate
    lastUpdated: reit.last_updated,
    // Discount to NAV is a signal of undervaluation
    discountToNAV: ((reit.nav_per_unit - reit.current_price_pkr) / reit.nav_per_unit * 100).toFixed(1)
  }));
}

/**
 * Normalize mutual fund data
 */
function normalizeMutualFunds(funds) {
  return funds.map(fund => ({
    id: `mf-${fund.name.toLowerCase().replace(/\s+/g, '-')}`,
    name: fund.name,
    amc: fund.amc,
    category: 'Mutual Fund',
    subType: fund.type,
    location: 'Pakistan',
    metrics: {
      nav: { value: fund.nav_pkr, unit: 'PKR' },
      return1Y: { value: fund.annualized_return_1y_pct, unit: 'percent' },
      return3Y: { value: fund.annualized_return_3y_pct, unit: 'percent' },
      return5Y: { value: fund.annualized_return_5y_pct, unit: 'percent' },
      expenseRatio: { value: fund.expense_ratio_pct, unit: 'percent' },
      sharpeRatio: { value: fund.sharpe_ratio, unit: 'ratio' }
    },
    scores: {
      risk: fund.risk_score,
      liquidity: fund.liquidity_score
    },
    fundSizeBillionPKR: fund.fund_size_billion_pkr,
    minInvestmentPKR: fund.min_investment_pkr,
    lastUpdated: fund.last_updated
  }));
}

/**
 * Normalize government bond data
 */
function normalizeBonds(bonds) {
  return bonds.map(bond => ({
    id: `bond-pib-${bond.tenor_years}y`,
    name: bond.name,
    category: 'Government Bond',
    subType: `${bond.tenor_years}-Year Bond`,
    location: 'Pakistan',
    metrics: {
      couponRate: { value: bond.coupon_rate_pct, unit: 'percent' },
      currentYield: { value: bond.current_yield_pct, unit: 'percent' },
      return1Y: { value: bond.current_yield_pct, unit: 'percent' },
      return3Y: { value: bond.current_yield_pct, unit: 'percent' },
      return5Y: { value: bond.current_yield_pct, unit: 'percent' }
    },
    scores: {
      risk: bond.risk_score,
      liquidity: bond.liquidity_score
    },
    creditRating: bond.credit_rating,
    tenorYears: bond.tenor_years,
    minInvestmentPKR: bond.min_investment_pkr,
    lastUpdated: bond.last_updated
  }));
}

/**
 * Normalize cryptocurrency data
 */
function normalizeCrypto(cryptos) {
  return cryptos.map(coin => ({
    id: `crypto-${coin.ticker.toLowerCase()}`,
    name: coin.name,
    ticker: coin.ticker,
    category: 'Cryptocurrency',
    subType: 'Digital Asset',
    location: 'Global',
    metrics: {
      priceUSD: { value: coin.price_usd, unit: 'USD' },
      pricePKR: { value: coin.price_pkr, unit: 'PKR' },
      return1Y: { value: coin.annualized_return_1y_pct, unit: 'percent' },
      return3Y: { value: coin.annualized_return_3y_pct, unit: 'percent' },
      return5Y: { value: coin.annualized_return_5y_pct, unit: 'percent' },
      volatility30D: { value: coin.volatility_30d_pct, unit: 'percent' }
    },
    scores: {
      risk: coin.risk_score,
      liquidity: coin.liquidity_score
    },
    regulatoryRisk: coin.regulatory_risk,
    legalStatus: coin.legal_status_pakistan,
    minInvestmentPKR: 1000, // Fractional buying available
    lastUpdated: coin.last_updated
  }));
}

/**
 * Generate normalized claims from all investment data
 */
function generateClaims(investments, sentiment) {
  const claims = [];

  for (const inv of investments) {
    if (inv.metrics.return1Y) {
      claims.push({
        metric: `${inv.category.toLowerCase().replace(/\s+/g, '_')}_return_1y_${inv.id}`,
        value: inv.metrics.return1Y.value,
        unit: 'percent',
        confidence: 0.88,
        context: `${inv.name}: 1-year annualized return`
      });
    }

    if (inv.scores.risk !== undefined) {
      claims.push({
        metric: `risk_score_${inv.id}`,
        value: inv.scores.risk,
        unit: 'score_0_to_1',
        confidence: 0.85,
        context: `${inv.name}: Risk score (0 = low risk, 1 = high risk)`
      });
    }
  }

  // Market sentiment claims
  if (sentiment.overall) {
    claims.push({
      metric: 'market_sentiment_overall',
      value: sentiment.overall,
      unit: 'sentiment',
      confidence: 0.80,
      context: 'Overall market sentiment from PSX analytics'
    });
  }

  if (sentiment.key_factors) {
    claims.push({
      metric: 'market_key_factors',
      value: sentiment.key_factors,
      unit: 'factors',
      confidence: 0.80,
      context: 'Key market factors influencing investment outlook'
    });
  }

  return claims;
}

module.exports = { parseReitDashboard };
