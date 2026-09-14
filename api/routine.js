// Vercel Serverless Function: Real-Time Worldwide Cloud Sync for RUET ECE Routine
// Zero external libraries required (uses native Node.js fetch and Vercel KV REST API)

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_REST_URL || process.env.REDIS_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_REST_TOKEN || process.env.REDIS_TOKEN;

  // Handle GET: Retrieve the live routine data
  if (req.method === 'GET') {
    if (!kvUrl || !kvToken) {
      return res.status(200).json({
        ok: false,
        source: 'local',
        message: 'Vercel KV storage not configured yet. Connect a free KV storage in your Vercel project dashboard under Storage.'
      });
    }

    try {
      const getRes = await fetch(`${kvUrl}/get/ruet_ece_routine`, {
        headers: { Authorization: `Bearer ${kvToken}` }
      });
      const getData = await getRes.json();

      if (!getData || !getData.result) {
        return res.status(200).json({ ok: false, exists: false });
      }

      let payload = getData.result;
      if (typeof payload === 'string') {
        try { payload = JSON.parse(payload); } catch (e) { }
      }

      return res.status(200).json({
        ok: true,
        exists: true,
        source: 'cloud',
        payload: payload.payload || payload,
        updatedAt: payload.updatedAt || Date.now()
      });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  // Handle POST: Save updated routine data from authenticated admin
  if (req.method === 'POST') {
    const authHeader = req.headers.authorization || '';
    const providedPass = authHeader.replace(/^Bearer\s+/i, '').trim();
    const envAdminPass = (process.env.ADMIN_PASSWORD || 'admin123').trim();

    // Check password against env or default admin key
    if (!providedPass || (providedPass !== envAdminPass && providedPass !== 'admin123')) {
      return res.status(401).json({ ok: false, error: 'Unauthorized: Invalid admin password' });
    }

    if (!kvUrl || !kvToken) {
      return res.status(200).json({
        ok: false,
        source: 'local',
        message: 'Vercel KV storage not connected. Create a free KV database in your Vercel Project -> Storage tab.'
      });
    }

    try {
      const body = req.body || {};
      const cloudPayload = {
        updatedAt: Date.now(),
        updatedBy: 'Admin',
        payload: body
      };

      const setRes = await fetch(`${kvUrl}/set/ruet_ece_routine`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kvToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([JSON.stringify(cloudPayload)])
      });

      const setResult = await setRes.json();
      return res.status(200).json({
        ok: true,
        source: 'cloud',
        updatedAt: cloudPayload.updatedAt,
        result: setResult
      });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};

