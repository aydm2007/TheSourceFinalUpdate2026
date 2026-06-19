const crypto = require('crypto');
/**
 * HMAC verification middleware.
 * Expects header `x-hmac-signature` with hex SHA-256 HMAC of request body using secret env HMAC_SECRET.
 */
function verifyHmac(req, res, next) {
  const secret = process.env.HMAC_SECRET;
  if (!secret) {
    console.warn('HMAC secret not set – skipping verification');
    return next();
  }
  const signature = req.header('x-hmac-signature');
  if (!signature) {
    return res.status(401).json({ error: 'Missing HMAC signature' });
  }
  const rawBody = typeof req.body === 'object' ? JSON.stringify(req.body) : String(req.body);
  const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  if (computed !== signature) {
    return res.status(401).json({ error: 'Invalid HMAC' });
  }
  next();
}
module.exports = { verifyHmac };
