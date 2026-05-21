import React from 'react';
import { Check, X, Loader, Circle } from 'lucide-react';
import './AnalysisPipeline.css';

export default function AnalysisPipeline({ progress }) {
  const { step, total, message, steps = [] } = progress;
  const percent = Math.round((step / total) * 100);

  return (
    <div className="analysis-pipeline animate-fade-in">
      {/* Progress Header */}
      <div className="pipeline-header">
        <div className="pipeline-progress-info">
          <h2>Analyzing Your Profile</h2>
          <span className="pipeline-percent">{percent}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="pipeline-message">{message}</p>
      </div>

      {/* Steps */}
      <div className="pipeline-steps">
        {steps.map((s, i) => (
          <div
            key={s.id}
            className={`pipeline-step ${s.status}`}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            {/* Connector Line */}
            {i < steps.length - 1 && (
              <div className={`step-connector ${steps[i + 1].status !== 'waiting' ? 'active' : ''}`} />
            )}

            {/* Icon */}
            <div className={`step-icon ${s.status}`}>
              {s.status === 'done' && <Check size={14} />}
              {s.status === 'running' && <Loader size={14} className="animate-spin" />}
              {s.status === 'error' && <X size={14} />}
              {s.status === 'waiting' && <Circle size={10} />}
            </div>

            {/* Content */}
            <div className="step-content">
              <span className="step-name">{s.name}</span>
              <span className="step-emoji">{s.icon}</span>
            </div>

            {/* Status Badge */}
            <div className={`step-status-badge ${s.status}`}>
              {s.status === 'done' && 'Done'}
              {s.status === 'running' && 'Running'}
              {s.status === 'error' && 'Retrying'}
              {s.status === 'waiting' && 'Waiting'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
