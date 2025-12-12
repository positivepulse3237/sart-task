import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const pwd = req.query.pwd || req.headers['x-admin-password'];
  if (!pwd || pwd !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const items = await kv.lrange('trials', 0, -1); // all
  const sessions = items.map(i => JSON.parse(i));

  const header = ['session_id','BLOCKNAME','BLOCKNUMBER','trial_type','digit','digit_size','mystatus','RT'];
  const lines = [];
  sessions.forEach(s => {
    s.rows.forEach(r => {
      lines.push([
        s.session_id, r.BLOCKNAME, r.BLOCKNUMBER, r.trial_type, r.digit, r.digit_size, r.mystatus, r.RT
      ].join(','));
    });
  });
  const csv = [header.join(','), ...lines].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.status(200).send(csv);
}
