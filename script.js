// آدرس کامل Worker
const API_ROOT = "https://smartdoor-api.nasle-khorshid.workers.dev";

// تابع ورود کاربر
async function loginUser() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    alert("لطفاً نام کاربری و رمز عبور را وارد کنید");
    return;
  }

  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("deviceId", deviceId);
  }

  try {
    const response = await fetch(`${API_ROOT}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, deviceId })
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem("token", data.token);
      window.location.href = "door.html";
    } else {
      alert(data.message || "ورود ناموفق بود");
    }
  } catch (error) {
    console.error("خطا در ارتباط با سرور:", error);
    alert("خطا در ارتباط با سرور");
  }
}
