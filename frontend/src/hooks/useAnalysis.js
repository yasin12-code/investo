import { useState, useCallback, useRef } from 'react';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const apiUrl = (path) => (apiBaseUrl ? `${apiBaseUrl}${path}` : path);

const PIPELINE_STEPS = [
  { id: 1, name: 'Ingesting property report', icon: '📄' },
  { id: 2, name: 'Processing historical price data', icon: '📊' },
  { id: 3, name: 'Loading investment dashboard', icon: '📈' },
  { id: 4, name: 'Analyzing market article', icon: '📰' },
  { id: 5, name: 'Processing real-time feed', icon: '📡' },
  { id: 6, name: 'Normalizing data sources', icon: '🔄' },
  { id: 7, name: 'Detecting contradictions', icon: '⚡' },
  { id: 8, name: 'Extracting insights', icon: '💡' },
  { id: 9, name: 'Simulating action chain', icon: '🔗' },
  { id: 10, name: 'Generating recommendations', icon: '🎯' },
];

// Mock results for demo mode
function generateMockResults(profile) {
  return {
    sources: [
      {
        id: 's1',
        name: 'Zameen.com Property Index',
        type: 'table',
        credibility: 0.92,
        freshness: '2026-05-18T14:30:00Z',
        claims: 23,
        noisy: false,
      },
      {
        id: 's2',
        name: 'SBP Economic Bulletin Q1 2026',
        type: 'file',
        credibility: 0.95,
        freshness: '2026-04-15T09:00:00Z',
        claims: 18,
        noisy: false,
      },
      {
        id: 's3',
        name: 'Dawn Business Report',
        type: 'globe',
        credibility: 0.78,
        freshness: '2026-05-19T22:15:00Z',
        claims: 12,
        noisy: false,
      },
      {
        id: 's4',
        name: 'PSX Live Trading Feed',
        type: 'rss',
        credibility: 0.88,
        freshness: '2026-05-20T01:45:00Z',
        claims: 31,
        noisy: true,
      },
      {
        id: 's5',
        name: 'SECP Annual Review 2025',
        type: 'chart',
        credibility: 0.91,
        freshness: '2026-03-01T00:00:00Z',
        claims: 15,
        noisy: false,
      },
    ],
    contradictions: [
      {
        id: 'c1',
        metric: 'Property Growth Rate YoY',
        sourceA: { name: 'Zameen.com Property Index', value: '12.4%', credibility: 0.92 },
        sourceB: { name: 'Dawn Business Report', value: '8.1%', credibility: 0.78 },
        resolution: 'Weighted average by credibility: 11.1%',
        confidence: 0.85,
        method: 'credibility-weighted',
      },
      {
        id: 'c2',
        metric: 'PKR Inflation Forecast',
        sourceA: { name: 'SBP Economic Bulletin Q1 2026', value: '8.5%', credibility: 0.95 },
        sourceB: { name: 'PSX Live Trading Feed', value: '11.2%', credibility: 0.88 },
        resolution: 'SBP official data preferred: 8.5%',
        confidence: 0.92,
        method: 'authority-priority',
      },
      {
        id: 'c3',
        metric: 'REIT Dividend Yield',
        sourceA: { name: 'SECP Annual Review 2025', value: '7.8%', credibility: 0.91 },
        sourceB: { name: 'PSX Live Trading Feed', value: '6.2%', credibility: 0.88 },
        resolution: 'Most recent verified data: 7.0%',
        confidence: 0.78,
        method: 'recency-adjusted',
      },
    ],
    actionChain: [
      {
        id: 'a1',
        step: 1,
        name: 'Validate Market Data',
        description: 'Cross-reference property indices with official SBP data',
        status: 'success',
        duration: 1240,
        before: { validated: false, sources: 5, conflicts: 'unknown' },
        after: { validated: true, sources: 5, conflicts: 3 },
      },
      {
        id: 'a2',
        step: 2,
        name: 'Risk Assessment Model',
        description: 'Run Monte Carlo simulation for portfolio risk scoring',
        status: 'success',
        duration: 2350,
        before: { riskScore: null, simulations: 0 },
        after: { riskScore: 0.45, simulations: 10000 },
      },
      {
        id: 'a3',
        step: 3,
        name: 'Fetch Live REIT Prices',
        description: 'Pull latest REIT NAV and dividend data from PSX',
        status: 'recovered',
        duration: 4120,
        before: { reitData: null, retries: 0 },
        after: { reitData: 'loaded', retries: 2 },
        error: 'Connection timeout on first attempt',
        recovery: 'Retried with exponential backoff, succeeded on attempt 3',
      },
      {
        id: 'a4',
        step: 4,
        name: 'Portfolio Optimization',
        description: 'Apply Modern Portfolio Theory to maximize Sharpe ratio',
        status: 'success',
        duration: 1890,
        before: { allocations: null, sharpeRatio: null },
        after: { allocations: 5, sharpeRatio: 1.34 },
      },
      {
        id: 'a5',
        step: 5,
        name: 'Generate Recommendations',
        description: 'Compile final ranked investment recommendations',
        status: 'success',
        duration: 980,
        before: { recommendations: 0, confidence: null },
        after: { recommendations: 5, confidence: 0.82 },
      },
    ],
    recommendations: [
      {
        rank: 1,
        name: `${profile.location} DHA Phase 6 Plot`,
        type: 'Property',
        expectedReturn: 18.5,
        risk: 0.35,
        liquidity: 2,
        matchScore: 94,
        explanation: `Prime residential plot in ${profile.location}'s most sought-after area. Historical appreciation of 15-20% annually with strong rental demand. Low volatility compared to equities.`,
        evidence: [
          'Zameen.com shows 16.2% YoY growth in DHA Phase 6',
          'SBP reports steady urban housing demand',
          'Low correlation with stock market volatility',
        ],
        confidence: 0.89,
      },
      {
        rank: 2,
        name: 'Dolmen City REIT',
        type: 'REIT',
        expectedReturn: 14.2,
        risk: 0.42,
        liquidity: 4,
        matchScore: 88,
        explanation: 'Pakistan\'s premier REIT offering stable dividend yields with exposure to premium commercial real estate. High liquidity through PSX trading.',
        evidence: [
          'SECP approved, regulated investment vehicle',
          'Consistent 7-8% dividend yield',
          'Portfolio includes Dolmen Mall Clifton',
        ],
        confidence: 0.85,
      },
      {
        rank: 3,
        name: 'NIT Government Bond Fund',
        type: 'Bond',
        expectedReturn: 11.8,
        risk: 0.18,
        liquidity: 3,
        matchScore: 82,
        explanation: 'Government-backed fixed income fund with near-zero default risk. Ideal for the conservative portion of a diversified portfolio.',
        evidence: [
          'Government securities backing',
          'SBP policy rate trending downward',
          'Tax-advantaged for individual investors',
        ],
        confidence: 0.93,
      },
      {
        rank: 4,
        name: 'Meezan Pakistan ETF',
        type: 'Fund',
        expectedReturn: 16.7,
        risk: 0.58,
        liquidity: 5,
        matchScore: 76,
        explanation: 'Shariah-compliant exchange-traded fund tracking top PSX companies. Higher risk-reward profile suitable for growth-oriented allocation.',
        evidence: [
          'PSX KMI-30 index up 34% in 2025',
          'Shariah-compliant screening',
          'Low expense ratio of 0.5%',
        ],
        confidence: 0.79,
      },
      {
        rank: 5,
        name: 'Digital Gold (Tola)',
        type: 'Crypto',
        expectedReturn: 12.3,
        risk: 0.52,
        liquidity: 4,
        matchScore: 71,
        explanation: 'Tokenized gold investment providing inflation hedge and portfolio diversification. Backed by physical gold reserves with digital trading convenience.',
        evidence: [
          'Gold up 22% globally in 2025',
          'SBP exploring digital asset framework',
          'Hedge against PKR depreciation',
        ],
        confidence: 0.74,
      },
    ],
    trace: [
      { timestamp: '2026-05-20T02:30:00Z', type: 'info', section: 'workplan', action: 'Initialize Analysis Pipeline', status: 'success', details: `Profile: ${profile.location}, Budget: PKR ${profile.budget.toLocaleString()}, Risk: ${profile.riskTolerance}` },
      { timestamp: '2026-05-20T02:30:01Z', type: 'info', section: 'taskDecomposition', action: 'Decompose into 5 parallel data ingestion tasks', status: 'success', details: 'Tasks: PropertyReport, HistoricalData, Dashboard, MarketArticle, LiveFeed' },
      { timestamp: '2026-05-20T02:30:02Z', type: 'info', section: 'sourceEvaluation', action: 'Evaluate source credibility', status: 'success', details: 'All 5 sources scored above minimum threshold (0.3)' },
      { timestamp: '2026-05-20T02:30:03Z', type: 'decision', section: 'sourceEvaluation', action: 'Weight sources by credibility × freshness', status: 'success', details: 'SBP Bulletin: 0.95, Zameen: 0.92, SECP: 0.91, PSX: 0.88, Dawn: 0.78' },
      { timestamp: '2026-05-20T02:30:04Z', type: 'info', section: 'toolCalls', action: 'Call contradiction detector', status: 'success', details: '3 contradictions found across 5 sources' },
      { timestamp: '2026-05-20T02:30:05Z', type: 'decision', section: 'decisionTraces', action: 'Resolve Property Growth Rate conflict', status: 'success', details: 'Applied credibility-weighted average: (12.4% × 0.92 + 8.1% × 0.78) / (0.92 + 0.78) = 11.1%' },
      { timestamp: '2026-05-20T02:30:06Z', type: 'decision', section: 'decisionTraces', action: 'Resolve Inflation Forecast conflict', status: 'success', details: 'SBP (authority source) preferred over market-derived estimate' },
      { timestamp: '2026-05-20T02:30:07Z', type: 'info', section: 'toolCalls', action: 'Run Monte Carlo simulation', status: 'success', details: '10,000 simulations completed, Sharpe ratio: 1.34' },
      { timestamp: '2026-05-20T02:30:08Z', type: 'error', section: 'failuresRecovery', action: 'Fetch REIT live prices', status: 'recovered', details: 'Connection timeout, retried with backoff, succeeded on attempt 3' },
      { timestamp: '2026-05-20T02:30:09Z', type: 'info', section: 'actionExecution', action: 'Execute portfolio optimization', status: 'success', details: 'Modern Portfolio Theory applied, 5 asset classes selected' },
      { timestamp: '2026-05-20T02:30:10Z', type: 'decision', section: 'decisionTraces', action: 'Rank recommendations by match score', status: 'success', details: `Top pick: ${profile.location} DHA Phase 6 Plot (94% match)` },
      { timestamp: '2026-05-20T02:30:11Z', type: 'success', section: 'finalOutcome', action: 'Analysis complete', status: 'success', details: '5 recommendations generated with 82% overall confidence' },
    ],
    metrics: {
      sourcesProcessed: 5,
      contradictionsFound: 3,
      actionsSimulated: 5,
      analysisTime: 11420,
      confidenceScore: 82,
      noiseFiltered: 14,
    },
  };
}

