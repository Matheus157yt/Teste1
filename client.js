/*
Arquivo cliente para chamadas fetch e helpers.
Usa localStorage para tokens (simples, em produção usar httpOnly cookies).
*/
async function apiFetch(url, opts = {}) {
  const accessToken = localStorage.getItem('accessToken');
  opts.headers = opts.headers || {};
  opts.headers['Content-Type'] = 'application/json';
  if (accessToken) opts.headers['Authorization'] = 'Bearer ' + accessToken;
  try {
    const res = await fetch(url, opts);
    if (res.status === 401 || res.status === 403) {
      // tentar renovar token automaticamente
      const refreshed = await tryRefresh();
      if (refreshed) {
        // retry once
        opts.headers['Authorization'] = 'Bearer ' + localStorage.getItem('accessToken');
        return await fetch(url, opts).then(r => r.json());
      }
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Erro fetch', err);
    return null;
  }
}

async function tryRefresh() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        return true;
      }
    }
    return false;
  } catch (err) { console.error(err); return false; }
}

// Helpers para verbos
async function apiGet(url) { return apiFetch(url, { method: 'GET' }); }
async function apiPost(url, body) { return apiFetch(url, { method: 'POST', body: JSON.stringify(body) }); }
async function apiPut(url, body) { return apiFetch(url, { method: 'PUT', body: JSON.stringify(body) }); }
async function apiDelete(url) { return apiFetch(url, { method: 'DELETE' }); }

// Mensagens simples
function showMsg(msg) {
  const el = document.getElementById('msg');
  if (!el) return alert(msg);
  el.innerText = msg;
  setTimeout(()=>el.innerText='', 3000);
}
