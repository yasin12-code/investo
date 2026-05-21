const { handleFailure } = require('./recoveryEngine');
const { checkConstraints } = require('./constraintChecker');

async function simulateActionChain(agentContext) {
  const steps = [];
  const results = {};

  const profile = agentContext.profile;
  const topOption = agentContext.topRanked[0] || { name: 'Generic Asset', cost: 10000000, riskScore: 0.5, expectedReturn: 12 };

  // Step 1: Diagnose
  steps.push({
    step: 1,
    name: 'DIAGNOSE',
    status: 'success',
    duration: Math.floor(Math.random() * 200) + 100,
    before: 'Raw conflicting data',
    after: `Detected primary contradiction in property growth (18% vs 8%).`
  });

  // Step 2: Resolve
  steps.push({
    step: 2,
    name: 'RESOLVE',
    status: 'success',
    duration: Math.floor(Math.random() * 150) + 100,
    before: 'Unresolved contradictions',
    after: `Resolved contradiction in favor of PRA Report (Credibility: High) with a weighted average projection of 14.5%.`
  });

  // Step 3: Evaluate
  const constraintCheck = checkConstraints(topOption, profile);
  steps.push({
    step: 3,
    name: 'EVALUATE',
    status: 'success',
    duration: Math.floor(Math.random() * 100) + 50,
    before: 'Unvalidated options',
    after: `Evaluated ${topOption.name} against constraints. Feasible: ${constraintCheck.feasible}`
  });

  // Step 4: Simulate with injected Failure
  const step4 = {
    step: 4,
    name: 'SIMULATE',
    status: 'failed',
    duration: Math.floor(Math.random() * 500) + 300,
    before: 'Projection calculation starting',
    after: 'Timeout fetching live crypto correlation data',
    error: { type: 'timeout', message: 'API connection timeout' }
  };
  steps.push(step4);

  // Recovery for Step 4
  const recovery = handleFailure(4, step4.error, agentContext);
  steps.push({
    step: '4-RECOVERY',
    name: 'RECOVER_SIMULATION',
    status: 'success',
    duration: Math.floor(Math.random() * 200) + 100,
    before: 'Failed simulation state',
    after: `Applied recovery action: ${recovery.details}. Using cached correlation data. Projected 5-year return generated.`
  });

  // Step 5: Recommend
  steps.push({
    step: 5,
    name: 'RECOMMEND',
    status: 'success',
    duration: Math.floor(Math.random() * 100) + 50,
    before: 'Raw projection data',
    after: 'Final portfolio recommendations generated with explanation layer.'
  });

  return steps;
}

module.exports = { simulateActionChain };
