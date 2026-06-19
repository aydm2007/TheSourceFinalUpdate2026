// sigmaIntegration.js – Backend helper for Sigma API chat integration
// This module provides functions to forward chat messages to the Sigma proxy
// API, attach the current session token, and normalize responses for the UI.

const fetch = require("node-fetch"); // ensure node-fetch is installed in package.json

/**
 * Sends a chat message (and optional attachment) to Sigma API.
 * @param {string} sessionId - Unique session identifier for the user.
 * @param {string} message - The user‑typed message.
 * @param {File|Buffer|null} attachment - Optional file attachment.
 * @returns {Promise<{reply:string, audioUrl?:string}>}
 */
async function sendToSigma(sessionId, message, attachment = null) {
  const apiUrl = "https://api.sigma.example.com/v1/chat"; // <-- replace with real endpoint
  const form = new FormData();
  form.append("sessionId", sessionId);
  form.append("message", message);
  if (attachment) {
    // If attachment is a Buffer, we need a filename; using generic name.
    const fileName = attachment.name || "attachment.bin";
    form.append("attachment", attachment, fileName);
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    body: form,
    // The API expects multipart/form-data; fetch will set the correct headers.
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Sigma API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  // Expected shape: { reply: string, audioUrl?: string }
  return {
    reply: data.reply || "",
    audioUrl: data.audioUrl || null,
  };
}

module.exports = { sendToSigma };
