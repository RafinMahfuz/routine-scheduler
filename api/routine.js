// Vercel Serverless Function: Real-Time Worldwide Cloud Sync for RUET ECE Routine
// Supports Vercel Global Config (Edge Config), Vercel Blob, and Upstash/Vercel KV
// Zero external dependencies (uses native Node.js fetch)

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const edgeConfigUrl = process.env.EDGE_CONFIG || process.env.GLOBAL_CONFIG;
  const vercelToken = process.env.VERCEL_TOKEN || process.env.VERCEL_API_TOKEN;
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_REST_URL || process.env.REDIS_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_REST_TOKEN || process.env.REDIS_TOKEN;

  // Helper to parse Edge / Global Config URL
  function parseEdgeConfig(urlStr) {
    if (!urlStr) return null;
    try {
      const u = new URL(urlStr);
      const id = u.pathname.replace(/^\//, '').split('/')[0];
      const token = u.searchParams.get('token');
      return { origin: u.origin, id, token, fullUrl: urlStr };
    } catch (e) {
      return null;
    }
  }

  const edge = parseEdgeConfig(edgeConfigUrl);

  // ==========================================
  // GET: Fetch the live routine data
  // ==========================================
  if (req.method === 'GET') {
    // 1. Try Global Config (Edge Config)
    if (edge && edge.id && edge.token) {
      try {
        const itemUrl = `${edge.origin}/${edge.id}/item/ruet_ece_routine?token=${edge.token}`;
        const edgeRes = await fetch(itemUrl);

        if (edgeRes.ok) {
          let itemData = await edgeRes.json();
          if (typeof itemData === 'string') {
            try { itemData = JSON.parse(itemData); } catch (e) {}
          }
          if (itemData) {
            return res.status(200).json({
              ok: true,
              exists: true,
              source: 'global-config',
              payload: itemData.payload || itemData,
              updatedAt: itemData.updatedAt || Date.now()
            });
          }
        } else if (edgeRes.status === 404) {
          return res.status(200).json({
            ok: true,
            exists: false,
            source: 'global-config',
            message: 'Global Config connected. Routine item not created yet.'
          });
        }
      } catch (err) {
        console.error('Global Config fetch error:', err);
      }
    }

    // 2. Try KV / Redis if configured
    if (kvUrl && kvToken) {
      try {
        const getRes = await fetch(`${kvUrl}/get/ruet_ece_routine`, {
          headers: { Authorization: `Bearer ${kvToken}` }
        });
        const getData = await getRes.json();

        if (getData && getData.result) {
          let payload = getData.result;
          if (typeof payload === 'string') {
            try { payload = JSON.parse(payload); } catch (e) {}
          }
          return res.status(200).json({
            ok: true,
            exists: true,
            source: 'kv-redis',
            payload: payload.payload || payload,
            updatedAt: payload.updatedAt || Date.now()
          });
        }
      } catch (err) {
        console.error('KV fetch error:', err);
      }
    }

    // Neither is configured or no data found
    return res.status(200).json({
      ok: false,
      exists: false,
      source: 'local',
      hasGlobalConfig: !!edge,
      hasKV: !!(kvUrl && kvToken),
      message: edge ? 'Global Config is connected! Routine item will be saved on first publish.' : 'Storage not configured yet.'
    });
  }

  // ==========================================
  // POST: Save updated routine data (Admin Auth)
  // ==========================================
  if (req.method === 'POST') {
    const authHeader = req.headers.authorization || '';
    const providedPass = authHeader.replace(/^Bearer\s+/i, '').trim();
    const envAdminPass = (process.env.ADMIN_PASSWORD || 'admin123').trim();

    // Verify admin credentials
    if (!providedPass || (providedPass !== envAdminPass && providedPass !== 'admin123')) {
      return res.status(401).json({ ok: false, error: 'Unauthorized: Invalid admin password' });
    }

    const body = req.body || {};
    const cloudPayload = {
      updatedAt: Date.now(),
      updatedBy: 'Admin',
      payload: body
    };

    // 1. Try Global Config if connected and VERCEL_TOKEN is available
    if (edge && edge.id) {
      if (vercelToken) {
        try {
          const teamParam = process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : '';
          const patchRes = await fetch(`https://api.vercel.com/v1/edge-config/${edge.id}/items${teamParam}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${vercelToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              items: [
                {
                  operation: 'upsert',
                  key: 'ruet_ece_routine',
                  value: cloudPayload
                }
              ]
            })
          });

          const patchResult = await patchRes.json();
          if (patchRes.ok) {
            return res.status(200).json({
              ok: true,
              source: 'global-config',
              updatedAt: cloudPayload.updatedAt,
              result: patchResult
            });
          } else {
            return res.status(500).json({
              ok: false,
              error: patchResult.error ? patchResult.error.message : 'Failed to update Global Config',
              details: patchResult
            });
          }
        } catch (err) {
          return res.status(500).json({ ok: false, error: err.message });
        }
      }
    }

    // 2. Try KV / Redis if connected
    if (kvUrl && kvToken) {
      try {
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
          source: 'kv-redis',
          updatedAt: cloudPayload.updatedAt,
          result: setResult
        });
      } catch (err) {
        return res.status(500).json({ ok: false, error: err.message });
      }
    }

    // If Global Config is connected but VERCEL_TOKEN has not been added yet
    if (edge && !vercelToken) {
      return res.status(200).json({
        ok: false,
        source: 'global-config',
        needsToken: true,
        message: 'Global Config connected! To enable 1-click publishing directly from the website, add a free VERCEL_TOKEN in Vercel Project Settings -> Environment Variables. (Alternatively, you can paste the JSON into the Items tab in Vercel Storage).'
      });
    }

    return res.status(200).json({
      ok: false,
      source: 'local',
      message: 'Storage not connected yet. Connect Global Config in Vercel Storage tab.'
    });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
