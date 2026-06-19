// src/secureGateway.js
// Helper module that creates an HTTPS request with HMAC‑SHA256 authentication.
// Usage:
//   const { requestWithHmac } = require('./secureGateway');
//   requestWithHmac({method: 'GET', url: 'https://api.example.com/data', body: ''}, secretKey)
//       .then(res => console.log(res))
//       .catch(err => console.error(err));

const crypto = require('crypto');
const https = require('https');
const url = require('url');

/**
 * Generate an HMAC signature for the given payload.
 * @param {string} secret - Shared secret key.
 * @param {string} method - HTTP method (GET, POST, etc.).
 * @param {string} path   - Request path (including query string).
 * @param {string} body   - Request body (empty string for GET).
 * @param {string} timestamp - ISO8601 timestamp.
 * @returns {string} Base64‑encoded HMAC signature.
 */
function generateHmac(secret, method, path, body, timestamp) {
  const hmac = crypto.createHmac('sha256', secret);
  // Canonical string: METHOD\nPATH\nTIMESTAMP\nBODY
  const canonical = `${method}\n${path}\n${timestamp}\n${body}`;
  hmac.update(canonical);
  return hmac.digest('base64');
}

/**
 * Perform an HTTPS request with HMAC auth headers.
 * @param {Object} options - { method, url, body, headers (optional) }
 * @param {string} secretKey - Shared secret for HMAC generation.
 * @returns {Promise<Object>} Resolves with { statusCode, headers, body }.
 */
function requestWithHmac(options, secretKey) {
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(options.url);
    const method = (options.method || 'GET').toUpperCase();
    const body = options.body || '';
    const timestamp = new Date().toISOString();
    const path = parsedUrl.path; // includes query string
    const signature = generateHmac(secretKey, method, path, body, timestamp);

    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.path,
      method,
      headers: Object.assign(
        {
          'Content-Type': 'application/json',
          'X-Auth-Timestamp': timestamp,
          'X-Auth-Signature': signature
        },
        options.headers || {}
      )
    };

    const req = https.request(requestOptions, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', err => reject(err));

    if (body && method !== 'GET' && method !== 'HEAD') {
      req.write(body);
    }
    req.end();
  });
}

module.exports = {
  generateHmac,
  requestWithHmac
};
