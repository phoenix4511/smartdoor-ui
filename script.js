const API = "https://smartdoor-api.nasle-khorshid.workers.dev";

// لاگین
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;

      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("token", data.token);
        window.location.href = "door.html";
      } else {
        document.getElementById("errorMsg").textContent = data.message;
      }
    });
  }

  // باز کردن درب
  const openBtn = document.getElementById("openBtn");
  if (openBtn) {
    openBtn.onclick = async () => {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API}/open`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      const data = await res.json();
      alert(data.message);
    };
  }

  // خروج
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      localStorage.clear();
      window.location.href = "login.html";
    };
  }
});
