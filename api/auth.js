export default async function handler(req, res) {
  const pwd = req.body?.pwd || req.query?.pwd;
  if (pwd && pwd === process.env.ADMIN_PASSWORD) {
    return res.status(200).json({ ok: true });
  }
  return res.status(401).json({ ok: false, error: 'Unauthorized' });
}
