export interface Event {
  type: string;
  payload: any;
  timestamp: number;
}

class EventStore {
  private events: Event[] = [];

  append(type: string, payload: any) {
    this.events.push({
      type,
      payload,
      timestamp: Date.now(),
    });
  }

  rebuild<T>(reducer: (state: T, event: Event) => T, initialState: T): T {
    return this.events.reduce(reducer, initialState);
  }

  getEvents() {
    return this.events;
  }

  clear() {
    this.events = [];
  }
}

export default new EventStore();
