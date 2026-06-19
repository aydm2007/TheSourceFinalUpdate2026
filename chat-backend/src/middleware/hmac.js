const crypto = require('crypto');

function verifyHmac(req, res, next) {
  const secret = process.env.HMAC_SECRET || '';
  if (!secret) {
    console.warn('HMAC_SECRET not set, skipping HMAC verification');
    return next();
  }
  const signature = req.headers['x-hmac-signature'];
  if (!signature) {
    return res.status(400).json({ error: 'Missing HMAC signature' });
  }
  const rawBody = req.rawBody || JSON.stringify(req.body);
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  if (signature !== expected) {
    return res.status(403).json({ error: 'Invalid HMAC signature' });
  }
  next();
}

module.exports = { verifyHmac };
