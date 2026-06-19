// aether-interceptor.js — Sovereign Hybrid Interceptor V6
const https = require('https');
const http = require('http');

// Set base URL to REAL Anthropic for health check stability
process.env.ANTHROPIC_BASE_URL = 'https://api.anthropic.com/v1';

// Override HTTPS.request to redirect ONLY /v1/messages
const originalRequest = https.request;
https.request = function(options, callback) {
  const host = options.host || options.hostname || '';
  const path = options.path || '';

  if (host === 'api.anthropic.com' && path.includes('/messages')) {
    console.error(`[Monitor] Redirecting Oracle Message Pulse to Local Bridge...`);
    options.protocol = 'http:';
    options.host = '127.0.0.1';
    options.hostname = '127.0.0.1';
    options.port = 9999;
    options.headers['host'] = '127.0.0.1:9999';
    return http.request(options, callback);
  }

  return originalRequest.apply(this, arguments);
};

console.error('[Monitor] Hybrid Interceptor V6 Active: Health=Cloud, Work=Local.');
