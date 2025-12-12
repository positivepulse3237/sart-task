async function auth(pwd) {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ pwd })
  });
  return res.ok;
}

async function fetchCSV(pwd) {
  const res = await fetch('/api/export?pwd=' + encodeURIComponent(pwd));
  if (!res.ok) throw new Error('Export failed');
  return res.text();
}

function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  const header = lines.shift().split(',');
  return lines.map(line => {
    const cols = line.split(',');
    const obj = {};
    header.forEach((h,i) => obj[h] = cols[i]);
    obj.trial_type = Number(obj.trial_type);
    obj.mystatus = Number(obj.mystatus);
    obj.RT = Number(obj.RT);
    obj.block_number = Number(obj.block_number);
    obj.digit = Number(obj.digit);
    obj.digit_size = Number(obj.digit_size);
    return obj;
  });
}

function computeStats(rows) {
  const totalGo = rows.filter(r => r.trial_type === 1).length;
  const goMistakes = rows.filter(r => r.trial_type === 1 && r.mystatus === 0).length;
  const totalNoGo = rows.filter(r => r.trial_type === 0).length;
  const noGoMistakes = rows.filter(r => r.trial_type === 0 && r.mystatus === 0).length;
  const goMistakesP = totalGo ? Math.round((goMistakes/totalGo)*100) : 0;
  const noGoMistakesP = totalNoGo ? Math.round((noGoMistakes/totalNoGo)*100) : 0;
  return { totalGo, goMistakes, goMistakesP, totalNoGo, noGoMistakes, noGoMistakesP };
}

function renderStats(stats) {
  document.getElementById('stats').innerHTML = `
    <h2>Aggregate stats</h2>
    <div>Number Go trials: ${stats.totalGo}</div>
    <div>Number Go mistakes: ${stats.goMistakes}</div>
    <div>Go mistakes: ${stats.goMistakesP}%</div>
    <div>Number No Go trials: ${stats.totalNoGo}</div>
    <div>Number No Go mistakes: ${stats.noGoMistakes}</div>
    <div>No Go mistakes: ${stats.noGoMistakesP}%</div>
  `;
}

function renderTable(rows) {
  const html = [
    '<table><thead><tr>',
    '<th>session_id</th><th>block_name</th><th>block_number</th><th>trial_type</th>',
    '<th>digit</th><th>digit_size</th><th>mystatus</th><th>RT</th>',
    '</tr></thead><tbody>',
    ...rows.map(r => `<tr>
      <td>${r.session_id}</td><td>${r.BLOCKNAME}</td><td>${r.block_number}</td><td>${r.trial_type}</td>
      <td>${r.digit}</td><td>${r.digit_size}</td><td>${r.mystatus}</td><td>${r.RT}</td>
    </tr>`),
    '</tbody></table>'
  ].join('');
  document.getElementById('table').innerHTML = html;
}

function downloadBlob(filename, text) {
  const blob = new Blob([text], {type: 'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function wireAdmin() {
  const loginBtn = document.getElementById('loginBtn');
  const pwdInput = document.getElementById('pwd');
  const controls = document.getElementById('controls');
  const refreshBtn = document.getElementById('refreshBtn');
  const exportBtn = document.getElementById('exportBtn');

  let adminPwd = '';

  loginBtn.onclick = async () => {
    const pwd = pwdInput.value.trim();
    if (!pwd) return alert('Enter password');
    const ok = await auth(pwd);
    if (!ok) return alert('Invalid password');
    adminPwd = pwd;
    controls.style.display = 'flex';
    await refresh();
  };

  async function refresh() {
    const csv = await fetchCSV(adminPwd);
    const rows = parseCSV(csv);
    renderStats(computeStats(rows));
    renderTable(rows);
  }

  refreshBtn.onclick = refresh;
  exportBtn.onclick = async () => {
    const csv = await fetchCSV(adminPwd);
    downloadBlob('sart_export.csv', csv);
  };
}

wireAdmin();
