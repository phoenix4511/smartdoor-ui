// script.js — frontend for SmartDoor
const API_ROOT = "https://smartdoor-api.nasle-khorshid.workers.dev"; // آدرس Worker خودت

// ---------- Device ID ----------
function getDeviceId(){
  let id = localStorage.getItem("deviceId");
  if(!id){
    id = (crypto && crypto.randomUUID) ? crypto.randomUUID() : 'dev-' + Date.now();
    localStorage.setItem("deviceId", id);
  }
  return id;
}

// ---------- token helpers ----------
function saveToken(token){ localStorage.setItem("sd_token", token); }
function getToken(){ return localStorage.getItem("sd_token"); }
function clearAll(){ localStorage.removeItem("sd_token"); localStorage.removeItem("deviceId"); }

// ---------- Login flow (login.html) ----------
document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.onclick = async () => {
      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value.trim();
      const status = document.getElementById("status");
      status.textContent = "";

      if(!username || !password){ status.textContent = "نام‌کاربری و رمز لازم است"; return; }

      const deviceId = getDeviceId();
      try {
        const res = await fetch(`${API_ROOT}/login`, {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ username, password, deviceId })
        });
        const data = await res.json();
        if(data.success){
          saveToken(data.token);
          // اگر اولین ورود بوده، پیام می‌آید؛ سپس به door می‌رویم
          window.location.href = "door.html";
        } else {
          status.textContent = data.message || "خطا در ورود";
        }
      } catch(e){ status.textContent = "خطا در ارتباط با سرور"; console.error(e); }
    };
  }

  // door.html actions
  const openBtn = document.getElementById("openBtn");
  if(openBtn){
    openBtn.onclick = async () => {
      const statusEl = document.getElementById("doorStatus");
      statusEl.textContent = "در حال ارسال فرمان...";
      const token = getToken();
      if(!token){ window.location.href = "login.html"; return; }
      const deviceId = getDeviceId();
      try {
        const res = await fetch(`${API_ROOT}/open`, {
          method:"POST",
          headers: { "Content-Type":"application/json", "Authorization":"Bearer "+token },
          body: JSON.stringify({ deviceId })
        });
        const data = await res.json();
        statusEl.textContent = data.message || "نامعلوم";
      } catch(e){ statusEl.textContent = "خطا در ارتباط با سرور"; }
    };
  }

  // logout
  const logoutBtn = document.getElementById("logoutBtn");
  if(logoutBtn) logoutBtn.onclick = ()=>{ clearAll(); window.location.href = "login.html"; };

  // admin page actions
  const refreshUsersBtn = document.getElementById("refreshUsersBtn");
  if(refreshUsersBtn) refreshUsersBtn.onclick = loadUsers;
  const createUserBtn = document.getElementById("createUserBtn");
  if(createUserBtn) createUserBtn.onclick = createUser;
});

// ---------- admin functions ----------
async function loadUsers(){
  const token = getToken();
  if(!token){ alert("ابتدا وارد شوید (ادمین)"); window.location.href = "login.html"; return; }
  const usersDiv = document.getElementById("usersList");
  usersDiv.innerHTML = "در حال بارگذاری...";
  try {
    const res = await fetch(`${API_ROOT}/admin/list-users`, { method:"GET", headers:{ "Authorization":"Bearer "+token } });
    const data = await res.json();
    if(!data.success){ usersDiv.textContent = data.message || "error"; return; }
    usersDiv.innerHTML = "";
    data.users.results.forEach(u => {
      const div = document.createElement("div"); div.className = "userRow";
      div.innerHTML = `<div>
        <strong>${u.username}</strong><br/><small>${u.role} • last: ${u.last_login || "-"}</small>
      </div>`;
      const btn = document.createElement("button"); btn.className="smallBtn"; btn.textContent="ریست دستگاه";
      btn.onclick = async ()=> {
        if(!confirm("مطمئنی دستگاه این کاربر ریست شود؟")) return;
        const res2 = await fetch(`${API_ROOT}/admin/reset-device`, { method:"POST", headers:{"Content-Type":"application/json","Authorization":"Bearer "+token}, body: JSON.stringify({ username: u.username }) });
        const d2 = await res2.json();
        alert(d2.message || "done");
        loadUsers();
      };
      div.appendChild(btn);
      usersDiv.appendChild(div);
    });
  } catch(e){ usersDiv.textContent = "خطا در بارگذاری"; }
}

async function createUser(){
  const username = document.getElementById("newUser").value.trim();
  const password = document.getElementById("newPass").value.trim();
  const role = document.getElementById("newRole").value;
  const token = getToken();
  if(!token){ alert("ابتدا وارد شوید"); window.location.href = "login.html"; return; }
  if(!username || !password) { alert("نام و رمز لازم است"); return; }
  try {
    const res = await fetch(`${API_ROOT}/admin/create-user`, {
      method:"POST",
      headers: {"Content-Type":"application/json","Authorization":"Bearer "+token},
      body: JSON.stringify({ username, password, role })
    });
    const data = await res.json();
    alert(data.message || (data.error || "خطا"));
  } catch(e){ alert("خطا در ارتباط"); }
}
