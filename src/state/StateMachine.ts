export default class StateMachine {
  private currentState: string = 'STATE_INIT';
  private transitionLog: string[] = [];

  constructor() {
    this.transitionLog.push(`[Init] State machine booted at ${new Date().toISOString()}`);
  }

  public transition(newState: string, payload?: any): void {
    const prev = this.currentState;
    this.currentState = newState;
    const logEntry = `[Transition] ${prev} -> ${newState} | Payload: ${JSON.stringify(payload || {})}`;
    this.transitionLog.push(logEntry);
  }

  public getLog(): string[] {
    return this.transitionLog;
  }

  public getCurrentState(): string {
    return this.currentState;
  }
}
