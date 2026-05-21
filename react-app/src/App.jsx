import { useState, useEffect } from 'react';
import { 
  ArrowRight, LineChart, Target, Wallet, MapPin,
  Check, Building, Bitcoin, PieChart, Info, Database, TriangleAlert
} from 'lucide-react';
import './index.css';

// Mock Market Data (from PRD)
const marketData = {
    property: [
        { id: 'p1', title: "DHA Phase 8 Plot", type: "Property", location: "Karachi", return: 9.5, risk: "Medium", liquidity: "Low (6+ months)", source: "Zameen.com", url: "#" },
        { id: 'p2', title: "Bahria Town Villa", type: "Property", location: "Lahore", return: 8.5, risk: "Low", liquidity: "Medium (3-6 months)", source: "Zameen.com", url: "#" },
        { id: 'p3', title: "Blue Area Commercial", type: "Property", location: "Islamabad", return: 11.2, risk: "Medium", liquidity: "Low (6+ months)", source: "Zameen.com", url: "#" }
    ],
    alternatives: [
        { id: 'a1', title: "Dolmen City REIT", type: "REIT", location: "National", return: 10.8, risk: "Low", liquidity: "High (Days)", source: "PSX", url: "#" },
        { id: 'a2', title: "Meezan Islamic Fund", type: "Mutual Fund", location: "National", return: 13.5, risk: "Medium", liquidity: "High (Days)", source: "Al Meezan", url: "#" },
        { id: 'a3', title: "NBP Govt Securities", type: "Bonds", location: "National", return: 9.0, risk: "Low", liquidity: "High (Days)", source: "SBP", url: "#" },
        { id: 'a4', title: "Bitcoin / Ethereum", type: "Crypto", location: "Global", return: 25.0, risk: "High", liquidity: "High (Minutes)", source: "CoinGecko", url: "#" }
    ]
};

function App() {
  const [screen, setScreen] = useState('landing');
  const [profile, setProfile] = useState({
    location: 'Karachi',
    budget: 5000000,
    targetReturn: 12,
    horizon: 'Medium (1-5y)',
    risk: 'Medium'
  });
  const [results, setResults] = useState([]);

  // Deterministic Scoring Engine
  const calculateResults = () => {
    let newResults = [];
    const target = parseFloat(profile.targetReturn);
    const budget = parseFloat(profile.budget);
    
    const localProp = marketData.property.find(p => p.location === profile.location);
    let propertyRecommended = false;
    
    if (localProp && budget >= 2000000) {
        if (localProp.return >= target - 2) { 
            newResults.push({...localProp, matchScore: 95, badge: "Best Property Match"});
            propertyRecommended = true;
        } else {
            newResults.push({...localProp, matchScore: 60, badge: "Falls Short", warning: `Return (${localProp.return}%) misses your ${target}% target.`});
        }
    }

    marketData.alternatives.forEach(alt => {
        let score = 0;
        if (alt.return >= target) score += 40;
        else if (alt.return >= target - 2) score += 20;
        
        if (alt.risk === profile.risk) score += 30;
        else if (profile.risk === 'High') score += 15;
        
        score += 20; // Liquidity
        if (budget < 2000000 && alt.type === "Property") return; 
        
        if (score >= 50 || (!propertyRecommended && score >= 30)) {
            let badgeStr = score >= 80 ? "Top Alternative" : "Alternative";
            if (alt.type === 'Crypto' && profile.risk !== 'High') badgeStr = "High Risk Warning";
            newResults.push({...alt, matchScore: score, badge: badgeStr});
        }
    });
    
    newResults.sort((a, b) => b.matchScore - a.matchScore);
    setResults(newResults.slice(0, 4));
  };

  const updateProfile = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const startAnalysis = () => {
    setScreen('analyzing');
    setTimeout(() => {
      calculateResults();
      setScreen('results');
    }, 4500); // Wait 4.5s for analysis animation
  };

  return (
    <div className="app-container">
      {screen === 'landing' && <LandingScreen onStart={() => setScreen('onboarding')} />}
      {screen === 'onboarding' && <OnboardingScreen profile={profile} updateProfile={updateProfile} onAnalyze={startAnalysis} />}
      {screen === 'analyzing' && <AnalyzingScreen profile={profile} />}
      {screen === 'results' && <ResultsScreen profile={profile} results={results} onEdit={() => setScreen('onboarding')} />}
    </div>
  );
}

const LandingScreen = ({ onStart }) => (
  <div className="screen centered fade-in">
    <h1 className="hero-title">Investo</h1>
    <p className="hero-subtitle delay-1">
      Your personal investment advisor. We analyze live market data to find the best property or alternative assets tailored to your goals.
    </p>
    <button className="btn btn-primary delay-2" onClick={onStart}>
      Get Started <ArrowRight className="w-5 h-5 ml-2" />
    </button>
  </div>
);

