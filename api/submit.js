import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const payload = req.body; // { session_id, rows: [...] }
  if (!payload?.session_id || !Array.isArray(payload?.rows)) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  // Append payload to a list
  await kv.rpush('trials', JSON.stringify(payload));

  return res.status(200).json({ ok: true });
}
