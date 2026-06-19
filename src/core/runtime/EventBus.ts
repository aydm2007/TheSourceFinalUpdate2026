import { EventEmitter } from "events";

class EventBus extends EventEmitter {
  publish(event: string, data: any) {
    this.emit(event, data);
  }

  subscribe(event: string, callback: (data: any) => void) {
    this.on(event, callback);
  }
}

export default new EventBus();
