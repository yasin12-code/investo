function boolCheck(name, pass, evidence) {
  return { name, pass: !!pass, evidence };
}

function computeRubric({ result, trace }) {
  const checks = [
    {
      key: 'antigravityIntegration',
      title: 'Antigravity integration',
      weight: 20,
      items: [
        boolCheck('Workplan exists', !!trace?.workplan, { hasWorkplan: !!trace?.workplan }),
        boolCheck('Decision trace exists', (trace?.decisions?.length || 0) > 0, { decisions: trace?.decisions?.length || 0 }),
        boolCheck('Tool calls logged', (trace?.toolCalls?.length || 0) > 0, { toolCalls: trace?.toolCalls?.length || 0 })
      ]
    },
    {
      key: 'agenticReasoning',
      title: 'Agentic reasoning and workflow',
      weight: 20,
      items: [
        boolCheck('Sources processed >= 5', (result?.sources?.length || 0) >= 5, { sources: result?.sources?.length || 0 }),
        boolCheck('Insights extracted', (result?.insights?.length || 0) > 0, { insights: result?.insights?.length || 0 }),
        boolCheck('Action chain generated', (result?.actionChain?.length || 0) >= 3, { actionChain: result?.actionChain?.length || 0 })
      ]
    },
    {
      key: 'insightContradictions',
      title: 'Insight quality and contradiction handling',
      weight: 20,
      items: [
        boolCheck('Contradictions detected', (result?.contradictions?.length || 0) > 0, { contradictions: result?.contradictions?.length || 0 }),
        boolCheck('Contradictions resolved', (result?.contradictions || []).every(c => !!c.resolution), { resolved: (result?.contradictions || []).filter(c => !!c.resolution).length })
      ]
    },
    {
      key: 'actionOutcome',
      title: 'Action chain and outcome simulation',
      weight: 15,
      items: [
        boolCheck('3-5+ connected actions', (result?.actionChain?.length || 0) >= 3, { actionChain: result?.actionChain?.length || 0 }),
        boolCheck('State transitions logged', (result?.actionChain || []).some(s => s.before && s.after), { transitions: (result?.actionChain || []).filter(s => s.before && s.after).length })
      ]
    },
    {
      key: 'robustnessCostLatency',
      title: 'Robustness, scalability, cost and latency',
      weight: 15,
      items: [
        boolCheck('Latency metric exists', typeof result?.metrics?.analysisTimeMs === 'number', { analysisTimeMs: result?.metrics?.analysisTimeMs }),
        boolCheck('Failure recovery demonstrated', (result?.actionChain || []).some(s => String(s.status).toLowerCase().includes('fail')) || (trace?.failures?.length || 0) > 0, { failures: trace?.failures?.length || 0 }),
        boolCheck('Noise filtering tracked', typeof result?.metrics?.noiseFiltered !== 'undefined', { noiseFiltered: result?.metrics?.noiseFiltered })
      ]
    },
    {
      key: 'innovationUx',
      title: 'Innovation and UX',
      weight: 10,
      items: [
        boolCheck('Recommendations include explanation', (result?.recommendations || []).every(r => !!r.explanation), { recommendations: result?.recommendations?.length || 0 }),
        boolCheck('Evidence attached', (result?.recommendations || []).some(r => Array.isArray(r.evidence) && r.evidence.length > 0), { withEvidence: (result?.recommendations || []).filter(r => Array.isArray(r.evidence) && r.evidence.length > 0).length })
      ]
    }
  ];

  const criteria = checks.map(c => {
    const passed = c.items.every(i => i.pass);
    return {
      key: c.key,
      title: c.title,
      weight: c.weight,
      passed,
      awarded: passed ? c.weight : 0,
      checks: c.items
    };
  });

  const total = criteria.reduce((sum, c) => sum + c.awarded, 0);
  return {
    total,
    max: 100,
    criteria,
    auditedAt: new Date().toISOString(),
    strictPass: total >= 80
  };
}

module.exports = { computeRubric };
