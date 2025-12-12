(async function () {
  const login = document.getElementById('login');
  const dash = document.getElementById('dash');
  const loginBtn = document.getElementById('loginBtn');
  const loginMsg = document.getElementById('loginMsg');
  const pwdInput = document.getElementById('pwd');

  let authed = false;
  let pwd = '';

  loginBtn.onclick = async () => {
    pwd = pwdInput.value.trim();
    if (!pwd) { loginMsg.textContent = 'Enter a password.'; return; }

    try {
      const res = await fetch(`/api/auth?pwd=${encodeURIComponent(pwd)}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error('Unauthorized');
      authed = true;
      login.style.display = 'none';
      dash.style.display = '';
      await refresh();
    } catch (e) {
      loginMsg.textContent = 'Login failed: ' + e.message;
    }
  };

  document.getElementById('refreshBtn').onclick = refresh;
  document.getElementById('downloadBtn').onclick = downloadCSV;

  async function refresh() {
    if (!authed) return;
    const res = await fetch(`/api/export?pwd=${encodeURIComponent(pwd)}`);
    if (!res.ok) {
      const err = await res.json().catch(()=>({error:'Unknown error'}));
      document.getElementById('raw').textContent = 'Error: ' + (err.error || res.statusText);
      return;
    }
    const text = await res.text();
    document.getElementById('raw').textContent = text;

    const lines = text.split('\n').filter(Boolean);
    const rows = lines.map(line => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);

    const tbody = document.querySelector('#table tbody');
    tbody.innerHTML = '';
    for (const r of rows) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHTML(r.participant_id ?? '')}</td>
        <td>${escapeHTML(r.timestamp ?? '')}</td>
        <td>${escapeHTML(r.score ?? '')}</td>
        <td>${escapeHTML(r.notes ?? '')}</td>
      `;
      tbody.appendChild(tr);
    }
  }

  function downloadCSV() {
    const raw = document.getElementById('raw').textContent;
    const lines = raw.split('\n').filter(Boolean);
    const rows = lines.map(line => { try { return JSON.parse(line); } catch { return null; } }).filter(Boolean);

    // columns we care about
    const cols = ['participant_id','timestamp','score','notes'];
    const header = cols.join(',');
    const csvRows = rows.map(r => cols.map(c => csvCell(r[c])).join(','));
    const csv = [header, ...csvRows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sart-data.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function csvCell(v) {
    if (v == null) return '';
    const s = String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g,'""')}"`;
    return s;
  }

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
})();
