import React, { useState } from 'react';
import { Check, X, RotateCcw, Clock, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { formatDuration } from '../utils/formatters';
import './ActionChainViewer.css';

const STATUS_CONFIG = {
  pending: { color: 'var(--text-muted)', label: 'Pending', icon: Clock },
  running: { color: 'var(--accent-primary)', label: 'Running', icon: Zap },
  success: { color: 'var(--accent-success)', label: 'Success', icon: Check },
  failed: { color: 'var(--accent-danger)', label: 'Failed', icon: X },
  recovered: { color: 'var(--accent-warning)', label: 'Recovered', icon: RotateCcw },
};

export default function ActionChainViewer({ actions }) {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="action-chain-viewer animate-fade-in-up">
      <div className="chain-timeline">
        {actions.map((action, i) => (
          <ActionStep key={action.id} action={action} index={i} isLast={i === actions.length - 1} />
        ))}
      </div>
    </div>
  );
}

function ActionStep({ action, index, isLast }) {
  const [showBefore, setShowBefore] = useState(false);
  const [showAfter, setShowAfter] = useState(false);
  const config = STATUS_CONFIG[action.status] || STATUS_CONFIG.pending;
  const StatusIcon = config.icon;

  return (
    <div
      className={`action-step ${action.status}`}
      style={{ animationDelay: `${index * 0.12}s` }}
    >
      {/* Timeline Connector */}
      {!isLast && <div className="action-connector" />}

      {/* Step Number */}
      <div className="action-step-number" style={{ borderColor: config.color }}>
        <span>{action.step}</span>
      </div>

      {/* Content */}
      <div className="action-step-content glass-card-static">
        <div className="action-step-header">
          <div className="action-title-row">
            <h4 className="action-name">{action.name}</h4>
            <span className={`badge badge-${action.status === 'success' ? 'success' : action.status === 'recovered' ? 'warning' : action.status === 'failed' ? 'danger' : 'neutral'}`}>
              <StatusIcon size={10} />
              {config.label}
            </span>
          </div>
          <p className="action-description">{action.description}</p>
          <div className="action-meta">
            <Clock size={12} />
            <span>{formatDuration(action.duration)}</span>
          </div>
        </div>

        {/* Error & Recovery */}
        {action.error && (
          <div className="action-error">
            <X size={12} />
            <span>{action.error}</span>
          </div>
        )}
        {action.recovery && (
          <div className="action-recovery">
            <RotateCcw size={12} />
            <span>{action.recovery}</span>
          </div>
        )}

        {/* Collapsible States */}
        <div className="action-states">
          <button
            className="state-toggle"
            onClick={() => setShowBefore(!showBefore)}
          >
            {showBefore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>Before State</span>
          </button>
          {showBefore && (
            <pre className="state-data animate-scale-in">
              {JSON.stringify(action.before, null, 2)}
            </pre>
          )}

          <button
            className="state-toggle"
            onClick={() => setShowAfter(!showAfter)}
          >
            {showAfter ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>After State</span>
          </button>
          {showAfter && (
            <pre className="state-data animate-scale-in">
              {JSON.stringify(action.after, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
