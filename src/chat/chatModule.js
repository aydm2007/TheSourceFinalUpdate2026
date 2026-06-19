// Chat Module
// Provides a simple chat UI component and message handling logic.

/**
 * ChatMessage represents a single chat entry.
 * @typedef {Object} ChatMessage
 * @property {string} id - Unique identifier for the message.
 * @property {string} author - Author of the message (e.g., 'user' or 'bot').
 * @property {string} text - Message content.
 * @property {Date} timestamp - Time the message was created.
 */

/**
 * ChatEngine handles message storage and basic operations.
 */
class ChatEngine {
  constructor() {
    /** @type {ChatMessage[]} */
    this.messages = [];
  }

  /**
   * Adds a new message to the chat.
   * @param {string} author
   * @param {string} text
   * @returns {ChatMessage}
   */
  addMessage(author, text) {
    const msg = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      author,
      text,
      timestamp: new Date()
    };
    this.messages.push(msg);
    return msg;
  }

  /**
   * Retrieves all messages.
   * @returns {ChatMessage[]}
   */
  getAll() {
    return [...this.messages];
  }

  /**
   * Clears all chat history.
   */
  clear() {
    this.messages = [];
  }
}

/**
 * Simple UI rendering for the chat module using vanilla DOM.
 * Attach to a container element with ID 'chat-root'.
 */
function initChatUI() {
  const root = document.getElementById('chat-root');
  if (!root) {
    console.error('Chat root element not found');
    return;
  }

  const engine = new ChatEngine();

  // Create UI elements
  const messagesContainer = document.createElement('div');
  messagesContainer.className = 'chat-messages';
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Type a message...';
  input.className = 'chat-input';
  const sendBtn = document.createElement('button');
  sendBtn.textContent = 'Send';
  sendBtn.className = 'chat-send';

  const form = document.createElement('div');
  form.className = 'chat-form';
  form.appendChild(input);
  form.appendChild(sendBtn);

  root.appendChild(messagesContainer);
  root.appendChild(form);

  function render() {
    messagesContainer.innerHTML = '';
    engine.getAll().forEach(msg => {
      const msgEl = document.createElement('div');
      msgEl.className = `chat-message ${msg.author}`;
      msgEl.textContent = `[${msg.timestamp.toLocaleTimeString()}] ${msg.author}: ${msg.text}`;
      messagesContainer.appendChild(msgEl);
    });
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  sendBtn.addEventListener('click', () => {
    const text = input.value.trim();
    if (!text) return;
    engine.addMessage('user', text);
    // Placeholder bot response
    setTimeout(() => {
      engine.addMessage('bot', 'Echo: ' + text);
      render();
    }, 300);
    input.value = '';
    render();
  });

  // Initial render
  render();
}

// Export for module systems (CommonJS & ES Modules)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ChatEngine, initChatUI };
} else {
  window.ChatEngine = ChatEngine;
  window.initChatUI = initChatUI;
}
