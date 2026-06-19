# Dashboard Core – Chat Interface

## Overview

This dashboard provides a **real‑time chat interface** for interacting with the Sigma API. It includes:
- A responsive chat window with user and bot message bubbles.
- Support for **attachments** (images, documents, etc.).
- **Audio playback** for bot replies with a toggle button.
- Full **i18n** support for **English** and **Arabic** (auto‑detect or manual switch).
- Accessibility‑friendly markup and ARIA attributes.

## Directory Structure

```
core/dashboard/
├─ dashboard.html          # Main HTML page with chat UI and styling
├─ README.md               # <‑‑ This documentation file (updated)
└─ assets/                 # Optional icons, fonts, etc.
```

## Quick Start

1. **Open the dashboard**
   ```bash
   open core/dashboard/dashboard.html
   ```
   (or open the file in any modern browser.)
2. **Select a language** (optional) – a `<select id="lang-selector">` element can be added to switch between English and Arabic.
3. **Start chatting** – type a message and press **Enter** or click the **Send** button.
4. **Attach files** – click the 📎 icon, choose a file, and it will be sent with the message.
5. **Audio** – bot replies may include an `audioUrl`. Click the 🔊/🔇 button to enable or mute audio playback.

## API Integration (Sigma)

The chat UI communicates with the Sigma API via a **multipart/form‑data POST** request:

```js
fetch('https://api.sigma.example.com/v1/chat', {
  method: 'POST',
  body: formData // contains `message` and optional `attachment`
});
```

**Expected response format** (JSON):
```json
{
  "reply": "string",        // Text reply from the bot
  "audioUrl": "string"      // Optional URL to an audio file
}
```

### Error Handling
- Network or server errors are caught and displayed in the chat as **"Error contacting Sigma API"**.
- The UI remains responsive; users can retry sending the message.

## Internationalization (i18n)

All static strings are stored in a simple `messages` object inside `dashboard.html`:

```js
const messages = {
  en: {
    placeholder: 'Type a message...',
    send: 'Send',
    attach: 'Attach',
    audioOn: '🔊',
    audioOff: '🔇',
    error: 'Error contacting Sigma API'
  },
  ar: {
    placeholder: 'اكتب رسالتك...',
    send: 'إرسال',
    attach: 'إرفاق',
    audioOn: '🔊',
    audioOff: '🔇',
    error: 'خطأ في الاتصال بواجهة سيقما'
  }
};
```
The script selects the language based on `navigator.language` or a manual selector and updates UI text accordingly.

## Styling

The chat UI uses a **mobile‑first, flexbox layout** with the following key classes:
- `.chat-container` – main wrapper.
- `.chat-bubble.user` / `.chat-bubble.bot` – message bubbles with distinct colors.
- `.chat-controls` – input, attach, send, and audio toggle.
- Responsive breakpoints ensure the interface works on desktops, tablets, and phones.

## Development & Testing

- **Unit tests** are located in `tests/chat_logic.test.js` and cover message sending, attachment handling, audio toggling, and API error handling (run with `npm test`).
- Linting is enforced via the project ESLint configuration; any new changes should pass `npm run lint`.
- For UI regression testing, run the existing **visual audit** scripts or add Cypress tests as needed.

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/i18n`).
3. Make your changes and ensure all tests pass.
4. Submit a pull request with a clear description of the improvement.

---

*All modifications are logged in `shadow_ledger.jsonl` per governance policy.*

---
> **🛡️ CERTIFIED BY THESOURCE (V17.0 OMEGA)**
> Sovereign Swarm Remote Execution Node
> **Timestamp:** `2026-06-18T08:01:10.782Z`
> **Cryptographic IQ Hash:** `e68bbf5935e79fc8...`
<!-- SOV_HASH:e68bbf5935e79fc8892589ec6468cc2f28746f75e93e7941bcb799b6aaa90281 -->
