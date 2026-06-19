// Central chat state management using Node/CommonJS syntax (adaptable to Redux or Context)
const React = require("react");
const { createContext, useReducer, useContext } = React;

// Action types
const ACTIONS = {
  ADD_MESSAGE: "add-message",
  CLEAR_CHAT: "clear-chat",
  TOGGLE_AUDIO: "toggle-audio",
};

// Initial state
const initialState = {
  messages: [], // { sender: 'user'|'bot', text: string }
  audioEnabled: true,
};

// Reducer function
function chatReducer(state, action) {
  switch (action.type) {
    case ACTIONS.ADD_MESSAGE:
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case ACTIONS.CLEAR_CHAT:
      return { ...state, messages: [] };
    case ACTIONS.TOGGLE_AUDIO:
      return { ...state, audioEnabled: !state.audioEnabled };
    default:
      return state;
  }
}

// Create Context
const ChatContext = createContext();

// Provider component
function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  return React.createElement(
    ChatContext.Provider,
    { value: { state, dispatch } },
    children,
  );
}

// Custom hook for easy access
function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}

// Export actions for convenience
const chatActions = {
  addMessage: (dispatch, message) =>
    dispatch({ type: ACTIONS.ADD_MESSAGE, payload: message }),
  clearChat: (dispatch) => dispatch({ type: ACTIONS.CLEAR_CHAT }),
  toggleAudio: (dispatch) => dispatch({ type: ACTIONS.TOGGLE_AUDIO }),
};

module.exports = {
  ChatProvider,
  useChat,
  chatActions,
  ACTIONS,
};
