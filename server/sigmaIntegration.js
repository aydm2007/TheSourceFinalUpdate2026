// sigmaIntegration.js – Backend connector for Sigma proxy API
// ---------------------------------------------------------------
// This module exports a single async function `forwardChat` that
// receives the current session identifier, the user message, and an
// optional attachment (as a Buffer). It forwards the payload to the
// Sigma API, handles the response, and returns an object containing the
// textual reply and an optional audio URL.
// ---------------------------------------------------------------

const fetch = require('node-fetch'); // ensure node-fetch is in dependencies
const FormData = require('form-data');

/**
 * Forward a chat message to the Sigma proxy API.
 * @param {string} sessionId – Unique identifier for the user session.
 * @param {string} message   – The text entered by the user.
 * @param {Object} [attachment] – Optional file attachment {filename, mime, data}.
 * @returns {Promise<{reply:string, audioUrl?:string}>}
 */
async function forwardChat(sessionId, message, attachment) {
  const apiUrl = "https://api.sigma.example.com/v1/chat";

  const form = new FormData();
  form.append('sessionId', sessionId);
  form.append('message', message);

  if (attachment && attachment.data) {
    form.append('attachment', attachment.data, {
      filename: attachment.filename || 'attachment.bin',
      contentType: attachment.mime || 'application/octet-stream'
    });
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    body: form,
    headers: form.getHeaders()
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Sigma API error ${response.status}: ${errText}`);
  }

  const payload = await response.json();
  // Expected shape: { reply: string, audioUrl?: string }
  return {
    reply: payload.reply || "",
    audioUrl: payload.audioUrl
  };
}

module.exports = { forwardChat };
