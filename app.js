// Investo App Logic

const state = {
    screen: 'landing', // landing, onboarding, analyzing, results
    profile: {
        location: 'Karachi',
        budget: 5000000,
        targetReturn: 12,
        horizon: 'Medium (1-5y)',
        risk: 'Medium'
    },
    results: []
};

// Mock Market Data (from "scrapers")
const marketData = {
    property: [
        { title: "DHA Phase 8 Plot", type: "Property", location: "Karachi", return: 9.5, risk: "Medium", liquidity: "Low (6+ months)", source: "Zameen.com", url: "#" },
        { title: "Bahria Town Villa", type: "Property", location: "Lahore", return: 8.5, risk: "Low", liquidity: "Medium (3-6 months)", source: "Zameen.com", url: "#" },
        { title: "Blue Area Commercial", type: "Property", location: "Islamabad", return: 11.2, risk: "Medium", liquidity: "Low (6+ months)", source: "Zameen.com", url: "#" }
    ],
    alternatives: [
        { title: "Dolmen City REIT", type: "REIT", location: "National", return: 10.8, risk: "Low", liquidity: "High (Days)", source: "PSX", url: "#" },
        { title: "Meezan Islamic Fund", type: "Mutual Fund", location: "National", return: 13.5, risk: "Medium", liquidity: "High (Days)", source: "Al Meezan", url: "#" },
        { title: "NBP Govt Securities", type: "Bonds", location: "National", return: 9.0, risk: "Low", liquidity: "High (Days)", source: "SBP", url: "#" },
        { title: "Bitcoin / Ethereum", type: "Crypto", location: "Global", return: 25.0, risk: "High", liquidity: "High (Minutes)", source: "CoinGecko", url: "#" }
    ]
};

// Main render function
function render() {
    const app = document.getElementById('app');
    app.innerHTML = '';
    
    switch(state.screen) {
        case 'landing':
            app.appendChild(renderLanding());
            break;
        case 'onboarding':
            app.appendChild(renderOnboarding());
            break;
        case 'analyzing':
            app.appendChild(renderAnalyzing());
            break;
        case 'results':
            app.appendChild(renderResults());
            break;
    }
}

// 1. Landing Screen
function renderLanding() {
    const div = document.createElement('div');
    div.className = 'screen centered fade-in';
    div.innerHTML = `
        <h1 class="hero-title">Investo</h1>
        <p class="hero-subtitle delay-1">Your personal investment advisor. We analyze live market data to find the best property or alternative assets tailored to your goals.</p>
        <button class="btn btn-primary delay-2" onclick="setScreen('onboarding')">
            Get Started <i class="fa-solid fa-arrow-right"></i>
        </button>
    `;
    return div;
}

// 2. Onboarding Screen
function renderOnboarding() {
    const div = document.createElement('div');
    div.className = 'screen fade-in';
    div.innerHTML = `
        <div class="form-card">
            <h2 style="margin-bottom: 30px; text-align: center;">Investment Profile</h2>
            
            <div class="form-group delay-1">
                <label class="form-label">Location</label>
                <select id="loc" class="form-control" onchange="updateProfile('location', this.value)">
                    <option value="Karachi" ${state.profile.location === 'Karachi' ? 'selected' : ''}>Karachi</option>
                    <option value="Lahore" ${state.profile.location === 'Lahore' ? 'selected' : ''}>Lahore</option>
                    <option value="Islamabad" ${state.profile.location === 'Islamabad' ? 'selected' : ''}>Islamabad</option>
                </select>
            </div>

            <div class="form-group delay-1">
                <label class="form-label">Budget (PKR) <span style="float:right; color:var(--accent-primary);" id="budget-disp">${Number(state.profile.budget).toLocaleString()} PKR</span></label>
                <div class="range-wrapper">
                    <input type="range" min="1000000" max="100000000" step="1000000" value="${state.profile.budget}" 
                        oninput="document.getElementById('budget-disp').innerText = Number(this.value).toLocaleString() + ' PKR'; updateProfile('budget', this.value)">
                </div>
            </div>

            <div class="form-group delay-2">
                <label class="form-label">Target Annual Return (%) <span style="float:right; color:var(--accent-primary);" id="ret-disp">${state.profile.targetReturn}%</span></label>
                <div class="range-wrapper">
                    <input type="range" min="5" max="30" step="1" value="${state.profile.targetReturn}" 
                        oninput="document.getElementById('ret-disp').innerText = this.value + '%'; updateProfile('targetReturn', this.value)">
                </div>
            </div>

            <div class="form-group delay-3">
                <label class="form-label">Risk Tolerance</label>
                <select id="risk" class="form-control" onchange="updateProfile('risk', this.value)">
                    <option value="Low" ${state.profile.risk === 'Low' ? 'selected' : ''}>Low (Preserve capital)</option>
                    <option value="Medium" ${state.profile.risk === 'Medium' ? 'selected' : ''}>Medium (Balanced)</option>
                    <option value="High" ${state.profile.risk === 'High' ? 'selected' : ''}>High (Maximize returns)</option>
                </select>
            </div>

            <div class="text-center mt-4 delay-3">
                <button class="btn btn-primary" style="width: 100%;" onclick="startAnalysis()">
                    Analyze Market <i class="fa-solid fa-chart-line"></i>
                </button>
            </div>
        </div>
    `;
    return div;
}

