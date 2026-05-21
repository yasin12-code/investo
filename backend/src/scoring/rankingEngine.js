function rankInvestments(insights, profile, zameenData = null, graanaData = null) {
  const { location, budget, targetReturn, riskTolerance } = profile;
  const normalizedLocation = (location || '').toLowerCase().trim();

  // ─── Static baseline (non-property alternatives + base properties) ─────────
  const basePropertyDatabase = [
    // Karachi
    { id: 'khi-01', location: 'Karachi', name: 'Bahria Town Karachi (Precinct 10)', type: 'Property', price: 15000000, expectedReturn: 14.5, riskScore: 0.6, liquidity: 0.4, source: 'Baseline' },
    { id: 'khi-02', location: 'Karachi', name: 'DHA Phase 8 Commercial', type: 'Property', price: 45000000, expectedReturn: 18.0, riskScore: 0.4, liquidity: 0.3, source: 'Baseline' },
    { id: 'khi-03', location: 'Karachi', name: 'Scheme 33 Apartment', type: 'Property', price: 8000000, expectedReturn: 12.0, riskScore: 0.5, liquidity: 0.6, source: 'Baseline' },
    { id: 'khi-reit', location: 'Karachi', name: 'Dolmen City REIT', type: 'REIT', price: 500000, expectedReturn: 11.5, riskScore: 0.3, liquidity: 0.9, source: 'Baseline' },
    // Lahore
    { id: 'lhr-01', location: 'Lahore', name: 'DHA Phase 6 Residential', type: 'Property', price: 35000000, expectedReturn: 16.0, riskScore: 0.3, liquidity: 0.4, source: 'Baseline' },
    { id: 'lhr-02', location: 'Lahore', name: 'Bahria Orchard Phase 4', type: 'Property', price: 12000000, expectedReturn: 15.5, riskScore: 0.5, liquidity: 0.5, source: 'Baseline' },
    { id: 'lhr-03', location: 'Lahore', name: 'Gulberg Commercial Plaza Share', type: 'Property', price: 25000000, expectedReturn: 17.5, riskScore: 0.4, liquidity: 0.3, source: 'Baseline' },
    // Islamabad
    { id: 'isb-01', location: 'Islamabad', name: 'Gulberg Greens Farmhouse', type: 'Property', price: 85000000, expectedReturn: 14.0, riskScore: 0.2, liquidity: 0.2, source: 'Baseline' },
    { id: 'isb-02', location: 'Islamabad', name: 'DHA Valley Block A', type: 'Property', price: 6500000, expectedReturn: 13.5, riskScore: 0.7, liquidity: 0.6, source: 'Baseline' },
    { id: 'isb-03', location: 'Islamabad', name: 'F-11 Apartment', type: 'Property', price: 18000000, expectedReturn: 10.5, riskScore: 0.2, liquidity: 0.7, source: 'Baseline' },
    // National / Alternative
    { id: 'nat-01', location: 'National', name: 'Pakistan Investment Bonds (10Y)', type: 'Bond', price: 100000, expectedReturn: 15.0, riskScore: 0.1, liquidity: 0.8, source: 'Baseline' },
    { id: 'nat-02', location: 'National', name: 'Meezan Islamic Fund', type: 'Fund', price: 50000, expectedReturn: 19.5, riskScore: 0.7, liquidity: 0.9, source: 'Baseline' },
    { id: 'nat-03', location: 'National', name: 'Ethereum / Bitcoin Staking', type: 'Crypto', price: 20000, expectedReturn: 8.0, riskScore: 0.8, liquidity: 0.95, source: 'Baseline' }
  ];

  // ─── Collect live scraped listings from Zameen & Graana separately ─────────
  const zameenListings = [];
  if (zameenData && Array.isArray(zameenData.properties)) {
    zameenData.properties.forEach((p, idx) => {
      zameenListings.push({
        id: `zameen-${idx}`,
        location: p.location,
        name: p.name,
        type: 'Property',
        price: p.price,
        expectedReturn: p.expectedReturn,
        riskScore: p.riskScore,
        liquidity: p.liquidity,
        area: p.area,
        source: p.source || 'Zameen.com (Live)',
        subLocation: p.subLocation,
        _scrapeSource: 'zameen',
      });
    });
  }

  const graanaListings = [];
  if (graanaData && Array.isArray(graanaData.properties)) {
    graanaData.properties.forEach((p, idx) => {
      graanaListings.push({
        id: `graana-${idx}`,
        location: p.location,
        name: p.name,
        type: 'Property',
        price: p.price,
        expectedReturn: p.expectedReturn,
        riskScore: p.riskScore,
        liquidity: p.liquidity,
        area: p.area,
        source: p.source || 'Graana.com (Live)',
        subLocation: p.subLocation,
        _scrapeSource: 'graana',
      });
    });
  }

  // ─── Interleave Zameen + Graana so both sources appear in results ──────────
  const interleavedLive = [];
  const maxLen = Math.max(zameenListings.length, graanaListings.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < zameenListings.length) interleavedLive.push(zameenListings[i]);
    if (i < graanaListings.length) interleavedLive.push(graanaListings[i]);
  }

  // Full DB: live scraped first (priority), then static baseline
  const propertyDatabase = [...interleavedLive, ...basePropertyDatabase];

  // ─── User constraints ──────────────────────────────────────────────────────
  const userBudget = parseFloat(budget) || 50000000;
  const userTargetReturn = parseFloat(targetReturn) || 15;

  let maxAllowedRisk = 0.5;
  if ((riskTolerance || '').toLowerCase() === 'conservative') maxAllowedRisk = 0.3;
  if ((riskTolerance || '').toLowerCase() === 'moderate') maxAllowedRisk = 0.6;
  if ((riskTolerance || '').toLowerCase() === 'aggressive') maxAllowedRisk = 0.9;

  // ─── Live news sentiment adjustment ───────────────────────────────────────
  let liveAdjustment = 0;
  const locationNews = (insights || []).filter(i => i.type === 'live_news');
  if (locationNews.length > 0) {
    const headline = locationNews[0].description.toLowerCase();
    if (headline.includes('boom') || headline.includes('soar') || headline.includes('record')) liveAdjustment = 1.5;
    if (headline.includes('slump') || headline.includes('drop') || headline.includes('tax')) liveAdjustment = -1.5;
  }

  // ─── Score all candidates ─────────────────────────────────────────────────
  const scoredCandidates = propertyDatabase.map(p => {
    const dynamicReturn = p.expectedReturn + (p.type === 'Property' ? liveAdjustment : 0);
    const isWithinBudget = p.price <= userBudget;
    const meetsReturn = dynamicReturn >= userTargetReturn;
    const hasAcceptableRisk = p.riskScore <= maxAllowedRisk;

    let matchScore = 0.5;
    if (isWithinBudget) matchScore += 0.2;
    if (meetsReturn) matchScore += 0.15;
    if (hasAcceptableRisk) matchScore += 0.15;
    matchScore += (maxAllowedRisk - p.riskScore) * 0.1;
    // Boost live-scraped listings so they surface above static baseline
    if (p._scrapeSource === 'zameen' || p._scrapeSource === 'graana') matchScore += 0.08;
    matchScore = Math.max(0.1, Math.min(0.99, matchScore));

    return { ...p, expectedReturn: dynamicReturn, matchScore, isWithinBudget, meetsReturn, hasAcceptableRisk };
  });

  // ─── Separate: local properties vs financial alternatives ─────────────────
  // Case-insensitive location match so all scraped data matches correctly
  const localProperties = scoredCandidates.filter(
    c => c.type === 'Property' && (c.location || '').toLowerCase().trim() === normalizedLocation
  );
  const alternatives = scoredCandidates.filter(c => c.type !== 'Property');

  // ─── Separate Zameen, Graana, other local properties and alternatives ─────
  const zameenCandidates = localProperties.filter(
    p => p._scrapeSource === 'zameen' || (p.source && p.source.toLowerCase().includes('zameen'))
  );
  const graanaCandidates = localProperties.filter(
    p => p._scrapeSource === 'graana' || (p.source && p.source.toLowerCase().includes('graana'))
  );
  const otherLocalCandidates = localProperties.filter(
    p => !zameenCandidates.includes(p) && !graanaCandidates.includes(p)
  );

  // Sort groups by match score descending
  zameenCandidates.sort((a, b) => b.matchScore - a.matchScore);
  graanaCandidates.sort((a, b) => b.matchScore - a.matchScore);
  otherLocalCandidates.sort((a, b) => b.matchScore - a.matchScore);
  alternatives.sort((a, b) => b.matchScore - a.matchScore);

  // Divide into suitable (meets all constraints) vs unsuitable
  const suitableZameen = zameenCandidates.filter(p => p.isWithinBudget && p.meetsReturn && p.hasAcceptableRisk);
  const unsuitableZameen = zameenCandidates.filter(p => !(p.isWithinBudget && p.meetsReturn && p.hasAcceptableRisk));

  const suitableGraana = graanaCandidates.filter(p => p.isWithinBudget && p.meetsReturn && p.hasAcceptableRisk);
  const unsuitableGraana = graanaCandidates.filter(p => !(p.isWithinBudget && p.meetsReturn && p.hasAcceptableRisk));

  // Guarantee at least 10 properties from Zameen and 10 from Graana
  let selectedZameen = [...suitableZameen];
  if (selectedZameen.length < 10) {
    selectedZameen = [...selectedZameen, ...unsuitableZameen.slice(0, 10 - selectedZameen.length)];
  }

  let selectedGraana = [...suitableGraana];
  if (selectedGraana.length < 10) {
    selectedGraana = [...selectedGraana, ...unsuitableGraana.slice(0, 10 - selectedGraana.length)];
  }

  // Interleave Zameen and Graana properties to ensure a balanced, high-density listing of both sources
  const interleaved = [];
  const maxCombinedLen = Math.max(selectedZameen.length, selectedGraana.length);
  for (let i = 0; i < maxCombinedLen; i++) {
    if (i < selectedZameen.length) interleaved.push(selectedZameen[i]);
    if (i < selectedGraana.length) interleaved.push(selectedGraana[i]);
  }

  const otherSuitableLocal = otherLocalCandidates.filter(p => p.isWithinBudget && p.meetsReturn && p.hasAcceptableRisk);
  const rankedAlternatives = alternatives.filter(a => a.isWithinBudget);

  const selectedRecommendations = [
    ...interleaved,
    ...otherSuitableLocal,
    ...rankedAlternatives
  ];

  // ─── Format and return top 30 results ────────────────────────────────────
  return selectedRecommendations.slice(0, 30).map((p) => {
    let ruleExplanation = '';
    if (p.type === 'Property') {
      if (p.meetsReturn && p.hasAcceptableRisk && (p.location || '').toLowerCase() === normalizedLocation) {
        ruleExplanation = `[Decision Rule] Local property meets your target return of ${userTargetReturn}% and aligns with your ${riskTolerance} profile.`;
      } else {
        ruleExplanation = `[Fallback] Recommended as secondary option. Failed local target return or exceeded risk limit.`;
      }
    } else {
      ruleExplanation = `[Fallback Rule] Triggered because local properties did not meet target return or risk constraints. Alternative asset recommended.`;
    }

    const sourceLabel = p.source ? ` | Source: ${p.source}` : '';
    return {
      ...p,
      explanation: `${ruleExplanation} Priced at PKR ${(p.price / 1000000).toFixed(1)}M.${sourceLabel}`,
      evidence: [
        `Expected Return: ${p.expectedReturn.toFixed(1)}% (Target: ${userTargetReturn}%)`,
        p.type === 'Property' && liveAdjustment !== 0
          ? `Live News Impact: ${liveAdjustment > 0 ? '+' : ''}${liveAdjustment}% expected return adjustment`
          : 'Market sentiment accounted for',
        `Asset Risk: ${p.riskScore} (Your Max Allowed: ${maxAllowedRisk})`,
        p.area ? `Area: ${p.area}` : null,
        p.subLocation ? `Location: ${p.subLocation}` : null,
      ].filter(Boolean)
    };
  });
}

module.exports = { rankInvestments };
