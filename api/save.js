export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { content } = req.body; 
  
  // ---------------------------------------------------------
  // CONFIGURATION (I filled this in based on your screenshot)
  // ---------------------------------------------------------
  const token = process.env.GITHUB_TOKEN; // We will set this in Vercel later
  const repoOwner = 'positivepulse3237'; 
  const repoName = 'sart-task';        
  const filename = 'data.txt';
  const branch = 'main';
  // ---------------------------------------------------------

  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filename}`;

  try {
    // 1. Get current file to get the SHA (ID) needed to update it
    const getFile = await fetch(url, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'User-Agent': 'Vercel-App' 
      }
    });
    
    if (!getFile.ok) throw new Error("Could not find data.txt in repo");
    
    const fileData = await getFile.json();
    
    // 2. Decode current content (GitHub sends it as Base64)
    const currentContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
    
    // 3. Add the new score to the end
    const newContent = currentContent + '\n' + content;
    
    // 4. Encode back to Base64
    const encodedContent = Buffer.from(newContent).toString('base64');

    // 5. Send update back to GitHub
    const update = await fetch(url, {
      method: 'PUT',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Vercel-App'
      },
      body: JSON.stringify({
        message: 'New experiment data submitted via Web',
        content: encodedContent,
        sha: fileData.sha, 
        branch: branch
      })
    });

    if (!update.ok) throw new Error("GitHub rejected the update");

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
