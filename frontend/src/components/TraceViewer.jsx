"import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronRight, Activity, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import './TraceViewer.css';

const TraceViewer = ({ trace }) => {
  if (!trace) return null;

  const [expandedSections, setExpandedSections] = useState({
    workplan: true,
    decisions: true,
    failures: true,
    tools: false,
    steps: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const SectionHeader = ({ title, section, icon: Icon, count }) => (
    <div className="trace-section-header" onClick={() => toggleSection(section)}>
      <div className="trace-section-title">
        {expandedSections[section] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <Icon size={16} className={`icon-${section}`} />
        <span>{title}</span>
        {count !== undefined && <span className="trace-count-badge">{count}</span>}
      </div>
    </div>
  );

  return (
    <div className="trace-viewer">
      <div className="trace-header">
        <Terminal size={20} />
        <h3>Antigravity Agent Trace</h3>
        <span className="trace-id">ID: {trace.sessionId?.substring(0, 8)}...</span>
      </div>

      <div className="trace-search">
        <Search size={14} />
        <input type="text" placeholder="Search trace logs..." />
      </div>

      <div className="trace-content">
        {/* Workplan */}
        <div className="trace-section">
          <SectionHeader title="Workplan & Task Decomposition" section="workplan" icon={Activity} />
          {expandedSections.workplan && (
            <div className="trace-section-body">
              <ol className="trace-workplan-list">
                {trace.workplan?.map((step, i) => (
                  <li key={i}><CheckCircle size={12} /> {step}</li>
                ))}
              </ol>
            </div>\
<truncated 2241 bytes>