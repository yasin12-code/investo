const { AntigravityAgent } = require('./src/agent/antigravityCore');

async function runTest() {
  const profile = { location: 'Lahore', budget: 50000000, riskTolerance: 'Moderate', targetReturn: 12 };
  const agent = new AntigravityAgent(profile);
  try {
    const results = await agent.execute();
    console.log('Agent run successful. TraceId:', results.traceId);
    if (!results.recommendations || !Array.isArray(results.recommendations)) {
      console.error('Test failed: recommendations missing or invalid');
      process.exit(2);
    }
    console.log('Recommendations count:', results.recommendations.length);
    console.log('Writing sample output to ./agent_test_output.json');
    const fs = require('fs');
    fs.writeFileSync('agent_test_output.json', JSON.stringify(results, null, 2), 'utf-8');
    console.log('Test passed.');
    process.exit(0);
  } catch (err) {
    console.error('Agent test error:', err);
    process.exit(1);
  }
}

runTest();
