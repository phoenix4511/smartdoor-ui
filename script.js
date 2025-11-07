// Basic frontend script for SmartDoor UI
const API_ROOT = '/api'; // Worker endpoints will live under /api/...
(function init(){
  const mode = localStorage.getItem('sd_theme') || 'dark';
  setTheme(mode);
  const btn = document.getElementById('themeBtn');
  if(btn) btn.onclick = toggleTheme;
})();

function setTheme(mode){
  const el = document.documentElement;
  if(mode === 'light'){
    el.classList.add('light-mode');
    el.classList.remove('dark-mode');
  } else {
    el.classList.add('dark-mode');
    el.classList.remove('light-mode');
  }
  localStorage.setItem('sd_theme', mode);
  const tb = document.getElementById('themeBtn');
  if(tb) tb.textContent = mode==='dark' ? 'روشن' : 'تاریک';
}

function toggleTheme(){
  const cur = localStorage.getItem('sd_theme') || 'dark';
  setTheme(cur === 'dark' ? 'light' : 'dark');
}

async function doLogin(username, password){
  const res = await fetch(API_ROOT + '/login', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ username, password })
  });
  if(res.ok){
    const data = await res.json();
    sessionStorage.setItem('sd_token', data.token);
    sessionStorage.setItem('sd_user', data.username);
    sessionStorage.setItem('sd_role', data.role);
    return { ok:true, role:data.role };
  } else {
    const t = await res.text().catch(()=> 'خطا');
    return { ok:false, message:t };
  }
}

function doLogout(){
  sessionStorage.clear();
  window.location.href = '/index.html';
}

async function enrollWebAuthn(){
  try{
    const token = sessionStorage.getItem('sd_token');
    if(!token) return alert('ابتدا وارد شوید');
    const optRes = await fetch(API_ROOT + '/webauthn/register/options', { headers:{ 'Authorization':'Bearer '+token }});
    if(!optRes.ok) return alert('خطا در دریافت گزینه‌ها');
    const options = await optRes.json();
    options.publicKey.challenge = base64ToBuffer(options.publicKey.challenge);
    options.publicKey.user.id = base64ToBuffer(options.publicKey.user.id);
    const cred = await navigator.credentials.create(options);
    const attestation = {
      id: cred.id,
      rawId: bufferToBase64(cred.rawId),
      response: {
        clientDataJSON: bufferToBase64(cred.response.clientDataJSON),
        attestationObject: bufferToBase64(cred.response.attestationObject)
      },
      type: cred.type
    };
    const resp = await fetch(API_ROOT + '/webauthn/register/finish', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+token },
      body: JSON.stringify(attestation)
    });
    if(resp.ok) alert('اثر انگشت با موفقیت فعال شد');
    else alert('ثبت اثر انگشت موفق نبود');
  }catch(e){ console.error(e); alert('خطا در فعال‌سازی بیومتریک') }
}

function bufferToBase64(buf){ return btoa(String.fromCharCode.apply(null, new Uint8Array(buf))); }
function base64ToBuffer(b64){ const bin = atob(b64); const arr = new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i); return arr.buffer; }

function requireLogin(redirectTo='/index.html'){
  const t = sessionStorage.getItem('sd_token');
  if(!t) { window.location.href = redirectTo; return false; }
  return true;
}

async function requestOpen(){
  const token = sessionStorage.getItem('sd_token');
  const res = await fetch(API_ROOT + '/open', { method:'POST', headers:{ 'Authorization':'Bearer '+token } });
  return res;
}
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const response = await fetch("https://smartdoor-api.nasle-khorshid.workers.dev/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (data.success) {
      alert("ورود موفق! در حال انتقال...");
      window.location.href = "/door.html";
    } else {
      alert("نام کاربری یا رمز اشتباه است!");
    }
  });
});
