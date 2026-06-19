// sigmaIntegration.js – Backend helper for Sigma API chat integration
// This module exports a function that forwards a chat session message to the Sigma proxy
// and returns the processed reply along with optional audio URL.

const fetch = require('node-fetch'); // Ensure node-fetch is installed in package.json

/**
 * Sends a chat message to the Sigma API, preserving the session token.
 * @param {string} sessionId - Unique identifier for the user session.
 * @param {string} message   - The user message text.
 * @param {File|null} attachment - Optional file attachment (will be streamed).
 * @returns {Promise<{reply:string, audioUrl?:string}>}
 */
async function sendToSigma(sessionId, message, attachment = null) {
  const apiUrl = "https://api.sigma.example.com/v1/chat";
  const form = new FormData();
  form.append('sessionId', sessionId);
  form.append('message', message);
  if (attachment) {
    form.append('attachment', attachment);
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    body: form,
    headers: {
      // Let fetch set the multipart boundary automatically
    }
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Sigma API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  // Expected shape: { reply: string, audioUrl?: string }
  return data;
}

module.exports = { sendToSigma };
