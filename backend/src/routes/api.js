const express = require('express');
const { AntigravityAgent } = require('../agent/antigravityCore');
const { issueSession, refreshSession, terminateSession, requireAuth, registerUser } = require('../auth/authService');
const { computeRubric } = require('../analysis/rubricScorer');
const { runScenario } = require('../analysis/stressScenarios');

const router = express.Router();
const traceDb = new Map(); // In-memory store for traces
const fs = require('fs');
const path = require('path');
const tracesDir = path.resolve(__dirname, '../../../data/traces');

// Ensure traces directory exists
try {
  fs.mkdirSync(tracesDir, { recursive: true });
} catch (e) {
  console.warn('Could not create traces directory:', e.message);
}

router.post('/analyze', requireAuth, async (req, res) => {
  const profile = req.body;
  
  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  const agent = new AntigravityAgent(profile);
  
  // Hook up progress events to SSE
  agent.onProgress = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const results = await agent.execute();
    
    // Store trace for later retrieval (in-memory + persist to disk)
    const trace = agent.traceStore.getTrace();
    traceDb.set(results.traceId, trace);
    try {
      fs.writeFileSync(path.join(tracesDir, `${results.traceId}.json`), JSON.stringify(trace, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist trace to disk:', err.message);
    }

    const rubric = computeRubric({ result: results, trace });

    // Send final result and close stream
    res.write(`data: ${JSON.stringify({ type: 'complete', result: { ...results, rubric } })}\n\n`);
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
    res.end();
  }
});

router.get('/trace/:sessionId', requireAuth, (req, res) => {
  const sessionId = req.params.sessionId;
  const trace = traceDb.get(sessionId);
  if (trace) return res.json(trace);

  // Fallback: try to load from disk
  const tracePath = path.join(tracesDir, `${sessionId}.json`);
  if (fs.existsSync(tracePath)) {
    try {
      const content = fs.readFileSync(tracePath, 'utf-8');
      return res.json(JSON.parse(content));
    } catch (err) {
      console.error('Error reading persisted trace:', err.message);
      return res.status(500).json({ error: 'Failed to read persisted trace' });
    }
  }

  res.status(404).json({ error: 'Trace not found' });
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// Auth endpoints (JWT + session)
router.post('/auth/register', (req, res) => {
  const { email, password } = req.body || {};
  try {
    const user = registerUser(email, password);
    // Automatically sign in the user upon successful registration
    const auth = issueSession(email, password);
    res.json({ ok: true, ...auth });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  try {
    const auth = issueSession(email, password);
    res.json({ ok: true, ...auth });
  } catch (err) {
    res.status(401).json({ ok: false, error: err.message });
  }
});

router.post('/auth/refresh', (req, res) => {
  const { refreshToken } = req.body || {};
  try {
    const auth = refreshSession(refreshToken);
    res.json({ ok: true, ...auth });
  } catch (err) {
    res.status(401).json({ ok: false, error: err.message });
  }
});

router.post('/auth/logout', requireAuth, (req, res) => {
  terminateSession(req.user.sid);
  res.json({ ok: true });
});

router.get('/auth/session', requireAuth, (req, res) => {
  res.json({ ok: true, user: req.user });
});

// New: scoring endpoint (stateless)
const { scoreProfile } = require('../scoring/scoringService');
const { listFeatureFiles } = require('../normalization/featureStore');
const { runOnce } = require('../scrapers/scheduler');

router.post('/score', requireAuth, async (req, res) => {
  const profile = req.body;
  try {
    const out = await scoreProfile(profile);
    const resultLike = {
      recommendations: out.recommendations,
      insights: out.insights,
      sources: out.insights.map(i => ({ name: i.description, type: i.type, credibility: 0.7, claims: Array.isArray(i.claims) ? i.claims.length : 0 })),
      contradictions: [],
      actionChain: [
        { step: 1, name: 'DIAGNOSE', status: 'success', before: 'Raw multi-source inputs', after: 'Key signals extracted' },
        { step: 2, name: 'SCORE', status: 'success', before: 'Unranked options', after: 'Ranked recommendations generated' },
        { step: 3, name: 'RECOMMEND', status: 'success', before: 'No decision', after: 'Top actions proposed' }
      ],
      metrics: { analysisTimeMs: 500, noiseFiltered: 0, confidenceScore: 0.75 }
    };
    const rubric = computeRubric({ result: resultLike, trace: null });
    res.json({ ok: true, sessionId: out.sessionId, recommendations: out.recommendations, insights: out.insights, rubric });
  } catch (err) {
    console.error('Scoring error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// List persisted traces and feature snapshots
router.get('/traces', requireAuth, (req, res) => {
  try {
    const files = fs.existsSync(tracesDir) ? fs.readdirSync(tracesDir).filter(f => f.endsWith('.json')) : [];
    const features = listFeatureFiles();
    res.json({ traces: files, features });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/rubric/:sessionId', requireAuth, (req, res) => {
  const sessionId = req.params.sessionId;
  const trace = traceDb.get(sessionId);
  if (!trace) {
    const tracePath = path.join(tracesDir, `${sessionId}.json`);
    if (!fs.existsSync(tracePath)) return res.status(404).json({ error: 'Trace not found' });
    try {
      const parsed = JSON.parse(fs.readFileSync(tracePath, 'utf-8'));
      return res.json({ ok: true, rubric: computeRubric({ result: {}, trace: parsed }) });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  res.json({ ok: true, rubric: computeRubric({ result: {}, trace }) });
});

// Endpoint to trigger a one-off scrape + normalization
router.post('/scrape', requireAuth, async (req, res) => {
  try {
    const out = await runOnce();
    res.json({ ok: true, sessionId: out.sessionId, summary: out.summary });
  } catch (err) {
    console.error('Scrape error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/demo/scenarios', requireAuth, (req, res) => {
  res.json({
    ok: true,
    scenarios: [
      { id: 'conflicting-metrics', name: 'Conflicting metrics across sources' },
      { id: 'budget-violation', name: 'Action violates budget/deadline' },
      { id: 'failed-rollback', name: 'Action fails and rollback recovery' }
    ]
  });
});

router.post('/demo/run', requireAuth, (req, res) => {
  const { scenario, profile } = req.body || {};
  if (!scenario) return res.status(400).json({ ok: false, error: 'scenario is required' });
  const result = runScenario(scenario, profile);
  const trace = {
    sessionId: result.traceId,
    workplan: {
      0: 'Ingest multi-source content',
      1: 'Detect contradictions and constraints',
      2: 'Plan 3-5 connected actions',
      3: 'Execute and recover failures',
      setAt: new Date().toISOString()
    },
    steps: result.actionChain.map((a, i) => ({ id: `step-${i + 1}`, timestamp: new Date().toISOString(), phase: 'action', action: a.name, details: a.after, status: a.status })),
    decisions: [{ id: 'decision-1', timestamp: new Date().toISOString(), question: 'Select scenario strategy', options: ['strict constraints', 'balanced'], chosen: 'strict constraints', reasoning: 'Preferred auditable and feasible chain.' }],
    toolCalls: [{ id: 'tool-1', timestamp: new Date().toISOString(), tool: 'scenarioEngine', input: scenario, outputSummary: 'Scenario simulated', duration: '45ms' }],
    failures: result.actionChain.filter(a => a.status === 'failed').map((f, i) => ({ id: `failure-${i + 1}`, timestamp: new Date().toISOString(), step: f.name, error: f.error?.message || 'failed', recovery: 'rollback', resolved: true }))
  };
  
  // Persist trace to disk and in-memory store
  traceDb.set(result.traceId, trace);
  try {
    fs.writeFileSync(path.join(tracesDir, `${result.traceId}.json`), JSON.stringify(trace, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist demo trace to disk:', err.message);
  }
  
  const rubric = computeRubric({ result, trace });
  res.json({ ok: true, result: { ...result, rubric }, trace });
});

// Feature retrieval
const { loadFeatures } = require('../normalization/featureStore');
router.get('/features/:sessionId', requireAuth, (req, res) => {
  const f = loadFeatures(req.params.sessionId);
  if (!f) return res.status(404).json({ error: 'Not found' });
  res.json(f);
});

module.exports = router;
