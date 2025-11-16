// -----------------------------
// این فایل ارسال اطلاعات لاگین به worker.js را انجام می‌دهد
// و نتیجه را دریافت و پردازش می‌کند
// -----------------------------

document.addEventListener("DOMContentLoaded", () => {

    const loginBtn = document.getElementById("loginBtn");
    const statusText = document.getElementById("status");

    loginBtn.addEventListener("click", async () => {

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();

        // چک کردن اینکه فیلدها خالی نباشند
        if (!username || !password) {
            statusText.textContent = "نام کاربری و رمز عبور الزامی است.";
            return;
        }

        // ارسال اطلاعات به worker.js
        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },

                /*  
                    در این بخش اطلاعات لاگین به worker فرستاده می‌شود
                    worker به ما جواب می‌دهد که کاربر معتبر هست یا نه
                */
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (result.status === "success") {
                // لاگین موفق → انتقال به صفحه اصلی
                window.location.href = "index.html";
            } else {
                // نمایش خطای بازگشتی
                statusText.textContent = result.message;
            }

        } catch (error) {
            statusText.textContent = "خطا در برقراری ارتباط با سرور";
        }
    });

});
