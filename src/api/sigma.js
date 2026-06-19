// Sigma API integration proxy (CommonJS)
// Provides functions to communicate with the Sigma backend service,
// handling session tokens, attachments, and audio response playback.

const fetch = require("node-fetch");
const FormData = require("form-data");
const fs = require("fs");

// Load session token from environment or a secure store
let SESSION_TOKEN = process.env.SIGMA_SESSION_TOKEN || "";

/**
 * Send a chat message to Sigma API.
 * @param {string} message - The user message.
 * @param {string|null} attachmentPath - Path to a file to attach, if any.
 * @returns {Promise<{reply:string, audioUrl?:string}>}
 */
function sendSigmaMessage(message, attachmentPath = null) {
  const url = "https://api.sigma.example.com/v1/chat";
  const form = new FormData();
  form.append("message", message);
  if (SESSION_TOKEN) {
    form.append("sessionToken", SESSION_TOKEN);
  }
  if (attachmentPath && fs.existsSync(attachmentPath)) {
    form.append("attachment", fs.createReadStream(attachmentPath));
  }

  return fetch(url, {
    method: "POST",
    body: form,
    headers: form.getHeaders(),
  })
    .then((res) => {
      if (!res.ok) {
        return res.text().then((txt) => {
          throw new Error(`Sigma API error ${res.status}: ${txt}`);
        });
      }
      return res.json();
    })
    .then((data) => {
      // Expected response shape: { reply: string, audioUrl?: string }
      return data;
    });
}

// Helper to set/update the session token at runtime
function setSessionToken(token) {
  SESSION_TOKEN = token;
  process.env.SIGMA_SESSION_TOKEN = token;
}

module.exports = { sendSigmaMessage, setSessionToken };
