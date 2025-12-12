import fetch from 'node-fetch';

export default async function handler(req, res) {
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH;
  const token = process.env.GITHUB_TOKEN;

  const pwd = req.query.pwd;
  if (pwd !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/data.txt?ref=${branch}`, {
    headers: { Authorization: `token ${token}` }
  });

  if (getRes.status === 404) {
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send('');
  }
  if (!getRes.ok) {
    const err = await getRes.json();
    return res.status(500).json({ error: err.message || 'Failed to read data.txt' });
  }

  const file = await getRes.json();
  const text = Buffer.from(file.content, 'base64').toString('utf8');

  const format = (req.query.format || '').toLowerCase();
  if (format === 'csv') {
    const lines = text.split('\n').filter(Boolean);
    const rows = lines.map(line => { try { return JSON.parse(line); } catch { return null; } }).filter(Boolean);

    const cols = ['participant_id','timestamp','score','notes'];
    const header = cols.join(',');
    const csvRows = rows.map(r => cols.map(c => csvCell(r?.[c])).join(','));
    const csv = [header, ...csvRows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    return res.status(200).send(csv);
  }

  res.setHeader('Content-Type', 'text/plain');
  return res.status(200).send(text);
}

function csvCell(v) {
  if (v == null) return '';
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g,'""')}"`;
  return s;
}
