"import React from 'react';
import { ArrowRight, TrendingUp, TrendingDown, Target, Shield, Clock } from 'lucide-react';
import './BeforeAfterViz.css';

const BeforeAfterViz = ({ results }) => {
  if (!results || !results.recommendations || results.recommendations.length === 0) return null;

  const topRec = results.recommendations[0];
  
  return (
    <div className="before-after-viz">
      <div className="state-card before-state">
        <div className="state-header">
          <Clock size={20} />
          <h3>Before Analysis</h3>
        </div>
        <div className="state-content">
          <div className="state-metric">
            <span className="label">Strategy</span>
            <span className="value muted">Generic / Uniformed</span>
          </div>
          <div className="state-metric">
            <span className="label">Expected Return</span>
            <span className="value muted">Unknown</span>
          </div>
          <div className="state-metric">
            <span className="label">Risk Exposure</span>
            <span className="value muted">Unquantified</span>
          </div>
          <div className="state-metric">
            <span className="label">Data Confidence</span>
            <span className="value muted">Low</span>
          </div>
        </div>
      </div>

      <div className="transition-arrow">
        <ArrowRight size={24} />
      </div>

      <div className="state-card after-state">
        <div className="state-header">
          <Target size={20} />
          <h3>After Analysis</h3>
        </div>
        <div className="state-content">
          <div className="state-metric">
            <span className="label">Strategy</span>
            <span className="value positive">Data-Driven ({topRec.type})</span>
          </div>
          <div className="state-metric">
            <span className="label">Expected Return</span>
            <span className="value 
<truncated 762 bytes>