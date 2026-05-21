import React from 'react';
import { AlertTriangle, ArrowRight, Shield, Scale } from 'lucide-react';
import { getCredibilityColor } from '../utils/formatters';
import './ContradictionPanel.css';

const METHOD_ICONS = {
  'credibility-weighted': Scale,
  'authority-priority': Shield,
  'recency-adjusted': ArrowRight,
};

const METHOD_LABELS = {
  'credibility-weighted': 'Credibility Weighted',
  'authority-priority': 'Authority Priority',
  'recency-adjusted': 'Recency Adjusted',
};

export default function ContradictionPanel({ contradictions }) {
  if (!contradictions || contradictions.length === 0) return null;

  return (
    <div className="contradiction-panel animate-fade-in-up">
      <div className="contradiction-header">
        <div className="contradiction-header-icon">
          <AlertTriangle size={18} />
        </div>
        <div>
          <h3>Data Contradictions Detected</h3>
          <p>{contradictions.length} conflicting data points found and resolved</p>
        </div>
      </div>

      <div className="contradiction-list">
        {contradictions.map((c, i) => (
          <div
            key={c.id}
            className="contradiction-item glass-card-static"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="contradiction-metric">{c.metric}</div>

            <div className="contradiction-sources">
              <div className="contradiction-source">
                <div className="source-label">Source A</div>
                <div className="source-detail">
                  <span className="source-ref">{c.sourceA.name}</span>
                  <span className="source-value">{c.sourceA.value}</span>
                  <span
                    className="credibility-dot"
                    style={{ background: getCredibilityColor(c.sourceA.credibility) }}
                    title={`Credibility: ${Math.round(c.sourceA.credibility * 100)}%`}
                  />
                </div>
              </div>

              <div className="vs-divider">VS</div>

              <div className="contradiction-source">
                <div className="source-label">Source B</div>
                <div className="source-detail">
                  <span className="source-ref">{c.sourceB.name}</span>
                  <span className="source-value">{c.sourceB.value}</span>
                  <span
                    className="credibility-dot"
                    style={{ background: getCredibilityColor(c.sourceB.credibility) }}
                    title={`Credibility: ${Math.round(c.sourceB.credibility * 100)}%`}
                  />
                </div>
              </div>
            </div>

            <div className="contradiction-resolution">
              <div className="resolution-header">
                {React.createElement(METHOD_ICONS[c.method] || Scale, { size: 14 })}
                <span className="resolution-method">{METHOD_LABELS[c.method] || c.method}</span>
              </div>
              <div className="resolution-text">{c.resolution}</div>
              <div className="confidence-row">
                <span className="confidence-label">Confidence</span>
                <div className="progress-bar" style={{ flex: 1 }}>
                  <div
                    className="progress-bar-fill success"
                    style={{ width: `${c.confidence * 100}%` }}
                  />
                </div>
                <span className="confidence-value">{Math.round(c.confidence * 100)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