export function useAnalysis() {
  const [state, setState] = useState('idle');
  const [progress, setProgress] = useState({ step: 0, total: 10, message: '', steps: [] });
  const [results, setResults] = useState(null);
  const [trace, setTrace] = useState([]);
  const abortRef = useRef(null);

  const analyze = useCallback(async (profile) => {
    setState('analyzing');
    setResults(null);
    setTrace([]);

    const steps = PIPELINE_STEPS.map(s => ({ ...s, status: 'waiting' }));
    setProgress({ step: 0, total: 10, message: 'Starting analysis...', steps });

    try {
      // Try connecting to backend first
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(apiUrl('/api/analyze'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile),
          signal: controller.signal,
        });

        if (response.ok && response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const event = JSON.parse(line.slice(6));
                  handleSSEEvent(event, steps, setProgress, setTrace);

                  if (event.type === 'complete') {
                    const finalResults = event.result;
                    // Fetch trace data
                    try {
                      const traceRes = await fetch(apiUrl(`/api/trace/${finalResults.traceId}`));
                      const traceData = await traceRes.json();
                      setTrace(traceData);
                    } catch(e) {
                      console.error('Failed to fetch trace', e);
                    }
                    setResults(finalResults);
                    setState('complete');
                    return;
                  }
                } catch (e) {
                  // Skip malformed JSON
                }
              }
            }
          }
          // If stream ends without complete event, fall through to demo
        }
      } catch (fetchError) {
        // Backend not available, run demo mode
        console.log('Backend not available, running demo mode');
      }

      // Demo mode - simulate the pipeline
      await runDemoMode(profile, steps, setProgress, setTrace, setState, setResults, controller.signal);
    } catch (error) {
      if (error.name !== 'AbortError') {
        setState('error');
        console.error('Analysis error:', error);
      }
    }
  }, []);

  const reset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    setState('idle');
    setProgress({ step: 0, total: 10, message: '', steps: [] });
    setResults(null);
    setTrace([]);
  }, []);

  return { state, progress, results, trace, analyze, reset };
}

