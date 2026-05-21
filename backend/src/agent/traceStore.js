// ═══════════════════════════════════════════════════════════════
// TraceStore - In-memory reasoning trace store
// Records every decision, tool call, failure, and reasoning step
// ═══════════════════════════════════════════════════════════════

class TraceStore {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.createdAt = new Date().toISOString();
    this.steps = [];
    this.decisions = [];
    this.toolCalls = [];
    this.failures = [];
    this.workplan = null;
    this.stepCounter = 0;
  }

  /**
   * Log a processing step with full context
   */
  logStep(phase, action, details, status = 'success') {
    this.stepCounter++;
    const entry = {
      id: `step-${this.stepCounter}`,
      timestamp: new Date().toISOString(),
      phase,
      action,
      details,
      status, // 'success' | 'failure' | 'skipped' | 'recovered'
      duration: null
    };
    this.steps.push(entry);
    return entry;
  }

  /**
   * Log an explicit decision point with alternatives considered
   */
  logDecision(question, options, chosen, reasoning) {
    const entry = {
      id: `decision-${this.decisions.length + 1}`,
      timestamp: new Date().toISOString(),
      question,
      options,
      chosen,
      reasoning
    };
    this.decisions.push(entry);
    return entry;
  }

  /**
   * Log a tool/parser invocation with I/O and timing
   */
  logToolCall(tool, input, output, duration) {
    const entry = {
      id: `tool-${this.toolCalls.length + 1}`,
      timestamp: new Date().toISOString(),
      tool,
      input: typeof input === 'object' ? JSON.stringify(input).substring(0, 500) : String(input).substring(0, 500),
      outputSummary: typeof output === 'object'
        ? `${Object.keys(output).length} keys returned`
        : String(output).substring(0, 200),
      duration: `${duration}ms`
    };
    this.toolCalls.push(entry);
    return entry;
  }

  /**
   * Log a failure event with recovery action taken
   */
  logFailure(step, error, recovery) {
    const entry = {
      id: `failure-${this.failures.length + 1}`,
      timestamp: new Date().toISOString(),
      step,
      error: typeof error === 'object' ? error.message || JSON.stringify(error) : String(error),
      recovery,
      resolved: recovery !== null
    };
    this.failures.push(entry);
    return entry;
  }

  /**
   * Store the workplan created at the beginning of analysis
   */
  setWorkplan(workplan) {
    this.workplan = {
      ...workplan,
      setAt: new Date().toISOString()
    };
  }

  /**
   * Get complete trace for the session
   */
  getTrace() {
    return {
      sessionId: this.sessionId,
      createdAt: this.createdAt,
      completedAt: new Date().toISOString(),
      summary: {
        totalSteps: this.steps.length,
        totalDecisions: this.decisions.length,
        totalToolCalls: this.toolCalls.length,
        totalFailures: this.failures.length,
        recoveredFailures: this.failures.filter(f => f.resolved).length
      },
      workplan: this.workplan,
      steps: this.steps,
      decisions: this.decisions,
      toolCalls: this.toolCalls,
      failures: this.failures
    };
  }

  /**
   * Get workplan steps only
   */
  getWorkplan() {
    return this.workplan;
  }

  /**
   * Get a concise timeline view
   */
  getTimeline() {
    const all = [
      ...this.steps.map(s => ({ ...s, entryType: 'step' })),
      ...this.decisions.map(d => ({ ...d, entryType: 'decision' })),
      ...this.toolCalls.map(t => ({ ...t, entryType: 'toolCall' })),
      ...this.failures.map(f => ({ ...f, entryType: 'failure' }))
    ];
    return all.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }
}

module.exports = { TraceStore };
