// api/save.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { content } = req.body; // The data sent from the frontend
  const token = process.env.GITHUB_TOKEN; // Your secret token
  const repoOwner = 'YOUR_GITHUB_USERNAME'; // CHANGE THIS
  const repoName = 'YOUR_REPO_NAME';        // CHANGE THIS
  const path = 'scores.txt';

  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`;

  try {
    // 1. Get current file (we need the SHA ID to update it)
    const getFile = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const fileData = await getFile.json();
    
    // 2. Decode current content from Base64
    const currentContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
    
    // 3. Append new content
    const newContent = currentContent + '\n' + content;
    
    // 4. Encode back to Base64
    const encodedContent = Buffer.from(newContent).toString('base64');

    // 5. Update the file on GitHub
    await fetch(url, {
      method: 'PUT',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'New score submitted',
        content: encodedContent,
        sha: fileData.sha // Required to prove we aren't overwriting blindly
      })
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
