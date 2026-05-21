"import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, ShieldAlert, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { formatPercent, getRiskLabel } from '../utils/formatters';
import './RecommendationCard.css';

const RecommendationCard = ({ rank, rec }) => {
  const [expanded, setExpanded] = useState(false);
  const isGoodReturn = rec.expectedReturn > 14;

  return (
    <div className={`recommendation-card rank-${rank}`}>
      <div className="rec-header">
        <div className="rec-rank">{rank}</div>
        <div className="rec-title-area">
          <h3>{rec.name}</h3>
          <span className={`badge type-${rec.type.toLowerCase()}`}>{rec.type}</span>
        </div>
      </div>
      
      <div className="rec-metrics">
        <div className="metric primary">
          <span className="label">Expected Return</span>
          <div className={`value ${isGoodReturn ? 'positive' : 'negative'}`}>
            {formatPercent(rec.expectedReturn)}
            {isGoodReturn ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
          </div>
        </div>
        
        <div className="metric">
          <span className="label">Risk</span>
          <div className="value-with-icon">
            <ShieldAlert size={16} className={`risk-${getRiskLabel(rec.riskScore).toLowerCase()}`} />
            {getRiskLabel(rec.riskScore)}
          </div>
        </div>
        
        <div className="metric">
          <span className="label">Liquidity</span>
          <div className="value-with-icon">
            <Activity size={16} />
            {rec.liquidity > 0.7 ? 'High' : rec.liquidity > 0.4 ? 'Medium' : 'Low'}
          </div>
        </div>
      </div>
      
      <div className="rec-explanation">
        <p>{rec.explanation}</p>
      </div>
      
      <button className="expand-btn" onClick={() => setExpanded(!expanded)}>
        {expanded ? <><ChevronUp size={16} /> Hide Evidence</> 
<truncated 733 bytes>