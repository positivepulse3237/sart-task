import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { data } = req.body || {};
  if (!data) {
    return res.status(400).json({ error: 'No data provided' });
  }

  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH;
  const token = process.env.GITHUB_TOKEN;

  const toBase64 = (s) => Buffer.from(s, 'utf8').toString('base64');

  try {
    // Step 1: Read current data.txt
    const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/data.txt?ref=${branch}`, {
      headers: { Authorization: `token ${token}` }
    });

    let sha = null;
    let existing = '';
    if (getRes.status === 200) {
      const file = await getRes.json();
      sha = file.sha;
      existing = Buffer.from(file.content, 'base64').toString('utf8');
    } else if (getRes.status !== 404) {
      const err = await getRes.json();
      return res.status(500).json({ error: err.message || 'Failed to read data.txt' });
    }

    // Step 2: Append new line
    const line = JSON.stringify(data);
    const newContent = existing ? `${existing}\n${line}` : line;

    // Step 3: Commit updated file
    const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/data.txt`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        message: 'Append experiment data',
        content: toBase64(newContent),
        sha,
        branch
      })
    });

    const putJson = await putRes.json();
    if (!putRes.ok) {
      return res.status(500).json({ error: putJson.message || 'Failed to write data.txt' });
    }

    return res.status(200).json({ success: true, commit: putJson.commit?.sha });
  } catch (e) {
    console.error('Submit error:', e);
    return res.status(500).json({ error: e.message || 'Unknown error' });
  }
}
