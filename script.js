// تولید Device ID و ذخیره در مرورگر
function getDeviceId() {
  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId = crypto.randomUUID();  // تولید آیدی یکتا
    localStorage.setItem("deviceId", deviceId);
  }
  return deviceId;
}
// -------------------------------
// SmartDoor Frontend (WebAuthn)
// -------------------------------

const API = "https://smartdoor-api.nasle-khorshid.workers.dev";

// ذخیره توکن/کاربر
function saveUser(username) {
  localStorage.setItem("sd_username", username);
}

function getUser() {
  return localStorage.getItem("sd_username");
}

// -------------------------------
// 1) ورود معمولی با رمز عبور
// -------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const bioBtn = document.getElementById("bioLoginBtn");

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

      if (!data.success) {
        alert("❌ نام کاربری یا رمز اشتباه است");
        return;
      }

      saveUser(username);
      alert("✔ ورود موفق!");
      window.location.href = "/door.html";
    });
  }

  if (bioBtn) {
    bioBtn.addEventListener("click", loginWithBiometric);
  }
});

// -------------------------------
// 2) ثبت دستگاه برای اثر انگشت
// -------------------------------
async function registerBiometric() {
  const username = getUser();
  if (!username) return alert("ابتدا وارد شوید!");

  // مرحله ۱ — گرفتن challenge
  const optRes = await fetch(`${API}/webauthn/register/options`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username })
  });

  const options = await optRes.json();
  options.publicKey.challenge = new Uint8Array(options.publicKey.challenge);
  options.publicKey.user.id = new Uint8Array(options.publicKey.user.id);

  // مرحله ۲ — باز شدن پنجره اثرانگشت
  const cred = await navigator.credentials.create(options);

  // مرحله ۳ — ارسال نتیجه به سرور
  const result = {
    id: cred.id,
    rawId: arrayToB64(cred.rawId),
    type: cred.type,
    response: {
      clientDataJSON: arrayToB64(cred.response.clientDataJSON),
      attestationObject: arrayToB64(cred.response.attestationObject)
    }
  };

  const finishRes = await fetch(`${API}/webauthn/register/finish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, credential: result })
  });

  const finishData = await finishRes.json();

  if (finishData.success) {
    alert("✔ اثر انگشت با موفقیت ثبت شد!");
  } else {
    alert("❌ ثبت انجام نشد");
  }
}

// -------------------------------
// 3) ورود با اثر انگشت (WebAuthn Login)
// -------------------------------
async function loginWithBiometric() {
  const username = document.getElementById("username").value;
  if (!username) return alert("نام کاربری را وارد کنید");

  // مرحله ۱ — درخواست challenge
  const optRes = await fetch(`${API}/webauthn/login/options`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username })
  });

  const options = await optRes.json();

  if (options.error) {
    alert("❌ هیچ دستگاهی برای این کاربر ثبت نشده");
    return;
  }

  options.publicKey.challenge = new Uint8Array(options.publicKey.challenge);
  options.publicKey.allowCredentials = options.publicKey.allowCredentials.map(x => ({
    ...x,
    id: new Uint8Array(x.id)
  }));

  // مرحله ۲ — باز شدن پنجره اثرانگشت
  const assertion = await navigator.credentials.get(options);

  const credential = {
    id: assertion.id,
    rawId: arrayToB64(assertion.rawId),
    type: assertion.type,
    response: {
      authenticatorData: arrayToB64(assertion.response.authenticatorData),
      clientDataJSON: arrayToB64(assertion.response.clientDataJSON),
      signature: arrayToB64(assertion.response.signature)
    }
  };

  // مرحله ۳ — ارسال نتیجه به سرور
  const finishRes = await fetch(`${API}/webauthn/login/finish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, credential })
  });

  const data = await finishRes.json();

  if (data.success) {
    saveUser(username);
    alert("✔ ورود بیومتریک موفقیت‌آمیز!");
    window.location.href = "/door.html";
  } else {
    alert("❌ خطا در ورود با اثر انگشت");
  }
}

// -------------------------------
// تبدیل بافرها برای ارسال به سرور
// -------------------------------
function arrayToB64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
