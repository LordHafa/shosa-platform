// assets/js/admin-auth.js
(() => {
  // ✅ single source of truth
  const SHOSA_API = window.SHOSA_API || "http://localhost:4000";

  const TOKEN_KEY = "shosa_admin_token";

  function setAdminToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  function getAdminToken() {
    return localStorage.getItem(TOKEN_KEY);
  }
  function clearAdminToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  function showError(msg) {
    const el = document.getElementById("msg");
    if (!el) return;
    el.style.display = "inline-flex";
    el.textContent = msg || "Login failed";
  }
  function clearError() {
    const el = document.getElementById("msg");
    if (!el) return;
    el.style.display = "none";
    el.textContent = "";
  }

  async function adminLogin(email, password) {
    const res = await fetch(`${SHOSA_API}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Invalid credentials");
    if (!data.token) throw new Error("Login failed: token missing");
    return data.token;
  }

  function goDashboard() {
    // admin dashboard file is usually in same folder as admin-login.html
    window.location.href = "./dashboard.html";
  }

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("btnLogin");
    const emailEl = document.getElementById("email");
    const passEl = document.getElementById("password");

    // If already logged in, optionally redirect
    // if (getAdminToken()) goDashboard();

    if (!btn) return;

    async function submit() {
      clearError();

      const email = (emailEl?.value || "").trim();
      const password = passEl?.value || "";

      if (!email || !password) {
        showError("Please enter email and password.");
        return;
      }

      btn.disabled = true;
      btn.textContent = "Signing in...";

      try {
        const token = await adminLogin(email, password);
        setAdminToken(token);
        goDashboard();
      } catch (e) {
        showError(e?.message || "Login failed");
        clearAdminToken();
      } finally {
        btn.disabled = false;
        btn.textContent = "Sign in";
      }
    }

    btn.addEventListener("click", submit);

    // Enter key submits
    [emailEl, passEl].forEach((el) => {
      if (!el) return;
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter") submit();
      });
    });
  });
})();
