// Sigma Coordinator integration module
// Provides a function to forward chat messages and optional attachments to the Sigma API.

const fetch = require("node-fetch");
const FormData = require("form-data");
const fs = require("fs");

/**
 * Forward a chat message (and optional attachment) to the Sigma Coordinator API.
 * @param {string} message - The chat message text.
 * @param {string|null} attachmentPath - Absolute path to a file to attach, or null.
 * @returns {Promise<Object>} - Parsed JSON response from Sigma.
 */
async function forwardToSigma(message, attachmentPath = null) {
  const form = new FormData();
  form.append("message", message);
  if (attachmentPath) {
    const fileStream = fs.createReadStream(attachmentPath);
    form.append("attachment", fileStream);
  }

  const response = await fetch("https://api.sigma.example.com/v1/chat", {
    method: "POST",
    body: form,
    // form-data sets appropriate headers automatically via getHeaders()
    headers: form.getHeaders ? form.getHeaders() : {},
  });

  if (!response.ok) {
    throw new Error(`Sigma API error: ${response.status}`);
  }
  const data = await response.json();
  return data;
}

module.exports = { forwardToSigma };
