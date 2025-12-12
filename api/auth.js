export default function handler(req, res) {
  const { pwd } = req.query;
  if (pwd === process.env.ADMIN_PASSWORD) {
    return res.status(200).json({ success: true });
  }
  return res.status(403).json({ error: 'Unauthorized' });
}
