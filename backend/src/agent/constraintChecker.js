function checkConstraints(action, profile) {
  const violations = [];
  const suggestions = [];

  // Budget Constraint
  if (action.cost && profile.budget) {
    if (action.cost > profile.budget) {
      violations.push(`Action cost (${action.cost}) exceeds user budget (${profile.budget}).`);
      suggestions.push(`Consider a smaller allocation or alternative asset class under ${profile.budget}.`);
    }
  }

  // Target Return Constraint
  if (action.expectedReturn && profile.targetReturn) {
      if (action.expectedReturn < profile.targetReturn * 0.8) { // 20% tolerance
          violations.push(`Expected return (${action.expectedReturn}%) is significantly below target (${profile.targetReturn}%).`);
          suggestions.push('Explore higher-risk asset classes like crypto or equity funds.');
      }
  }

  // Risk Tolerance
  if (action.riskScore && profile.riskTolerance) {
      const riskMapping = { 'Conservative': 0.3, 'Moderate': 0.6, 'Aggressive': 1.0 };
      const maxRisk = riskMapping[profile.riskTolerance] || 0.6;
      if (action.riskScore > maxRisk + 0.1) {
          violations.push(`Asset risk score (${action.riskScore}) exceeds user tolerance limit (${maxRisk}).`);
          suggestions.push('Diversify into government bonds or lower-risk REITs.');
      }
  }

  return {
    feasible: violations.length === 0,
    violations,
    suggestions
  };
}

module.exports = { checkConstraints };
