function handleFailure(step, error, context) {
  let recoveryAction = null;
  
  if (error.type === 'timeout' || error.message.includes('timeout')) {
    recoveryAction = {
      type: 'RETRY',
      details: 'Retrying operation with exponential backoff.'
    };
  } else if (error.type === 'corrupt_data' || error.message.includes('corrupt')) {
    recoveryAction = {
      type: 'FALLBACK',
      details: 'Falling back to cached data source.'
    };
  } else if (error.type === 'constraint_violation') {
      recoveryAction = {
          type: 'SKIP',
          details: 'Skipping infeasible action branch.'
      }
  } else {
    recoveryAction = {
      type: 'ROLLBACK',
      details: 'Critical error. Rolling back state to previous step.'
    };
  }

  return recoveryAction;
}

module.exports = { handleFailure };
