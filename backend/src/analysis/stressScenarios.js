const { rankInvestments } = require('../scoring/rankingEngine');

function baseResult(profile) {
  const recommendations = rankInvestments([], profile);
  return {
    profile,
    traceId: `demo-${Date.now()}`,
    sources: [
      { name: 'PDF Report', type: 'report', credibility: 0.9, claims: 8 },
      { name: 'CSV Historical', type: 'csv', credibility: 0.8, claims: 20 },
      { name: 'JSON Dashboard', type: 'json', credibility: 0.85, claims: 12 },
      { name: 'Web Article', type: 'html', credibility: 0.55, claims: 6 },
      { name: 'Realtime Feed', type: 'feed', credibility: 0.7, claims: 10 }
    ],
    contradictions: [],
    insights: [{ type: 'trend', title: 'Demand Shift', description: 'Signal drift detected', confidence: 0.78 }],
    recommendations,
    actionChain: [],
    metrics: { sourcesProcessed: 5, contradictionsFound: 0, actionsSimulated: 0, analysisTimeMs: 1100, confidenceScore: 0.82, noiseFiltered: 3 }
  };
}

function runScenario(scenario, profile) {
  const result = baseResult(profile || { location: 'Lahore', budget: 5000000, targetReturn: 10, riskTolerance: 'Moderate' });

  if (scenario === 'conflicting-metrics') {
    result.contradictions = [
      {
        metric: 'revenue_growth',
        sourceA: 'Dashboard A',
        valA: '14%',
        sourceB: 'Report B',
        valB: '-3%',
        resolution: 'Use weighted recency + credibility and trigger investigation task.'
      }
    ];
    result.actionChain = [
      { step: 1, name: 'DIAGNOSE', status: 'success', before: 'Conflicting metric values', after: 'Root-cause candidates identified' },
      { step: 2, name: 'VERIFY_SOURCES', status: 'success', before: 'Unverified provenance', after: 'Low-cred source down-ranked' },
      { step: 3, name: 'ESCALATE_ANALYST', status: 'success', before: 'Pending human review', after: 'Investigation ticket opened' }
    ];
    result.metrics.contradictionsFound = 1;
    result.metrics.actionsSimulated = 3;
  }

  if (scenario === 'budget-violation') {
    result.actionChain = [
      { step: 1, name: 'PLAN', status: 'success', before: 'Target action list', after: 'Action cost estimated' },
      { step: 2, name: 'CONSTRAINT_CHECK', status: 'success', before: 'Cost > budget', after: 'Infeasible actions rejected' },
      { step: 3, name: 'REPLAN', status: 'success', before: 'Original plan blocked', after: 'Feasible lower-cost chain selected' }
    ];
    result.metrics.actionsSimulated = 3;
  }

  if (scenario === 'failed-rollback') {
    result.actionChain = [
      { step: 1, name: 'NOTIFY_STAKEHOLDER', status: 'success', before: 'No alert sent', after: 'Alert delivered' },
      { step: 2, name: 'UPDATE_SYSTEM', status: 'failed', before: 'Old config active', after: 'Patch failed', error: { type: 'api_failure', message: 'Downstream API 503' } },
      { step: '2-RECOVERY', name: 'ROLLBACK', status: 'success', before: 'Partial update', after: 'State restored and retry queued' },
      { step: 3, name: 'FOLLOW_UP_MONITORING', status: 'success', before: 'No guardrail', after: '30-min watch scheduled' }
    ];
    result.metrics.actionsSimulated = 4;
  }

  return result;
}

module.exports = { runScenario };