// 3. Analyzing Screen
function renderAnalyzing() {
    const div = document.createElement('div');
    div.className = 'screen centered fade-in';
    div.innerHTML = `
        <div class="analyzing-container">
            <div class="loader-circle"></div>
            <h2 style="margin-bottom: 10px;">Analyzing Market</h2>
            <p style="color: var(--text-muted); margin-bottom: 20px;">Orchestrating scrapers & evaluating options...</p>
            
            <ul class="step-list">
                <li class="step-item" id="step-1">
                    <div class="step-icon"><i class="fa-solid fa-location-crosshairs"></i></div>
                    Fetching ${state.profile.location} Property Data
                </li>
                <li class="step-item" id="step-2">
                    <div class="step-icon"><i class="fa-solid fa-chart-pie"></i></div>
                    Scraping PSX, REITs & Funds
                </li>
                <li class="step-item" id="step-3">
                    <div class="step-icon"><i class="fa-solid fa-server"></i></div>
                    Normalizing & Scoring Options
                </li>
            </ul>
        </div>
    `;
    
    // Simulate progression
    setTimeout(() => activateStep(1), 500);
    setTimeout(() => activateStep(2), 2000);
    setTimeout(() => activateStep(3), 3500);
    setTimeout(() => {
        calculateResults();
        setScreen('results');
    }, 5500);
    
    return div;
}

function activateStep(num) {
    if(num > 1) {
        const prev = document.getElementById(`step-${num-1}`);
        if(prev) {
            prev.classList.remove('active');
            prev.classList.add('done');
            prev.querySelector('i').className = 'fa-solid fa-check';
        }
    }
    const curr = document.getElementById(`step-${num}`);
    if(curr) curr.classList.add('active');
}

// 4. Logic & Results
function calculateResults() {
    let results = [];
    const target = parseFloat(state.profile.targetReturn);
    const budget = parseFloat(state.profile.budget);
    
    // PRD Rule: Filter local property
    const localProp = marketData.property.find(p => p.location === state.profile.location);
    
    // Fallback/Decision Rule: 
    // If property ROI >= user's target return AND risk is acceptable, recommend property.
    // If property fails threshold, recommend alternatives.
    let propertyRecommended = false;
    
    if (localProp && budget >= 2000000) {
        if (localProp.return >= target - 2) { // Allow slight buffer
            results.push({...localProp, matchScore: 95, badge: "Best Property Match"});
            propertyRecommended = true;
        } else {
            results.push({...localProp, matchScore: 60, badge: "Falls Short", warning: `Return (${localProp.return}%) misses your ${target}% target.`});
        }
    }

    // Add alternatives based on risk & return
    marketData.alternatives.forEach(alt => {
        let score = 0;
        
        // Return matching
        if (alt.return >= target) score += 40;
        else if (alt.return >= target - 2) score += 20;
        
        // Risk matching
        if (alt.risk === state.profile.risk) score += 30;
        else if (state.profile.risk === 'High') score += 15; // High risk accepts anything
        
        // Liquidity bonus
        score += 20;
        
        // Budget check (funds/crypto usually allow small amounts)
        if (budget < 2000000 && alt.type === "Property") return; 
        
        if (score >= 50 || (!propertyRecommended && score >= 30)) {
            let badgeStr = score >= 80 ? "Top Alternative" : "Alternative";
            if (alt.type === 'Crypto' && state.profile.risk !== 'High') {
                badgeStr = "High Risk Warning";
            }
            results.push({...alt, matchScore: score, badge: badgeStr});
        }
    });
    
    // Sort by match score
    results.sort((a, b) => b.matchScore - a.matchScore);
    state.results = results.slice(0, 4); // Top 4 recommendations
}

