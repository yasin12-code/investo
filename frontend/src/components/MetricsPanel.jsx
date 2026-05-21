"import React from 'react';
import { Database, AlertTriangle, Zap, Clock, ShieldCheck, Filter } from 'lucide-react';
import './MetricsPanel.css';

const MetricsPanel = ({ metrics }) => {
  if (!metrics) return null;

  return (
    <div className="metrics-panel">
      <div className="metric-card">
        <div className="metric-icon blue"><Database size={20} /></div>
        <div className="metric-info">
          <span className="metric-label">Sources Processed</span>
          <span className="metric-value">{metrics.sourcesProcessed}</span>
        </div>
      </div>
      
      <div className="metric-card">
        <div className="metric-icon yellow"><AlertTriangle size={20} /></div>
        <div className="metric-info">
          <span className="metric-label">Contradictions Found</span>
          <span className="metric-value">{metrics.contradictionsFound}</span>
        </div>
      </div>
      
      <div className="metric-card">
        <div className="metric-icon purple"><Zap size={20} /></div>
        <div className="metric-info">
          <span className="metric-label">Actions Simulated</span>
          <span className="metric-value">{metrics.actionsSimulated}</span>
        </div>
      </div>
      
      <div className="metric-card">
        <div className="metric-icon indigo"><Clock size={20} /></div>
        <div className="metric-info">
          <span className="metric-label">Analysis Time</span>
          <span className="metric-value">{metrics.analysisTimeMs} ms</span>
        </div>
      </div>
      
      <div className="metric-card">
        <div className="metric-icon green"><ShieldCheck size={20} /></div>
        <div className="metric-info">
          <span className="metric-label">Confidence Score</span>
          <span className="metric-value">{Math.round(metrics.confidenceScore * 100)}%</span>
        </div>
      </div>
      
      <div className="metric-card">
        <div
<truncated 325 bytes>