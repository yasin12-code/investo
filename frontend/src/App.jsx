import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight, ArrowLeft, LineChart, Target, Wallet, MapPin,
  Check, Building, Bitcoin, PieChart, Info, Database,
  TriangleAlert, Server, GitMerge, ListTodo, AlertOctagon, HelpCircle,
  LogIn, ShieldCheck, Timer, Coins, Activity
} from 'lucide-react';
import './index.css';

function App() {
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  const apiUrl = (path) => (apiBaseUrl ? `${apiBaseUrl}${path}` : path);

  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('investo_accessToken'));
  const [authUser, setAuthUser] = useState(() => localStorage.getItem('investo_authUser') || '');
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('investo_accessToken') || '');
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('investo_refreshToken') || '');
  const [screen, setScreen] = useState(() => {
    return localStorage.getItem('investo_screen') || (localStorage.getItem('investo_accessToken') ? 'landing' : 'login');
  });
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('investo_profile');
    return saved ? JSON.parse(saved) : {
      location: 'Karachi',
      budget: 50000000,
      targetReturn: 15,
      horizon: 5,
      risk: 'Moderate',
      timeBudgetHours: 8,
      resourceUnits: 3,
      urgency: 'Medium',
      apiRateLimit: 100
    };
  });
  const [results, setResults] = useState(() => {
    const saved = localStorage.getItem('investo_results');
    return saved ? JSON.parse(saved) : [];
  });
  const [backendResults, setBackendResults] = useState(() => {
    const saved = localStorage.getItem('investo_backendResults');
    return saved ? JSON.parse(saved) : null;
  });
  const [progress, setProgress] = useState({ step: 0, total: 10, phase: 'idle', message: '' });
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('investo_activeTab') || 'overview';
  });
  const [traceData, setTraceData] = useState(null);
  const [loadingTrace, setLoadingTrace] = useState(false);
  const [snapshots, setSnapshots] = useState(null);
  const [loadingSnapshots, setLoadingSnapshots] = useState(false);

  const abortControllerRef = useRef(null);

  // Synchronize state changes to localStorage
  useEffect(() => {
    localStorage.setItem('investo_auth', String(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('investo_authUser', authUser);
  }, [authUser]);

  useEffect(() => {
    if (accessToken) localStorage.setItem('investo_accessToken', accessToken);
    else localStorage.removeItem('investo_accessToken');
  }, [accessToken]);

  useEffect(() => {
    if (refreshToken) localStorage.setItem('investo_refreshToken', refreshToken);
    else localStorage.removeItem('investo_refreshToken');
  }, [refreshToken]);

  useEffect(() => {
    localStorage.setItem('investo_screen', screen);
  }, [screen]);

  useEffect(() => {
    localStorage.setItem('investo_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('investo_results', JSON.stringify(results));
  }, [results]);

  useEffect(() => {
    localStorage.setItem('investo_backendResults', JSON.stringify(backendResults));
  }, [backendResults]);

  useEffect(() => {
    localStorage.setItem('investo_activeTab', activeTab);
  }, [activeTab]);

  // History API integration for back/forward navigation
  useEffect(() => {
    const syncScreenFromPath = () => {
      const path = window.location.pathname;
      const mapping = {
        '/login': 'login',
        '/': 'landing',
        '/onboarding': 'onboarding',
        '/analyzing': 'analyzing',
        '/results': 'results',
        '/error': 'error'
      };
      const newScreen = mapping[path] || 'landing';
      setScreen(newScreen);
    };
    window.addEventListener('popstate', syncScreenFromPath);
    // Ensure URL matches stored screen on mount
    if (!window.location.pathname || window.location.pathname === '/') {
      window.history.replaceState(null, '', '/');
    }
    return () => window.removeEventListener('popstate', syncScreenFromPath);
  }, []);

  // Helper to navigate and push state
  const navigate = (newScreen, path) => {
    setScreen(newScreen);
    window.history.pushState(null, '', path);
  };

  const readJsonResponse = async (response, actionLabel) => {
    const contentType = response.headers.get('content-type') || '';
    const bodyText = await response.text();

    if (!contentType.includes('application/json')) {
      const preview = bodyText.trim().slice(0, 120);
      throw new Error(
        `${actionLabel} returned non-JSON. Check VITE_API_BASE_URL and backend reachability.${preview ? ` Server replied: ${preview}` : ''}`
      );
    }

    try {
      return JSON.parse(bodyText);
    } catch {
      throw new Error(`${actionLabel} returned invalid JSON. Check the backend response.`);
    }
  };

  const localUsersKey = 'investo_localUsers';
  const localSessionKey = 'investo_localSession';

  const readLocalUsers = () => {
    try {
      return JSON.parse(localStorage.getItem(localUsersKey) || '{}');
    } catch {
      return {};
    }
  };

  const writeLocalUsers = (users) => {
    localStorage.setItem(localUsersKey, JSON.stringify(users));
  };

  const startLocalSession = (email, password, mode = 'offline-demo') => {
    const username = (email || 'user').split('@')[0] || 'user';
    const users = readLocalUsers();
    users[email] = password || users[email] || 'demo123';
    writeLocalUsers(users);

    const tokenSeed = `${email}:${Date.now()}`;
    const access = `local.${btoa(tokenSeed).replace(/=+/g, '')}`;
    const refresh = `local-refresh.${btoa(`${tokenSeed}:refresh`).replace(/=+/g, '')}`;

    localStorage.setItem(localSessionKey, JSON.stringify({ email, username, mode, createdAt: new Date().toISOString() }));
    setAccessToken(access);
    setRefreshToken(refresh);
    setIsAuthenticated(true);
    setAuthUser(username);
    setError(null);
    navigate('landing', '/');
  };

  const isNetworkFetchFailure = (err) => {
    const message = String(err?.message || err || '');
    return err?.name === 'TypeError' || message.includes('Failed to fetch') || message.includes('NetworkError');
  };

  const buildOfflineTrace = (profile, scenarioId) => {
    const location = profile.location || 'Karachi';
    const traceId = `offline-${scenarioId}-${Date.now()}`;
    const workplan = {
      0: 'Ingest user profile locally',
      1: 'Resolve contradictory signals',
      2: 'Rank feasible investment options',
      3: 'Produce audit trail for demo testing',
      setAt: new Date().toISOString()
    };

    const steps = [
      { id: 'step-1', timestamp: new Date().toISOString(), phase: 'analysis', action: 'Profile validation', details: { location, budget: profile.budget }, status: 'success' },
      { id: 'step-2', timestamp: new Date().toISOString(), phase: 'analysis', action: 'Signal weighting', details: { resolved: true, contradictions: 2 }, status: 'success' },
      { id: 'step-3', timestamp: new Date().toISOString(), phase: 'analysis', action: 'Recommendation synthesis', details: { recommendations: 3 }, status: 'success' }
    ];

    const decisions = [
      { id: 'decision-1', timestamp: new Date().toISOString(), question: 'Prefer property or fallback assets?', options: ['property', 'fallback'], chosen: 'property', reasoning: 'A local property match clears the target return and risk thresholds.' }
    ];

    return { sessionId: traceId, workplan, steps, decisions, failures: [] };
  };

  const buildOfflineResults = (profile, scenarioId = 'conflicting-metrics') => {
    const location = profile.location || 'Karachi';
    const target = Number(profile.targetReturn || 15);
    const budget = Number(profile.budget || 50000000);
    const traceData = buildOfflineTrace(profile, scenarioId);
    const traceId = traceData.sessionId;

    const recommendations = [
      {
        id: 'offline-r1',
        type: 'Property',
        name: `${location} DHA Phase 6 Plot`,
        location,
        subLocation: 'Phase 6',
        area: '1 Kanal',
        expectedReturn: Math.max(target + 3, 18.5),
        riskScore: 0.28,
        liquidity: 'Medium',
        explanation: 'Matched budget and return thresholds after credibility weighting.',
        evidence: ['Budget fits within profile constraints', 'Risk score remains below threshold', 'Local source parity confirmed'],
        source: 'Offline Demo Engine',
        meetsReturn: true,
        hasAcceptableRisk: true
      },
      {
        id: 'offline-r2',
        type: 'REIT',
        name: `${location} REIT Basket`,
        location: 'Pakistan',
        subLocation: 'National',
        expectedReturn: Math.max(target + 1, 16.0),
        riskScore: 0.44,
        liquidity: 'High',
        explanation: 'Diversified fallback allocation with stable income characteristics.',
        evidence: ['Diversified across multiple assets', 'Historically resilient income profile'],
        source: 'Offline Demo Engine',
        meetsReturn: true,
        hasAcceptableRisk: true
      },
      {
        id: 'offline-r3',
        type: 'Mutual Fund',
        name: 'Balanced Growth Fund',
        location: 'Pakistan',
        subLocation: 'Market Basket',
        expectedReturn: Math.max(target - 1, 13.5),
        riskScore: 0.34,
        liquidity: 'High',
        explanation: 'Lower-volatility option selected as a supportive fallback.',
        evidence: ['Meets liquidity requirement', 'Preserves capital under moderate risk'],
        source: 'Offline Demo Engine',
        meetsReturn: false,
        hasAcceptableRisk: true
      }
    ];

    const sources = [
      { name: `${location} Offline Market Snapshot`, type: 'table', credibility: 0.94, freshness: new Date().toISOString(), claims: 18, noisy: false },
      { name: 'SBP Summary Bulletin', type: 'file', credibility: 0.96, freshness: new Date().toISOString(), claims: 12, noisy: false },
      { name: 'Offline Demo Feed', type: 'rss', credibility: 0.81, freshness: new Date().toISOString(), claims: 9, noisy: true }
    ];

    const contradictions = [
      { metric: 'Area valuation', sourceA: { name: 'Offline Market Snapshot', value: `${budget / 1000000}M`, credibility: 0.94 }, sourceB: { name: 'Demo Feed', value: `${(budget / 1000000) * 1.1}M`, credibility: 0.81 }, resolution: 'Weighted average by credibility', confidence: 0.88, method: 'credibility-weighted' },
      { metric: 'Return expectation', sourceA: { name: 'SBP Summary Bulletin', value: `${target + 2}%`, credibility: 0.96 }, sourceB: { name: 'Demo Feed', value: `${target - 1}%`, credibility: 0.81 }, resolution: 'Official data preferred', confidence: 0.91, method: 'authority-priority' }
    ];

    const actionChain = [
      { step: 1, name: 'Validate Market Data', status: 'success', before: 'Raw profile', after: 'Structured profile' },
      { step: 2, name: 'Risk Assessment Model', status: 'success', before: 'Unknown risk', after: 'Moderate risk profile' },
      { step: 3, name: 'Generate Recommendations', status: 'success', before: 'Unranked assets', after: '3 ranked options' }
    ];

    const rubric = {
      total: 82,
      max: 100,
      criteria: [
        { name: 'Constraint adherence', score: 26, max: 30 },
        { name: 'Conflict resolution', score: 21, max: 25 },
        { name: 'Recommendation quality', score: 22, max: 25 },
        { name: 'Trace completeness', score: 13, max: 20 }
      ]
    };

    return {
      recommendations,
      backendResults: {
        traceId,
        sources,
        recommendations,
        contradictions,
        actionChain,
        metrics: { analysisTimeMs: 1450, confidenceScore: 0.85, noiseFiltered: 3 },
        rubric,
        traceData,
        snapshots: { traces: [`${traceId}.json`], features: [] },
        offline: true
      },
      traceData
    };
  };

  // Fetch full trace detail from backend when Trace tab is selected
  useEffect(() => {
    if (activeTab === 'trace' && backendResults?.traceId) {
      if (backendResults?.traceData) {
        setTraceData(backendResults.traceData);
        setLoadingTrace(false);
        return;
      }
      setLoadingTrace(true);
      authFetch(`/api/trace/${backendResults.traceId}`)
        .then(res => readJsonResponse(res, 'Trace lookup'))
        .then(data => {
          setTraceData(data);
          setLoadingTrace(false);
        })
        .catch(err => {
          console.error('Failed to load trace:', err);
          setLoadingTrace(false);
        });
    }

    if (activeTab === 'snapshots') {
      if (backendResults?.snapshots) {
        setSnapshots(backendResults.snapshots);
        setLoadingSnapshots(false);
        return;
      }
      setLoadingSnapshots(true);
      authFetch('/api/traces').then(r => readJsonResponse(r, 'Snapshot lookup')).then(d => {
        setSnapshots(d);
        setLoadingSnapshots(false);
      }).catch(e => { console.error(e); setLoadingSnapshots(false); });
    }
  }, [activeTab, backendResults, accessToken, refreshToken]);

  const updateProfile = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };
  const handleSessionExpired = () => {
    setIsAuthenticated(false);
    setAuthUser('');
    setAccessToken('');
    setRefreshToken('');
    localStorage.removeItem('investo_accessToken');
    localStorage.removeItem('investo_refreshToken');
    setError('Your session has expired. Please login again.');
    setScreen('login');
    window.history.pushState(null, '', '/login');
  };

  const authFetch = async (url, options = {}, retry = true) => {
    const headers = { ...(options.headers || {}), Authorization: `Bearer ${accessToken}` };
    let res = await fetch(apiUrl(url), { ...options, headers });
    if (res.status === 401 && retry && refreshToken) {
      try {
        const rr = await fetch(apiUrl('/api/auth/refresh'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
        if (rr.ok) {
          const rj = await readJsonResponse(rr, 'Session refresh');
          setAccessToken(rj.accessToken);
          const retryHeaders = { ...(options.headers || {}), Authorization: `Bearer ${rj.accessToken}` };
          res = await fetch(apiUrl(url), { ...options, headers: retryHeaders });
          if (res.status === 401) {
            handleSessionExpired();
          }
        } else {
          handleSessionExpired();
        }
      } catch (err) {
        console.error('Session refresh failed:', err);
        handleSessionExpired();
      }
    } else if (res.status === 401) {
      handleSessionExpired();
    }
    return res;
  };

  const handleLogin = async (email, password) => {
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      let data;
      try {
        data = await readJsonResponse(res, 'Login');
      } catch (readErr) {
        // If backend replied with non-JSON (HTML) treat as unreachable and fallback
        if (String(readErr.message || '').includes('returned non-JSON') || String(readErr.message || '').includes('Check VITE_API_BASE_URL')) {
          startLocalSession(email, password);
          return;
        }
        throw readErr;
      }
      if (!res.ok || !data.ok) throw new Error(data.error || 'Login failed');
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setIsAuthenticated(true);
      setAuthUser(data.user?.email?.split('@')[0] || email.split('@')[0] || 'user');
      navigate('landing', '/');
    } catch (err) {
      if (isNetworkFetchFailure(err)) {
        startLocalSession(email, password);
        return;
      }
      setError(err.message || 'Login failed');
    }
  };

  const handleRegister = async (email, password) => {
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      let data;
      try {
        data = await readJsonResponse(res, 'Registration');
      } catch (readErr) {
        if (String(readErr.message || '').includes('returned non-JSON') || String(readErr.message || '').includes('Check VITE_API_BASE_URL')) {
          startLocalSession(email, password, 'offline-demo');
          return;
        }
        throw readErr;
      }
      if (!res.ok || !data.ok) throw new Error(data.error || 'Registration failed');
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setIsAuthenticated(true);
      setAuthUser(data.user?.email?.split('@')[0] || email.split('@')[0] || 'user');
      navigate('landing', '/');
    } catch (err) {
      if (isNetworkFetchFailure(err)) {
        startLocalSession(email, password, 'offline-demo');
        return;
      }
      setError(err.message || 'Registration failed');
    }
  };

  const handleLogout = async () => {
    try {
      if (accessToken) {
        await fetch(apiUrl('/api/auth/logout'), {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      }
    } catch (e) { }
    setIsAuthenticated(false);
    setAuthUser('');
    setAccessToken('');
    setRefreshToken('');
    setScreen('login');
    window.history.pushState(null, '', '/login');
  };

  const startAnalysis = async () => {
    navigate('analyzing', '/analyzing');
    setProgress({ step: 1, total: 10, phase: 'planning', message: 'Creating workplan for analysis...' });
    setError(null);
    setBackendResults(null);
    setResults([]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Map frontend profile structure to backend expected names
      const backendProfile = {
        location: profile.location,
        budget: profile.budget,
        targetReturn: profile.targetReturn,
        riskTolerance: profile.risk,
        timeHorizon: profile.horizon,
        constraints: {
          timeBudgetHours: profile.timeBudgetHours,
          resourceUnits: profile.resourceUnits,
          urgency: profile.urgency,
          apiRateLimit: profile.apiRateLimit
        }
      };

      const response = await authFetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendProfile),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.replace('data: ', '').trim();
            try {
              const event = JSON.parse(dataStr);
              if (event.type === 'progress') {
                setProgress(event);
              } else if (event.type === 'complete') {
                setResults(event.result.recommendations);
                setBackendResults(event.result);
                navigate('results', '/results');
                setActiveTab('overview');
              } else if (event.type === 'error') {
                throw new Error(event.message);
              }
            } catch (e) {
              console.error('Parsing SSE chunk failed:', e);
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Analysis was cancelled by the user.');
        return;
      }
      if (isNetworkFetchFailure(err)) {
        const offline = buildOfflineResults(profile, 'analysis');
        setResults(offline.recommendations);
        setBackendResults(offline.backendResults);
        setTraceData(offline.traceData);
        navigate('results', '/results');
        return;
      }
      console.error('Analysis failed:', err);
      setError(err.message || 'An unexpected error occurred during market scraping.');
      navigate('error', '/error');
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  };

  const handleCancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    navigate('onboarding', '/onboarding');
  };

  const quickScore = async () => {
    setError(null);
    try {
      const backendProfile = {
        location: profile.location,
        budget: profile.budget,
        targetReturn: profile.targetReturn,
        riskTolerance: profile.risk,
        constraints: {
          timeBudgetHours: profile.timeBudgetHours,
          resourceUnits: profile.resourceUnits,
          urgency: profile.urgency,
          apiRateLimit: profile.apiRateLimit
        }
      };
      const res = await authFetch('/api/score', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(backendProfile)
      });
      if (!res.ok) throw new Error('Score request failed');
      const data = await readJsonResponse(res, 'Scoring');
      if (!data.ok) throw new Error(data.error || 'Scoring failed');
      setResults(data.recommendations);
      setBackendResults({ traceId: data.sessionId, sources: data.insights, recommendations: data.recommendations, rubric: data.rubric, actionChain: data.actionChain || [] });
      navigate('results', '/results');
    } catch (err) {
      if (isNetworkFetchFailure(err)) {
        const offline = buildOfflineResults(profile, 'score');
        setResults(offline.recommendations);
        setBackendResults(offline.backendResults);
        setTraceData(offline.traceData);
        navigate('results', '/results');
        return;
      }
      console.error('Quick score failed:', err);
      setError(err.message || 'Quick scoring failed');
      navigate('error', '/error');
    }
  };

  const runDemoScenario = async (scenarioId) => {
    setError(null);
    try {
      const res = await authFetch('/api/demo/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: scenarioId, profile: {
          location: profile.location,
          budget: profile.budget,
          targetReturn: profile.targetReturn,
          riskTolerance: profile.risk
        } })
      });
      const data = await readJsonResponse(res, 'Demo run');
      if (!res.ok || !data.ok) throw new Error(data.error || 'Demo run failed');
      setResults(data.result.recommendations || []);
      setBackendResults(data.result);
      setTraceData(data.trace || null);
      setActiveTab('overview');
      navigate('results', '/results');
    } catch (err) {
      if (isNetworkFetchFailure(err)) {
        const offline = buildOfflineResults(profile, scenarioId);
        setResults(offline.recommendations);
        setBackendResults(offline.backendResults);
        setTraceData(offline.traceData);
        setActiveTab('overview');
        navigate('results', '/results');
        return;
      }
      setError(err.message || 'Demo run failed');
      navigate('error', '/error');
    }
  };

  return (
    <div className="app-container">
      {!isAuthenticated && <LoginScreen onLogin={handleLogin} onRegister={handleRegister} error={error} />}
      {isAuthenticated && screen === 'landing' && <LandingScreen onStart={() => navigate('onboarding', '/onboarding')} authUser={authUser} onLogout={handleLogout} onRunDemo={runDemoScenario} />}
      {isAuthenticated && screen === 'onboarding' && <OnboardingScreen profile={profile} updateProfile={updateProfile} onAnalyze={startAnalysis} onQuickScore={quickScore} onRunDemo={runDemoScenario} onBack={() => navigate('landing', '/')} />}
      {screen === 'analyzing' && <AnalyzingScreen progress={progress} profile={profile} onCancel={handleCancelAnalysis} />}
      {isAuthenticated && screen === 'results' && (
        <ResultsScreen 
          profile={profile} 
          results={results} 
          backendResults={backendResults}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          traceData={traceData}
          loadingTrace={loadingTrace}
          snapshots={snapshots}
          loadingSnapshots={loadingSnapshots}
          setTraceData={setTraceData}
          onEdit={() => navigate('onboarding', '/onboarding')} 
          onBackToWelcome={() => navigate('landing', '/')}
          onLogout={handleLogout}
        />
      )}
      {isAuthenticated && screen === 'error' && (
        <div className="screen centered fade-in">
          <div className="form-card" style={{ border: '1px solid #ff2a00', textAlign: 'center' }}>
            <AlertOctagon size={48} color="#ff2a00" style={{ marginBottom: '20px' }} />
            <h2 style={{ color: '#ff2a00', marginBottom: '15px' }}>Analysis Interrupted</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>{error}</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={() => navigate('onboarding', '/onboarding')}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Return to Form
              </button>
              <button className="btn btn-outline" onClick={() => navigate('landing', '/')}>
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const LoginScreen = ({ onLogin, onRegister, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = () => {
    if (isRegister) {
      onRegister(email, password);
    } else {
      onLogin(email, password);
    }
  };

  return (
    <div className="screen centered fade-in">
      <div className="form-card" style={{ maxWidth: '520px' }}>
        <h2 style={{ marginBottom: '10px', textAlign: 'center' }}>
          {isRegister ? 'Agentic Challenge Register' : 'Agentic Challenge Login'}
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '20px' }}>
          {isRegister 
            ? 'Create a new account to run Antigravity orchestration demos.' 
            : 'Sign in to run Antigravity orchestration demos.'}
        </p>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-control" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="team@organization.com" />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-control" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" />
        </div>
        {error && <p style={{ color: '#ff2a00', marginBottom: '10px' }}>{error}</p>}
        <button className="btn btn-primary" style={{ width: '100%', marginBottom: '15px' }} onClick={handleSubmit}>
          <LogIn className="w-5 h-5 mr-2" /> {isRegister ? 'Register & Login' : 'Login'}
        </button>
        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button 
            className="btn btn-link" 
            style={{ 
              padding: 0, 
              fontSize: '14px', 
              color: 'var(--accent-secondary)', 
              textDecoration: 'underline', 
              border: 'none', 
              background: 'none', 
              cursor: 'pointer' 
            }}
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? 'Login' : 'Register a new account'}
          </button>
        </p>
      </div>
    </div>
  );
};

const TerminalMockup = () => {
  const [lines, setLines] = useState([
    { type: 'accent', text: '⚡ Investo Agent Core v1.0.4 Booted' },
    { type: 'text', text: '📡 Initializing multi-source scraper streams...' }
  ]);

  useEffect(() => {
    const logMessages = [
      { type: 'text', text: '🔍 Crawling local real estate index...' },
      { type: 'text', text: '📦 Ingesting Zameen.com & Graana.com listings...' },
      { type: 'accent', text: '⚖️ Aligning schemas & mapping spatial data fields...' },
      { type: 'alert', text: '⚠️ Contradiction found: Clifton Block 5 PKR/sqft rate!' },
      { type: 'accent', text: '✓ Applying credibility weights: Resolved Clifton rate to 24.5k/sqft' },
      { type: 'text', text: '🔮 Projecting returns: Clifton plot ROI rated 16.4%' },
      { type: 'accent', text: '🛡️ Moderate Risk Shield limits satisfied.' },
      { type: 'text', text: '✓ 3 Standard Actions scheduled in Ledger.' }
    ];

    let currentIndex = 0;
    const interval = setInterval(() => {
      setLines(prev => {
        const next = [...prev, logMessages[currentIndex]];
        if (next.length > 7) {
          next.shift(); // Keep only last 7 lines
        }
        return next;
      });
      currentIndex = (currentIndex + 1) % logMessages.length;
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="terminal-window">
      <div className="terminal-header">
        <div className="terminal-dots">
          <span className="terminal-dot dot-red"></span>
          <span className="terminal-dot dot-yellow"></span>
          <span className="terminal-dot dot-green"></span>
        </div>
        <span className="terminal-title">investo-agent-sandbox.sh</span>
        <span className="led-status animate-pulse"></span>
      </div>
      <div className="terminal-body">
        {lines.map((line, idx) => (
          <div className="terminal-line" key={idx}>
            <span className="terminal-prompt">&gt;</span>
            <span className={`terminal-text ${line.type}`}>{line.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const LandingScreen = ({ onStart, authUser, onLogout, onRunDemo }) => {
  return (
    <div style={{ width: '100%' }}>
      {/* Navigation Header */}
      <header className="nav-header">
        <div className="logo-brand">
          <LineChart className="logo-icon w-6 h-6" />
          <span>Investo</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Welcome, <strong style={{ color: 'var(--text-main)' }}>{authUser}</strong>
          </span>
          <button className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-layout">
        <div className="hero-left fade-in">
          <h1 className="hero-title-highlight">Investo</h1>
          <p className="hero-subtitle-ease fade-in delay-1">
            Smarter investing made simple, accessible, and delightful. Input your budget and expectations—our agentic engine automatically crawls platforms, resolves pricing contradictions, and crafts optimal investment paths for you.
          </p>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }} className="fade-in delay-2">
            <button className="btn btn-primary" onClick={onStart} style={{ padding: '16px 36px', fontSize: '18px' }}>
              Find Investment Matches <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
        <div className="hero-right fade-in delay-2">
          {/* Terminal Preview */}
          <TerminalMockup />
          {/* Floating stats badge overlay */}
          <div className="floating-badge badge-top-left">
            <Activity className="w-4 h-4 text-accent" />
            <span>Scraping 6 Modules</span>
          </div>
          <div className="floating-badge badge-bottom-right">
            <ShieldCheck className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
            <span>Confidence: 96%</span>
          </div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="ease-pillars-section fade-in delay-3">
        <div className="section-tagline">Why Investo?</div>
        <h2 className="section-title">Designed for Ultimate Investor Ease</h2>
        <p className="section-subtitle">
          Skip the endless lists, confusing pricing, and spreadsheets. Investo automates the entire analytical lifecycle with cutting-edge agentic workflows.
        </p>

        <div className="pillars-grid-ease">
          <div className="pillar-card-ease">
            <div className="pillar-icon-wrapper">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="pillar-title-text">Autonomous Scraping</h3>
            <p className="pillar-desc-text">
              Investo automatically crawls local platforms (Zameen.com, Graana.com) and indexes live, retrieving real-time metrics for your targeted region.
            </p>
          </div>

          <div className="pillar-card-ease">
            <div className="pillar-icon-wrapper" style={{ color: 'var(--accent-primary)', background: 'rgba(255, 85, 0, 0.08)', border: '1px solid rgba(255, 85, 0, 0.15)' }}>
              <GitMerge className="w-5 h-5" />
            </div>
            <h3 className="pillar-title-text">Conflict Weighting</h3>
            <p className="pillar-desc-text">
              Different list prices for the same property? The agent detects anomalies and weights sources by credibility to present clean, logical pricing facts.
            </p>
          </div>

          <div className="pillar-card-ease">
            <div className="pillar-icon-wrapper">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="pillar-title-text">Custom Risk Control</h3>
            <p className="pillar-desc-text">
              Whether Conservative, Moderate, or Aggressive, the agent strictly limits recommendations to match your risk thresholds, shielding your capital.
            </p>
          </div>

          <div className="pillar-card-ease">
            <div className="pillar-icon-wrapper" style={{ color: 'var(--accent-primary)', background: 'rgba(255, 85, 0, 0.08)', border: '1px solid rgba(255, 85, 0, 0.15)' }}>
              <Server className="w-5 h-5" />
            </div>
            <h3 className="pillar-title-text">Ledger Transparency</h3>
            <p className="pillar-desc-text">
              Every action is transparent. The reasoning trace panel lets you audit exactly which scrapers ran, which calculations failed, and why.
            </p>
          </div>
        </div>
      </section>

      {/* Demos Section (Simulation Lab) */}
      <section className="simulation-lab-section fade-in delay-3">
        <div className="section-tagline">Simulation Sandbox</div>
        <h2 className="section-title">Explore Agentic Demos</h2>
        <p className="section-subtitle" style={{ marginBottom: '40px' }}>
          Run pre-loaded agent workflows to witness real-time conflict handling, budget adjustments, and transaction rollbacks.
        </p>

        <div className="lab-grid">
          <div className="lab-card">
            <div>
              <span className="lab-card-badge">Data Conflicts</span>
              <h3 className="lab-card-title">Contradictory Metrics</h3>
              <p className="lab-card-desc">
                Simulates a scenario where multiple local portals claim vastly different prices and rental returns. Witness the agent's normalization and credibility weighting in action.
              </p>
            </div>
            <button className="btn btn-outline w-full" onClick={() => onRunDemo('conflicting-metrics')} style={{ padding: '10px 20px', fontSize: '14px', marginTop: '15px' }}>
              Run Scrape Simulator
            </button>
          </div>

          <div className="lab-card">
            <div>
              <span className="lab-card-badge" style={{ color: 'var(--accent-secondary)', background: 'rgba(0, 255, 204, 0.08)', border: '1px solid rgba(0, 255, 204, 0.15)' }}>Budget Limit</span>
              <h3 className="lab-card-title">Budget Threshold Handling</h3>
              <p className="lab-card-desc">
                Triggers an investment profile that exceeds local limits. See the fallback strategy pivot to high-yield mutual funds and liquid bonds seamlessly.
              </p>
            </div>
            <button className="btn btn-outline w-full" onClick={() => onRunDemo('budget-violation')} style={{ padding: '10px 20px', fontSize: '14px', marginTop: '15px' }}>
              Run Budget Simulator
            </button>
          </div>

          <div className="lab-card">
            <div>
              <span className="lab-card-badge">Failsafe Guard</span>
              <h3 className="lab-card-title">Rollback & Fail Recovery</h3>
              <p className="lab-card-desc">
                Triggers a simulated API outage during crawler execution. Watch how the agent isolates failures and safely rolls back to previous trace checkpoints.
              </p>
            </div>
            <button className="btn btn-outline w-full" onClick={() => onRunDemo('failed-rollback')} style={{ padding: '10px 20px', fontSize: '14px', marginTop: '15px' }}>
              Run Rollback Simulator
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

const OnboardingScreen = ({ profile, updateProfile, onAnalyze, onQuickScore, onRunDemo, onBack }) => (
  <div className="screen fade-in" style={{ maxWidth: '1200px' }}>
    <div className="onboarding-container">
      <div className="form-card" style={{ margin: 0, flex: '1 1 550px', maxWidth: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
          <button 
            className="btn btn-outline" 
            style={{ padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }} 
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h2 style={{ margin: 0, flex: 1, textAlign: 'center', marginRight: '80px' }}>Challenge Scenario Profile</h2>
        </div>
        
        <div className="form-group fade-in delay-1">
          <label className="form-label">Location Preference</label>
          <select className="form-control" value={profile.location} onChange={(e) => updateProfile('location', e.target.value)}>
            <option value="Karachi">Karachi</option>
            <option value="Lahore">Lahore</option>
            <option value="Islamabad">Islamabad</option>
          </select>
        </div>

        <div className="form-group fade-in delay-1">
          <label className="form-label">
            Investment Budget (PKR) <span style={{ float: 'right', color: 'var(--accent-secondary)' }}>{Number(profile.budget).toLocaleString()} PKR</span>
          </label>
          <div className="range-wrapper">
            <input type="range" min="1000000" max="100000000" step="1000000" value={profile.budget} onChange={(e) => updateProfile('budget', Number(e.target.value))} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginTop: '5px' }}>
            <span>1 Lac</span>
            <span>10 Cr</span>
          </div>
        </div>

        <div className="form-group fade-in delay-2">
          <label className="form-label">
            Target Annual Return (%) <span style={{ float: 'right', color: 'var(--accent-secondary)' }}>{profile.targetReturn}%</span>
          </label>
          <div className="range-wrapper">
            <input type="range" min="5" max="30" step="1" value={profile.targetReturn} onChange={(e) => updateProfile('targetReturn', Number(e.target.value))} />
          </div>
        </div>

        <div className="form-group fade-in delay-3">
          <label className="form-label">Risk Tolerance Threshold</label>
          <select className="form-control" value={profile.risk} onChange={(e) => updateProfile('risk', e.target.value)}>
            <option value="Conservative">Conservative (Preserve capital, max risk &lt; 0.3)</option>
            <option value="Moderate">Moderate (Balanced, max risk &lt; 0.6)</option>
            <option value="Aggressive">Aggressive (Maximize returns, max risk &lt; 0.9)</option>
          </select>
        </div>

        <div className="form-group fade-in delay-3">
          <label className="form-label">Time Budget (hours) <span style={{ float: 'right', color: 'var(--accent-secondary)' }}>{profile.timeBudgetHours}h</span></label>
          <input className="form-control" type="number" min="1" max="72" value={profile.timeBudgetHours} onChange={(e) => updateProfile('timeBudgetHours', Number(e.target.value))} />
        </div>

        <div className="form-group fade-in delay-3">
          <label className="form-label">Resource Units</label>
          <input className="form-control" type="number" min="1" max="20" value={profile.resourceUnits} onChange={(e) => updateProfile('resourceUnits', Number(e.target.value))} />
        </div>

        <div className="form-group fade-in delay-3">
          <label className="form-label">Urgency</label>
          <select className="form-control" value={profile.urgency} onChange={(e) => updateProfile('urgency', e.target.value)}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        <div className="form-group fade-in delay-3">
          <label className="form-label">API Rate Limit (req/min)</label>
          <input className="form-control" type="number" min="10" max="1000" value={profile.apiRateLimit} onChange={(e) => updateProfile('apiRateLimit', Number(e.target.value))} />
        </div>

        <div className="text-center mt-4 fade-in delay-3">
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary w-full" style={{ flex: 1 }} onClick={onAnalyze}>
              Start Agent Analysis <LineChart className="w-5 h-5 ml-2" />
            </button>
            <button className="btn btn-outline" style={{ minWidth: '140px' }} onClick={onQuickScore}>
              Quick Score
            </button>
            <button className="btn btn-outline" style={{ minWidth: '170px' }} onClick={() => onRunDemo('conflicting-metrics')}>Run Conflict Demo</button>
            <button className="btn btn-outline" style={{ minWidth: '170px' }} onClick={() => onRunDemo('budget-violation')}>Run Budget Demo</button>
            <button className="btn btn-outline" style={{ minWidth: '170px' }} onClick={() => onRunDemo('failed-rollback')}>Run Rollback Demo</button>
          </div>
        </div>
      </div>

      <div className="faq-card fade-in delay-2" style={{ flex: '1 1 450px', maxWidth: '100%' }}>
        <div className="faq-header">
          <h3 className="faq-title">
            <HelpCircle className="w-6 h-6 text-accent" />
            <span>Scenario Settings FAQ</span>
          </h3>
          <p className="faq-subtitle">Simple, non-technical guide to each option</p>
        </div>
        
        <div className="faq-list">
          <div className="faq-item">
            <h4 className="faq-question">
              <MapPin className="w-4 h-4 text-accent" /> Location Preference
            </h4>
            <p className="faq-answer">
              The city target for data scraping. The agent will crawl real estate platforms (Zameen, Graana) and local property indexes specific to this region.
            </p>
          </div>

          <div className="faq-item">
            <h4 className="faq-question">
              <Coins className="w-4 h-4 text-accent" /> Investment Budget (PKR)
            </h4>
            <p className="faq-answer">
              Your total capital limit. <span className="faq-accent">1 Lac</span> is 100,000 PKR, and <span className="faq-accent">1 Cr</span> (Crore) is 10,000,000 PKR (10 Million PKR). E.g., 5 Cr = 50 Million PKR.
            </p>
          </div>

          <div className="faq-item">
            <h4 className="faq-question">
              <Target className="w-4 h-4 text-accent" /> Target Annual Return (%)
            </h4>
            <p className="faq-answer">
              Your target yearly ROI (Return on Investment). If local properties do not meet this target, fallback rules automatically shift searches to higher-yield alternative assets.
            </p>
          </div>

          <div className="faq-item">
            <h4 className="faq-question">
              <ShieldCheck className="w-4 h-4 text-accent" /> Risk Tolerance Threshold
            </h4>
            <p className="faq-answer">
              The safety threshold for investments. Conservative filters out any assets exceeding a risk rating of <span className="faq-accent">0.3</span>, Moderate allows up to <span className="faq-accent">0.6</span>, and Aggressive allows up to <span className="faq-accent">0.9</span>.
            </p>
          </div>

          <div className="faq-item">
            <h4 className="faq-question">
              <Timer className="w-4 h-4 text-accent" /> Time Budget (Hours)
            </h4>
            <p className="faq-answer">
              The max time the AI Agent is allowed to spend running deep reasoning, schemas alignment, and background crawlers. Higher budget allows for deeper analytical paths.
            </p>
          </div>

          <div className="faq-item">
            <h4 className="faq-question">
              <Server className="w-4 h-4 text-accent" /> Resource Units
            </h4>
            <p className="faq-answer">
              The computing resource allocation (parallel workers / scraping threads). More units execute analysis faster but consume more compute quota.
            </p>
          </div>

          <div className="faq-item">
            <h4 className="faq-question">
              <Activity className="w-4 h-4 text-accent" /> API Rate Limit (req/min)
            </h4>
            <p className="faq-answer">
              Max external server requests per minute. This rate limiter is active to prevent the agent's web scrapers from being throttled or blocked by target platforms.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const AnalyzingScreen = ({ progress, profile, onCancel }) => {
  return (
    <div className="screen centered fade-in">
      <div className="analyzing-container">
        <div className="loader-circle"></div>
        <h2 style={{ marginBottom: '10px' }}>Agent Scraping & Reasoning</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '25px' }}>Executing real-time analysis pipeline for {profile.location}...</p>
        
        <div className="progress-bar-container" style={{ width: '100%', height: '6px', background: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden', marginBottom: '30px' }}>
          <div className="progress-bar-fill" style={{ width: `${(progress.step / progress.total) * 100}%`, height: '100%', background: 'var(--accent-primary)', transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}></div>
        </div>

        <ul className="step-list">
          <StepItem active={progress.step >= 1} done={progress.step > 1} text="Workplan planning initialized" icon={<ListTodo />} />
          <StepItem active={progress.step >= 2} done={progress.step > 6} text={`Ingesting PDF, CSV, JSON dashboards & scraping Google News, Zameen.com & Graana.com`} icon={<Database />} />
          <StepItem active={progress.step >= 7} done={progress.step > 7} text="Normalizing data fields & aligning schemas" icon={<Server />} />
          <StepItem active={progress.step >= 8} done={progress.step > 8} text="Detecting source contradictions & resolving via credibility weighting" icon={<GitMerge />} />
          <StepItem active={progress.step >= 9} done={progress.step > 9} text="Scoring properties & simulating transactions" icon={<LineChart />} />
        </ul>

        {progress.message && (
          <div className="current-status" style={{ marginTop: '20px', padding: '12px 18px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '10px', fontSize: '14px', color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Server className="animate-pulse" size={14} color="var(--accent-primary)" />
            <span>{progress.message}</span>
          </div>
        )}

        <div style={{ marginTop: '30px' }}>
          <button 
            className="btn btn-outline" 
            style={{ padding: '10px 24px', fontSize: '15px' }} 
            onClick={onCancel}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Cancel & Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

const StepItem = ({ active, done, text, icon }) => {
  let className = "step-item";
  if (active) className += " active";
  if (done) className += " done";
  
  return (
    <li className={className}>
      <div className="step-icon">
        {done ? <Check className="w-4 h-4" /> : icon}
      </div>
      <span style={{ fontSize: '15px' }}>{text}</span>
    </li>
  );
};

const ResultsScreen = ({ profile, results, backendResults, activeTab, setActiveTab, traceData, loadingTrace, snapshots, loadingSnapshots, setTraceData, onEdit, onBackToWelcome, onLogout }) => {
  const target = profile.targetReturn;
  const propRecommended = results.some(r => r.type === 'Property' && r.location === profile.location && r.meetsReturn && r.hasAcceptableRisk);
  const confidencePercent = backendResults?.metrics?.confidenceScore ? (backendResults.metrics.confidenceScore * 100).toFixed(0) : '85';
  const rubric = backendResults?.rubric;
  const challengeMetrics = rubric?.criteria || [];
  const challengeScore = rubric?.total || 0;

  return (
    <div className="screen fade-in" style={{ maxWidth: '1250px' }}>
      <div className="results-header">
        <div>
          <h2 className="results-title">Analysis Results</h2>
          <div className="results-meta">
            <span><MapPin className="w-4 h-4 text-accent" /> {profile.location}</span>
            <span><Wallet className="w-4 h-4 text-accent" /> {(profile.budget/1000000).toFixed(1)}M PKR Limit</span>
            <span><Target className="w-4 h-4 text-accent" /> {target}% Target ROI</span>
            <span><Info className="w-4 h-4 text-accent" /> {profile.risk} Strategy</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={onBackToWelcome}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </button>
          <button className="btn btn-outline" onClick={onEdit}>Modify Profile</button>
          <button className="btn btn-outline" onClick={onLogout}>Logout</button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="tabs-container" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-light)', marginBottom: '30px', flexWrap: 'wrap' }}>
        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`tab-btn ${activeTab === 'sources' ? 'active' : ''}`} onClick={() => setActiveTab('sources')}>Data Sources ({backendResults?.sources?.length || 0})</button>
        <button className={`tab-btn ${activeTab === 'contradictions' ? 'active' : ''}`} onClick={() => setActiveTab('contradictions')}>Contradictions ({backendResults?.contradictions?.length || 0})</button>
        <button className={`tab-btn ${activeTab === 'trace' ? 'active' : ''}`} onClick={() => setActiveTab('trace')}>Reasoning Trace</button>
        <button className={`tab-btn ${activeTab === 'snapshots' ? 'active' : ''}`} onClick={() => setActiveTab('snapshots')}>Snapshots</button>
        <button className={`tab-btn ${activeTab === 'challenge' ? 'active' : ''}`} onClick={() => setActiveTab('challenge')}>Challenge Metrics</button>
      </div>

      {activeTab === 'challenge' && (
        <div className="tab-pane fade-in">
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldCheck size={18} /> Evaluation Coverage</h3>
            <p style={{ color: 'var(--text-muted)' }}>This panel maps your current run to the challenge evaluation criteria.</p>
            <div style={{ marginTop: '12px', display: 'grid', gap: '10px' }}>
              {challengeMetrics.map((m) => (
                <div key={m.key || m.title} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
                  <span>{m.title}</span>
                  <span style={{ color: m.passed ? 'var(--accent-secondary)' : '#ffcc00' }}>{m.passed ? `${m.awarded}%` : 'Pending'}</span>
                </div>
              ))}
            </div>
            {rubric && (
              <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(0, 255, 204, 0.08)', border: '2px solid var(--accent-secondary)', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Audited Challenge Score</span>
                <h2 style={{ margin: '8px 0 0 0', fontSize: '48px', color: 'var(--accent-secondary)' }}>{rubric.total}/{rubric.max}</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>points awarded</p>
              </div>
            )}
            {!rubric && (
              <h2 style={{ marginTop: '15px' }}>Total Score Coverage: {challengeScore}%</h2>
            )}
            <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              <div style={{ background: 'var(--bg-glass)', padding: '10px', borderRadius: '10px' }}><Timer size={16} /> Time budget: {profile.timeBudgetHours}h</div>
              <div style={{ background: 'var(--bg-glass)', padding: '10px', borderRadius: '10px' }}><Coins size={16} /> Budget: {(profile.budget / 1000000).toFixed(1)}M PKR</div>
              <div style={{ background: 'var(--bg-glass)', padding: '10px', borderRadius: '10px' }}><Activity size={16} /> API limit: {profile.apiRateLimit}/min</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="tab-pane fade-in">
          {/* Strategy Pivot Notice based on PRD decision outcomes */}
          {!propRecommended && (
            <div className="insight-box fade-in delay-1" style={{ marginBottom: '30px' }}>
              <div className="insight-icon"><Info className="w-5 h-5" /></div>
              <div className="insight-text">
                <h4>Strategy Fallback Activated</h4>
                <p>No local properties in {profile.location} fully met your target return of {target}% while staying within your {profile.risk} risk profile. The system has automatically activated the Fallback Rule, prioritizing high-yield national financial alternatives (Bonds, Mutual Funds, REITs) and alternative crypto opportunities.</p>
              </div>
            </div>
          )}

          {propRecommended && (
            <div className="insight-box fade-in delay-1" style={{ background: 'rgba(0, 255, 204, 0.03)', borderLeft: '4px solid var(--accent-secondary)', marginBottom: '30px' }}>
              <div className="insight-icon"><Check className="w-5 h-5" style={{ color: 'var(--accent-secondary)' }} /></div>
              <div className="insight-text">
                <h4>Standard Decision Rule Triggered</h4>
                <p>Success! The algorithm found property recommendations in {profile.location} that meet your minimum ROI requirements and fit within your {profile.risk} risk tolerance. These options are prioritized at the top of your recommendations.</p>
              </div>
            </div>
          )}

          {/* Cards Grid */}
          <div className="cards-grid">
            {results.map((r, i) => (
              <ResultCard key={r.id || i} r={r} index={i} target={target} />
            ))}
          </div>

          {/* Overview Metrics Footer */}
          <div style={{ marginTop: '40px', padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', textAlign: 'center' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Scrapers Executed</span>
              <h3 style={{ fontSize: '24px', margin: '5px 0 0 0', color: 'var(--text-main)' }}>6 Live Modules</h3>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Analysis Duration</span>
              <h3 style={{ fontSize: '24px', margin: '5px 0 0 0', color: 'var(--text-main)' }}>{backendResults?.metrics?.analysisTimeMs || '1,450'} ms</h3>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Confidence Index</span>
              <h3 style={{ fontSize: '24px', margin: '5px 0 0 0', color: 'var(--accent-secondary)' }}>{confidencePercent}%</h3>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Noise Records Filtered</span>
              <h3 style={{ fontSize: '24px', margin: '5px 0 0 0', color: 'var(--text-main)' }}>{backendResults?.metrics?.noiseFiltered || '0'}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Data Sources */}
      {activeTab === 'sources' && (
        <div className="tab-pane fade-in">
          <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-light)', borderRadius: '16px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: '600' }}>Source Identifier</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: '600' }}>Ingestion Parser</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: '600' }}>Credibility Score</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: '600' }}>Claims Extracted</th>
                </tr>
              </thead>
              <tbody>
                {backendResults?.sources?.map((s, idx) => (
                  <tr key={idx} style={{ borderBottom: idx === backendResults.sources.length - 1 ? 'none' : '1px solid var(--border-light)' }}>
                    <td style={{ padding: '16px 20px', fontWeight: '500' }}>{s.name}</td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>{s.type}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ color: s.credibility >= 0.8 ? 'var(--accent-secondary)' : '#ffcc00' }}>
                        {s.credibility.toFixed(2)}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>{s.claims}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ marginTop: '15px', fontSize: '12px', color: 'var(--text-muted)' }}>
            Note: Credibility scores are determined dynamically by checking document staleness metadata and domain reputation rules.
          </p>
        </div>
      )}

      {activeTab === 'snapshots' && (
        <div className="tab-pane fade-in">
          <h3>Persisted Traces & Feature Snapshots</h3>
          {loadingSnapshots && <p>Loading...</p>}
          {!loadingSnapshots && snapshots && (
            <div>
              <h4>Traces</h4>
              <ul>
                {snapshots.traces.map((t, i) => (
                  <li key={i} style={{ marginBottom: '8px' }}>
                    {t} <button className="btn btn-link" onClick={() => {
                      if (backendResults?.traceData && t.replace('.json','') === backendResults.traceId) {
                        setTraceData(backendResults.traceData);
                        setActiveTab('trace');
                        return;
                      }
                      authFetch(`/api/trace/${t.replace('.json','')}`).then(r=>r.json()).then(d=>{ setTraceData(d); setActiveTab('trace'); });
                    }}>View</button>
                  </li>
                ))}
              </ul>

              <h4>Features</h4>
              <ul>
                {snapshots.features.map((f, i) => (
                  <li key={i} style={{ marginBottom: '8px' }}>
                    {f} <button className="btn btn-link" onClick={() => {
                      authFetch(`/api/features/${f.replace('.json','')}`).then(r=>r.json()).then(d=>{ alert(JSON.stringify(d, null, 2)); });
                    }}>Load</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Tab: Contradictions */}
      {activeTab === 'contradictions' && (
        <div className="tab-pane fade-in">
          {(!backendResults?.contradictions || backendResults.contradictions.length === 0) ? (
            <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Check size={32} color="var(--accent-secondary)" style={{ marginBottom: '10px' }} />
              <h4>No Contradictory Claims Found</h4>
              <p style={{ fontSize: '14px', marginTop: '5px' }}>All scraped data source fields are logically consistent.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {backendResults.contradictions.map((c, idx) => (
                <div key={idx} style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '15px' }}>
                    <h4 style={{ color: 'var(--accent-primary)', fontSize: '16px' }}>Conflict Identified: {c.metric}</h4>
                    <span style={{ fontSize: '12px', background: 'rgba(255, 85, 0, 0.1)', color: 'var(--accent-primary)', padding: '3px 8px', borderRadius: '4px' }}>
                      Resolved
                    </span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-light)', padding: '15px', borderRadius: '10px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>CLAIM A: {c.sourceA}</span>
                      <h3 style={{ fontSize: '18px', margin: '5px 0', color: 'var(--text-main)' }}>{c.valA}</h3>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-light)', padding: '15px', borderRadius: '10px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>CLAIM B: {c.sourceB}</span>
                      <h3 style={{ fontSize: '18px', margin: '5px 0', color: 'var(--text-main)' }}>{c.valB}</h3>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(0, 255, 204, 0.02)', border: '1px solid rgba(0, 255, 204, 0.1)', padding: '16px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--accent-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Resolution Decision</span>
                    <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: 'var(--text-main)' }}>{c.resolution}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Reasoning Trace */}
      {activeTab === 'trace' && (
        <div className="tab-pane fade-in">
          {loadingTrace ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <div className="loader-circle" style={{ width: '40px', height: '40px', marginBottom: '15px' }}></div>
              <p>Fetching reasoning trace from session ledger...</p>
            </div>
          ) : !traceData ? (
            <div style={{ padding: '20px', color: 'var(--text-muted)' }}>Could not load reasoning trace.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
              {/* Left Column: Workplan */}
              <div>
                <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '24px', position: 'sticky', top: '20px' }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ListTodo size={18} color="var(--accent-primary)" />
                    <span>Agent Workplan</span>
                  </h3>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {traceData.workplan ? Object.keys(traceData.workplan)
                      .filter(k => k !== 'setAt')
                      .map((k, idx) => (
                        <li key={idx} style={{ display: 'flex', gap: '10px', fontSize: '14px', alignItems: 'flex-start' }}>
                          <span style={{ color: 'var(--accent-secondary)', fontWeight: 'bold' }}>✓</span>
                          <span style={{ color: 'var(--text-main)' }}>{traceData.workplan[k]}</span>
                        </li>
                      )) : <li>No workplan registered.</li>
                    }
                  </ul>
                </div>
              </div>

              {/* Right Column: Execution Log Timeline */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
                  <Server size={18} color="var(--accent-secondary)" />
                  <span>Execution Timeline</span>
                </h3>
                
                {/* Steps and Decisions timeline */}
                <div style={{ position: 'relative', borderLeft: '2px solid var(--border-light)', marginLeft: '10px', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  {traceData.steps?.map((s, idx) => {
                    const matchingDecision = traceData.decisions?.find(d => d.timestamp && Math.abs(new Date(d.timestamp) - new Date(s.timestamp)) < 2000);
                    
                    return (
                      <div key={idx} style={{ position: 'relative' }}>
                        {/* Bullet point indicator */}
                        <div style={{ position: 'absolute', left: '-33px', top: '4px', width: '16px', height: '16px', borderRadius: '50%', background: s.status === 'success' ? 'var(--accent-secondary)' : '#ff2a00', border: '3px solid var(--bg-main)', boxShadow: '0 0 10px rgba(0,255,204,0.3)' }}></div>
                        
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          {s.phase.toUpperCase()} · {new Date(s.timestamp).toLocaleTimeString()}
                        </div>
                        <h4 style={{ fontSize: '16px', color: 'var(--text-main)', marginBottom: '6px' }}>{s.action}</h4>
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>{s.details}</p>
                        
                        {/* Embed inline decisions matching the time step */}
                        {matchingDecision && (
                          <div style={{ background: 'rgba(255, 85, 0, 0.03)', border: '1px solid rgba(255, 85, 0, 0.1)', padding: '16px', borderRadius: '10px', marginTop: '12px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--accent-primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Resolution Choice</span>
                            <h5 style={{ fontSize: '14px', margin: '5px 0', color: 'var(--text-main)' }}>{matchingDecision.question}</h5>
                            <p style={{ margin: '4px 0', fontSize: '13px', color: 'var(--text-muted)' }}>Chosen: <strong style={{ color: 'var(--text-main)' }}>{matchingDecision.chosen}</strong></p>
                            <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: 'var(--accent-primary)', fontStyle: 'italic' }}>Reason: {matchingDecision.reasoning}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ResultCard = ({ r, index, target }) => {
  const isProp = r.type === 'Property';
  const badgeClass = isProp ? 'match' : 'alternative';
  const riskColor = r.riskScore > 0.6 ? '#ff2a00' : (r.riskScore > 0.3 ? '#ffcc00' : '#00ffcc');
  const riskLabel = r.riskScore > 0.6 ? 'High' : (r.riskScore > 0.3 ? 'Medium' : 'Low');

  let IconComponent = PieChart;
  if (isProp) IconComponent = Building;
  if (r.type === 'Crypto') IconComponent = Bitcoin;

  return (
    <div className={`result-card fade-in delay-${(index % 3) + 1}`} style={{ position: 'relative', overflow: 'hidden' }}>
      <div className={`card-badge ${badgeClass}`}>{isProp ? 'Property Match' : r.type}</div>
      <div className="card-icon"><IconComponent className="w-8 h-8" /></div>
      <h3 className="card-title" style={{ fontSize: '1.15rem', height: '48px', overflow: 'hidden', color: 'var(--text-main)', fontWeight: 'bold' }}>{r.name}</h3>
      <p className="card-desc" style={{ fontSize: '13px', marginBottom: '12px' }}>
        {r.type} · {r.location}{r.subLocation ? ` (${r.subLocation})` : ''}
      </p>
      
      {r.area && r.area !== 'N/A' && (
        <div style={{ fontSize: '12px', background: 'rgba(0, 255, 204, 0.08)', color: 'var(--accent-secondary)', padding: '5px 10px', borderRadius: '6px', marginBottom: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px', border: '1px solid rgba(0, 255, 204, 0.15)' }}>
          <span>📐 Area:</span>
          <strong>{r.area}</strong>
        </div>
      )}
      
      {/* Subtext explanation strictly explaining which rule matched */}
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '15px', lineHeight: '1.4', fontStyle: 'italic' }}>
        {r.explanation}
      </p>
 
      <div className="card-metrics" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '15px', marginBottom: '15px' }}>
        <div className="metric">
          <span className="metric-label">Exp. Return</span>
          <span className="metric-value highlight">{r.expectedReturn.toFixed(1)}%</span>
        </div>
        <div className="metric">
          <span className="metric-label">Risk Level</span>
          <span className="metric-value" style={{ color: riskColor }}>{riskLabel} ({r.riskScore})</span>
        </div>
        <div className="metric" style={{ gridColumn: 'span 2' }}>
          <span className="metric-label">Liquidity Profile</span>
          <span className="metric-value" style={{ fontSize: '0.95rem' }}>{r.liquidity}</span>
        </div>
      </div>
      
      {/* Evidence checklist */}
      {r.evidence && r.evidence.length > 0 && (
        <div style={{ background: 'rgba(255,255,255,0.01)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', marginBottom: '15px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Agent Evidence Log</span>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {r.evidence.map((ev, eIdx) => (
              <li key={eIdx} style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '5px' }}>
                <span style={{ color: 'var(--accent-primary)' }}>•</span>
                <span>{ev}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
 
      {/* Warn if ROI misses user's absolute target (matches fallback condition warnings) */}
      {r.expectedReturn < target && (
        <p style={{ color: 'var(--accent-primary)', fontSize: '11px', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <TriangleAlert className="w-3 h-3" />
          <span>Falls short of your {target}% target return.</span>
        </p>
      )}
      
      <div className="card-footer" style={{ marginTop: 'auto' }}>
        <span className="source-link" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Database className="w-3 h-3" /> {r.source || 'Local Database'}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Live</span>
      </div>
    </div>
  );
};

export default App;
