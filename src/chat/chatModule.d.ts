export interface ChatMessage {
  id: string;
  author: string;
  text: string;
  timestamp: Date;
}
export class ChatEngine {
  constructor();
  addMessage(a:string,t:string): ChatMessage;
  getAll(): ChatMessage[];
  clear(): void;
}
export function initChatUI(): void;
