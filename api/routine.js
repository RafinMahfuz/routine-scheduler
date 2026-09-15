// Vercel Serverless Function: Real-Time Worldwide Cloud Sync for RUET ECE Routine
// Architecture: GitHub as Lifetime Database (100% Free Forever, No Credit Card, Two-Way Code Sync)
// Supports: GitHub API (Primary), Vercel Global Config, Upstash/Vercel KV, and Local Static Fallback

const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const GITHUB_REPO = process.env.GITHUB_REPO || 'RafinMahfuz/routine-scheduler';
  const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const GITHUB_FILE_PATH = 'data/routine.json';

  const edgeConfigUrl = process.env.EDGE_CONFIG || process.env.GLOBAL_CONFIG;
  const vercelToken = process.env.VERCEL_TOKEN || process.env.VERCEL_API_TOKEN;
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_REST_URL || process.env.REDIS_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_REST_TOKEN || process.env.REDIS_TOKEN;

  // ==========================================
  // GET: Fetch the live routine data
  // ==========================================
  if (req.method === 'GET') {
    // 1. Try reading the freshest routine from GitHub API if GITHUB_TOKEN is configured
    if (GITHUB_TOKEN) {
      try {
        const ghRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}?ref=${GITHUB_BRANCH}`, {
          headers: {
            'Accept': 'application/vnd.github+json',
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'User-Agent': 'RUET-ECE-Routine-Scheduler'
          }
        });
        if (ghRes.ok) {
          const ghData = await ghRes.json();
          if (ghData.content && ghData.encoding === 'base64') {
            const raw = Buffer.from(ghData.content, 'base64').toString('utf8');
            const parsed = JSON.parse(raw);
            return res.status(200).json({
              ok: true,
              exists: true,
              source: 'github',
              payload: parsed.payload || parsed,
              updatedAt: parsed.updatedAt || Date.now()
            });
          }
        }
      } catch (err) {
        console.error('GitHub API GET error:', err);
      }
    }

    // 2. Try reading from local bundled data/routine.json (lightning fast <1ms, 0 external API calls)
    try {
      const localFilePath = path.join(process.cwd(), 'data', 'routine.json');
      if (fs.existsSync(localFilePath)) {
        const fileContent = fs.readFileSync(localFilePath, 'utf8');
        const parsed = JSON.parse(fileContent);
        if (parsed && (parsed.state || parsed.payload)) {
          return res.status(200).json({
            ok: true,
            exists: true,
            source: 'local-file',
            payload: parsed.payload || parsed,
            updatedAt: parsed.updatedAt || Date.now()
          });
        }
      }
    } catch (err) {
      console.error('Local file GET error:', err);
    }

    // 3. Fallback to Global Config / Edge Config if connected
    if (edgeConfigUrl) {
      try {
        const u = new URL(edgeConfigUrl);
        const id = u.pathname.replace(/^\//, '').split('/')[0];
        const token = u.searchParams.get('token');
        if (id && token) {
          const itemUrl = `${u.origin}/${id}/item/ruet_ece_routine?token=${token}`;
          const edgeRes = await fetch(itemUrl);
          if (edgeRes.ok) {
            let itemData = await edgeRes.json();
            if (typeof itemData === 'string') {
              try { itemData = JSON.parse(itemData); } catch (e) { }
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
          }
        }
      } catch (err) {
        console.error('Edge Config GET error:', err);
      }
    }

    // 4. Fallback to KV / Redis if configured
    if (kvUrl && kvToken) {
      try {
        const getRes = await fetch(`${kvUrl}/get/ruet_ece_routine`, {
          headers: { Authorization: `Bearer ${kvToken}` }
        });
        const getData = await getRes.json();
        if (getData && getData.result) {
          let payload = getData.result;
          if (typeof payload === 'string') {
            try { payload = JSON.parse(payload); } catch (e) { }
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
        console.error('KV GET error:', err);
      }
    }

    // If nothing returned yet
    return res.status(200).json({
      ok: false,
      exists: false,
      source: 'none',
      message: 'No routine stored yet. Default routine will load.'
    });
  }

  // ==========================================
  // POST: Save updated routine (Admin Auth)
  // ==========================================
  if (req.method === 'POST') {
    const authHeader = req.headers.authorization || '';
    const providedPass = authHeader.replace(/^Bearer\s+/i, '').trim();
    const envAdminPass = (process.env.ADMIN_PASSWORD || 'admin123').trim();

    // Verify admin credentials strictly against ADMIN_PASSWORD
    if (!providedPass || providedPass !== envAdminPass) {
      return res.status(401).json({ ok: false, error: 'Unauthorized: Invalid admin password' });
    }

    const body = req.body || {};

    // Support instant credential verification from login portal
    if (body.action === 'verify') {
      return res.status(200).json({ ok: true, message: 'Admin authenticated' });
    }

    const cloudPayload = {
      version: 1,
      updatedAt: Date.now(),
      updatedBy: 'Admin (Live Website)',
      payload: body
    };

    // 1. PRIMARY ARCHITECTURE: Commit directly to GitHub repository!
    // This updates the actual CODE in GitHub and triggers auto-deploy to the entire world!
    if (GITHUB_TOKEN) {
      try {
        // A. Get existing file SHA if present
        let currentSha = null;
        try {
          const checkRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}?ref=${GITHUB_BRANCH}`, {
            headers: {
              'Accept': 'application/vnd.github+json',
              'Authorization': `Bearer ${GITHUB_TOKEN}`,
              'User-Agent': 'RUET-ECE-Routine-Scheduler'
            }
          });
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            currentSha = checkData.sha;
          }
        } catch (e) { }

        // B. Commit new routine to GitHub
        const contentBase64 = Buffer.from(JSON.stringify(cloudPayload, null, 2)).toString('base64');
        const commitBody = {
          message: `Update routine via live website [Admin] - ${new Date().toISOString()}`,
          content: contentBase64,
          branch: GITHUB_BRANCH
        };
        if (currentSha) {
          commitBody.sha = currentSha;
        }

        const putRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`, {
          method: 'PUT',
          headers: {
            'Accept': 'application/vnd.github+json',
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json',
            'User-Agent': 'RUET-ECE-Routine-Scheduler'
          },
          body: JSON.stringify(commitBody)
        });

        const putResult = await putRes.json();
        if (putRes.ok) {
          return res.status(200).json({
            ok: true,
            source: 'github',
            updatedAt: cloudPayload.updatedAt,
            commitSha: putResult.commit ? putResult.commit.sha : null,
            message: 'Routine successfully committed to GitHub and deployed worldwide!'
          });
        } else {
          console.error('GitHub commit error:', putResult);
          // Don't fail immediately, try secondary fallbacks below
        }
      } catch (ghErr) {
        console.error('GitHub API error:', ghErr);
      }
    }

    // 2. Secondary fallback: Global Config if connected and VERCEL_TOKEN present
    if (edgeConfigUrl && vercelToken) {
      try {
        const u = new URL(edgeConfigUrl);
        const id = u.pathname.replace(/^\//, '').split('/')[0];
        const teamParam = process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : '';
        const patchRes = await fetch(`https://api.vercel.com/v1/edge-config/${id}/items${teamParam}`, {
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
        if (patchRes.ok) {
          return res.status(200).json({
            ok: true,
            source: 'global-config',
            updatedAt: cloudPayload.updatedAt
          });
        }
      } catch (e) { }
    }

    // 3. Secondary fallback: KV / Redis if configured
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
        if (setRes.ok) {
          return res.status(200).json({
            ok: true,
            source: 'kv-redis',
            updatedAt: cloudPayload.updatedAt
          });
        }
      } catch (e) { }
    }

    // If GITHUB_TOKEN is not yet set up
    return res.status(200).json({
      ok: false,
      needsToken: true,
      message: 'To enable 100% free lifetime sync that commits directly to your code, add a free GITHUB_TOKEN in Vercel Project Settings -> Environment Variables.'
    });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