const OnboardingScreen = ({ profile, updateProfile, onAnalyze }) => (
  <div className="screen fade-in">
    <div className="form-card">
      <h2 style={{ marginBottom: '30px', textAlign: 'center' }}>Investment Profile</h2>
      
      <div className="form-group delay-1">
        <label className="form-label">Location</label>
        <select className="form-control" value={profile.location} onChange={(e) => updateProfile('location', e.target.value)}>
          <option value="Karachi">Karachi</option>
          <option value="Lahore">Lahore</option>
          <option value="Islamabad">Islamabad</option>
        </select>
      </div>

      <div className="form-group delay-1">
        <label className="form-label">
          Budget (PKR) <span style={{ float: 'right', color: 'var(--accent-primary)' }}>{Number(profile.budget).toLocaleString()} PKR</span>
        </label>
        <div className="range-wrapper">
          <input type="range" min="1000000" max="100000000" step="1000000" value={profile.budget} onChange={(e) => updateProfile('budget', e.target.value)} />
        </div>
      </div>

      <div className="form-group delay-2">
        <label className="form-label">
          Target Annual Return (%) <span style={{ float: 'right', color: 'var(--accent-primary)' }}>{profile.targetReturn}%</span>
        </label>
        <div className="range-wrapper">
          <input type="range" min="5" max="30" step="1" value={profile.targetReturn} onChange={(e) => updateProfile('targetReturn', e.target.value)} />
        </div>
      </div>

      <div className="form-group delay-3">
        <label className="form-label">Risk Tolerance</label>
        <select className="form-control" value={profile.risk} onChange={(e) => updateProfile('risk', e.target.value)}>
          <option value="Low">Low (Preserve capital)</option>
          <option value="Medium">Medium (Balanced)</option>
          <option value="High">High (Maximize returns)</option>
        </select>
      </div>

      <div className="text-center mt-4 delay-3">
        <button className="btn btn-primary w-full" style={{ width: '100%' }} onClick={onAnalyze}>
          Analyze Market <LineChart className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  </div>
);

const AnalyzingScreen = ({ profile }) => {
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    const t1 = setTimeout(() => setActiveStep(2), 1500);
    const t2 = setTimeout(() => setActiveStep(3), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="screen centered fade-in">
      <div className="analyzing-container">
        <div className="loader-circle"></div>
        <h2 style={{ marginBottom: '10px' }}>Analyzing Market</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Orchestrating scrapers & evaluating options...</p>
        
        <ul className="step-list">
          <StepItem active={activeStep >= 1} done={activeStep > 1} text={`Fetching ${profile.location} Property Data`} icon={<MapPin />} />
          <StepItem active={activeStep >= 2} done={activeStep > 2} text="Scraping PSX, REITs & Funds" icon={<PieChart />} />
          <StepItem active={activeStep >= 3} done={activeStep > 3} text="Normalizing & Scoring Options" icon={<Database />} />
        </ul>
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
      {text}
    </li>
  );
};

const ResultsScreen = ({ profile, results, onEdit }) => {
  const target = profile.targetReturn;
  const propRecommended = results.some(r => r.type === 'Property' && r.matchScore > 80);
  
  return (
    <div className="screen fade-in">
      <div className="results-header">
        <div>
          <h2 className="results-title">Your Recommendations</h2>
          <div className="results-meta">
            <span><MapPin className="w-4 h-4 text-accent" /> {profile.location}</span>
            <span><Wallet className="w-4 h-4 text-accent" /> {(profile.budget/1000000).toFixed(1)}M PKR</span>
            <span><Target className="w-4 h-4 text-accent" /> {target}% Target</span>
          </div>
        </div>
        <button className="btn btn-outline" onClick={onEdit}>
          Edit Profile
        </button>
      </div>

      {!propRecommended && profile.budget < 2000000 && (
        <div className="insight-box delay-1">
          <div className="insight-icon"><Info className="w-5 h-5" /></div>
          <div className="insight-text">
            <h4>Budget Adjustment</h4>
            <p>Property in {profile.location} typically requires &gt;2M PKR. We've prioritized high-yield alternatives that accept smaller initial investments.</p>
          </div>
        </div>
      )}
      
      {!propRecommended && profile.budget >= 2000000 && (
        <div className="insight-box delay-1">
          <div className="insight-icon"><Info className="w-5 h-5" /></div>
          <div className="insight-text">
            <h4>Strategy Pivot</h4>
            <p>Real estate in {profile.location} yields ~8.5-11%. Since you targeted {target}%, we strongly recommend alternative channels to hit your goals.</p>
          </div>
        </div>
      )}

      <div className="cards-grid">
        {results.map((r, i) => (
          <ResultCard key={r.id} r={r} index={i} />
        ))}
      </div>
    </div>
  );
};

const ResultCard = ({ r, index }) => {
  const isProp = r.type === 'Property';
  const badgeClass = isProp ? 'match' : 'alternative';
  const riskColor = r.risk === 'High' ? '#ff2a00' : (r.risk === 'Medium' ? '#ffcc00' : '#00ffcc');
  
  let IconComponent = PieChart;
  if (isProp) IconComponent = Building;
  if (r.type === 'Crypto') IconComponent = Bitcoin;

  return (
    <div className={`result-card delay-${(index % 3) + 1}`}>
      <div className={`card-badge ${badgeClass}`}>{r.badge}</div>
      <div className="card-icon"><IconComponent className="w-8 h-8" /></div>
      <h3 className="card-title">{r.title}</h3>
      <p className="card-desc">{r.type} · {r.location}</p>
      
      <div className="card-metrics">
        <div className="metric">
          <span className="metric-label">Exp. Return</span>
          <span className="metric-value highlight">{r.return}%</span>
        </div>
        <div className="metric">
          <span className="metric-label">Risk Level</span>
          <span className="metric-value" style={{ color: riskColor }}>{r.risk}</span>
        </div>
        <div className="metric" style={{ gridColumn: 'span 2' }}>
          <span className="metric-label">Liquidity</span>
          <span className="metric-value" style={{ fontSize: '1rem' }}>{r.liquidity}</span>
        </div>
      </div>
      
      {r.warning && (
        <p style={{ color: 'var(--accent-primary)', fontSize: '12px', marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
          <TriangleAlert className="w-3 h-3 mr-1" /> {r.warning}
        </p>
      )}
      
      <div className="card-footer">
        <a href={r.url} className="source-link" onClick={e => e.preventDefault()}>
          <Database className="w-3 h-3" /> Source: {r.source}
        </a>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Updated 5m ago</span>
      </div>
    </div>
  );
};

export default App;
