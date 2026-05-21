/**
 * Utility formatters for the Investo app
 */

/**
 * Format currency in PKR with smart abbreviation
 */
export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return 'PKR 0';
  
  const num = Number(amount);
  
  if (num >= 10000000) {
    const crore = num / 10000000;
    return `PKR ${crore % 1 === 0 ? crore.toFixed(0) : crore.toFixed(1)} Cr`;
  }
  
  if (num >= 100000) {
    const lakh = num / 100000;
    return `PKR ${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(1)} Lac`;
  }
  
  return `PKR ${num.toLocaleString('en-PK')}`;
}

/**
 * Format raw currency with full number
 */
export function formatCurrencyFull(amount) {
  if (amount == null || isNaN(amount)) return 'PKR 0';
  return `PKR ${Number(amount).toLocaleString('en-PK')}`;
}

/**
 * Format percentage
 */
export function formatPercent(value) {
  if (value == null || isNaN(value)) return '0%';
  return `${Number(value).toFixed(1)}%`;
}

/**
 * Format date from ISO string
 */
export function formatDate(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format timestamp with time
 */
export function formatTimestamp(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * Format duration in milliseconds
 */
export function formatDuration(ms) {
  if (ms == null || isNaN(ms)) return '0ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.round((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

/**
 * Get risk label from score
 */
export function getRiskLabel(score) {
  if (score == null) return 'Unknown';
  if (score <= 0.25) return 'Low';
  if (score <= 0.5) return 'Moderate';
  if (score <= 0.75) return 'High';
  return 'Very High';
}

/**
 * Get risk color class from score
 */
export function getRiskColor(score) {
  if (score <= 0.25) return 'var(--accent-success)';
  if (score <= 0.5) return 'var(--accent-info)';
  if (score <= 0.75) return 'var(--accent-warning)';
  return 'var(--accent-danger)';
}

/**
 * Get credibility color from score
 */
export function getCredibilityColor(score) {
  if (score >= 0.7) return 'var(--accent-success)';
  if (score >= 0.4) return 'var(--accent-warning)';
  return 'var(--accent-danger)';
}

/**
 * Get credibility label
 */
export function getCredibilityLabel(score) {
  if (score >= 0.8) return 'Very High';
  if (score >= 0.7) return 'High';
  if (score >= 0.5) return 'Moderate';
  if (score >= 0.4) return 'Low';
  return 'Very Low';
}