function handleSSEEvent(event, steps, setProgress, setTrace) {
  if (event.type === 'progress') {
    const { step, message } = event;
    const updatedSteps = steps.map((s, i) => ({
      ...s,
      status: i < step - 1 ? 'done' : i === step - 1 ? 'running' : 'waiting',
    }));
    setProgress({ step, total: 10, message, steps: updatedSteps });
  }

  if (event.type === 'trace') {
    setTrace(prev => [...prev, event.data]);
  }
}

async function runDemoMode(profile, steps, setProgress, setTrace, setState, setResults, signal) {
  const delays = [800, 600, 700, 900, 1000, 600, 1200, 800, 1100, 700];

  for (let i = 0; i < PIPELINE_STEPS.length; i++) {
    if (signal.aborted) return;

    // Set current step to running
    const updatedSteps = steps.map((s, idx) => ({
      ...s,
      status: idx < i ? 'done' : idx === i ? 'running' : 'waiting',
    }));

    setProgress({
      step: i + 1,
      total: 10,
      message: PIPELINE_STEPS[i].name,
      steps: updatedSteps,
    });

    // Add trace entry
    setTrace(prev => [...prev, {
      timestamp: new Date().toISOString(),
      type: i === 6 ? 'decision' : 'info',
      section: 'pipeline',
      action: PIPELINE_STEPS[i].name,
      status: 'running',
      details: `Step ${i + 1}/10 in progress...`,
    }]);

    await sleep(delays[i]);

    if (signal.aborted) return;

    // Simulate error on step 3 (fetching REIT data) occasionally
    if (i === 2 && Math.random() < 0.3) {
      const errorSteps = steps.map((s, idx) => ({
        ...s,
        status: idx < i ? 'done' : idx === i ? 'error' : 'waiting',
      }));
      setProgress({
        step: i + 1,
        total: 10,
        message: 'Retrying...',
        steps: errorSteps,
      });
      await sleep(1500);
      if (signal.aborted) return;
    }
  }

  // All steps done
  const finalSteps = steps.map(s => ({ ...s, status: 'done' }));
  setProgress({ step: 10, total: 10, message: 'Analysis complete!', steps: finalSteps });

  await sleep(500);
  if (signal.aborted) return;

  const mockResults = generateMockResults(profile);
  setResults(mockResults);
  setTrace(mockResults.trace);
  setState('complete');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
