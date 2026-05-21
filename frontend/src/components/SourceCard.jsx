import React from 'react';
import { FileText, Table, Globe, Rss, BarChart3, AlertTriangle } from 'lucide-react';
import { getCredibilityColor, getCredibilityLabel, formatDate } from '../utils/formatters';
import './SourceCard.css';

const TYPE_ICONS = {
  file: FileText,
  table: Table,
  globe: Globe,
  rss: Rss,
  chart: BarChart3,
};

const TYPE_LABELS = {
  file: 'Document',
  table: 'Dataset',
  globe: 'Web Source',
  rss: 'Live Feed',
  chart: 'Report',
};

export default function SourceCard({ source, index }) {
  const Icon = TYPE_ICONS[source.type] || FileText;
  const credColor = getCredibilityColor(source.credibility);
  const credLabel = getCredibilityLabel(source.credibility);
  const credPercent = Math.round(source.credibility * 100);

  return (
    <div
      className="source-card glass-card"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="source-card-header">
        <div className="source-icon" style={{ color: credColor }}>
          <Icon size={18} />
        </div>
        <div className="source-info">
          <h4 className="source-name">{source.name}</h4>
          <span className={`badge badge-${source.type === 'rss' ? 'info' : 'neutral'}`}>
            {TYPE_LABELS[source.type]}
          </span>
        </div>
      </div>

      <div className="source-metrics">
        <div className="source-metric">
          <span className="metric-label">Credibility</span>
          <div className="credibility-bar-wrapper">
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${credPercent}%`,
                  background: credColor,
                }}
              />
            </div>
            <span className="metric-value" style={{ color: credColor }}>
              {credLabel} ({credPercent}%)
            </span>
          </div>
        </div>

        <div className="source-metric-row">
          <div className="source-metric">
            <span className="metric-label">Claims Extracted</span>
            <span className="metric-value">{source.claims}</span>
          </div>
          <div className="source-metric">
            <span className="metric-label">Last Updated</span>
            <span className="metric-value">{formatDate(source.freshness)}</span>
          </div>
        </div>
      </div>

      {source.noisy && (
        <div className="noise-warning">
          <AlertTriangle size={12} />
          <span>Contains noise — filtered during analysis</span>
        </div>
      )}
    </div>
  );
}