function renderResults() {
    const div = document.createElement('div');
    div.className = 'screen fade-in';
    
    const target = state.profile.targetReturn;
    const propRecommended = state.results.some(r => r.type === 'Property' && r.matchScore > 80);
    
    let insightHtml = '';
    if (!propRecommended && state.profile.budget < 2000000) {
        insightHtml = `
            <div class="insight-box delay-1">
                <div class="insight-icon"><i class="fa-solid fa-lightbulb"></i></div>
                <div class="insight-text">
                    <h4>Budget Adjustment</h4>
                    <p>Property in ${state.profile.location} typically requires >2M PKR. We've prioritized high-yield alternatives that accept smaller initial investments.</p>
                </div>
            </div>`;
    } else if (!propRecommended) {
        insightHtml = `
            <div class="insight-box delay-1">
                <div class="insight-icon"><i class="fa-solid fa-code-branch"></i></div>
                <div class="insight-text">
                    <h4>Strategy Pivot</h4>
                    <p>Real estate in ${state.profile.location} currently yields ~8-11%. Since you targeted ${target}%, we strongly recommend REITs or Mutual Funds to hit your goals.</p>
                </div>
            </div>`;
    }

    let cardsHtml = state.results.map((r, i) => {
        const isProp = r.type === 'Property';
        const icon = isProp ? 'fa-building' : (r.type === 'Crypto' ? 'fa-bitcoin' : 'fa-chart-pie');
        const badgeClass = isProp ? 'match' : 'alternative';
        const riskColor = r.risk === 'High' ? 'color:#ff2a00;' : (r.risk === 'Medium' ? 'color:#ffcc00;' : 'color:#00ffcc;');
        
        return `
        <div class="result-card delay-${(i%3)+1}">
            <div class="card-badge ${badgeClass}">${r.badge}</div>
            <div class="card-icon"><i class="fa-solid ${icon}"></i></div>
            <h3 class="card-title">${r.title}</h3>
            <p class="card-desc">${r.type} · ${r.location}</p>
            
            <div class="card-metrics">
                <div class="metric">
                    <span class="metric-label">Exp. Return</span>
                    <span class="metric-value highlight">${r.return}%</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Risk Level</span>
                    <span class="metric-value" style="${riskColor}">${r.risk}</span>
                </div>
                <div class="metric" style="grid-column: span 2;">
                    <span class="metric-label">Liquidity</span>
                    <span class="metric-value" style="font-size:1rem;">${r.liquidity}</span>
                </div>
            </div>
            
            ${r.warning ? `<p style="color:var(--accent-primary); font-size:12px; margin-bottom:15px;"><i class="fa-solid fa-triangle-exclamation"></i> ${r.warning}</p>` : ''}
            
            <div class="card-footer">
                <a href="${r.url}" class="source-link" onclick="event.preventDefault()">
                    <i class="fa-solid fa-database"></i> Source: ${r.source}
                </a>
                <span style="font-size:11px; color:var(--text-muted);">Updated 5m ago</span>
            </div>
        </div>
        `;
    }).join('');

    div.innerHTML = `
        <div class="results-header">
            <div>
                <h2 class="results-title">Your Recommendations</h2>
                <div class="results-meta">
                    <span><i class="fa-solid fa-location-dot"></i> ${state.profile.location}</span>
                    <span><i class="fa-solid fa-wallet"></i> ${(state.profile.budget/1000000).toFixed(1)}M PKR</span>
                    <span><i class="fa-solid fa-bullseye"></i> ${target}% Target</span>
                </div>
            </div>
            <button class="btn btn-outline" onclick="setScreen('onboarding')">
                <i class="fa-solid fa-sliders"></i> Edit Profile
            </button>
        </div>
        
        ${insightHtml}
        
        <div class="cards-grid">
            ${cardsHtml}
        </div>
    `;
    
    return div;
}

// Helpers
function setScreen(s) {
    state.screen = s;
    render();
}

function updateProfile(key, val) {
    state.profile[key] = val;
}

function startAnalysis() {
    setScreen('analyzing');
}

// Init
window.onload = render;
