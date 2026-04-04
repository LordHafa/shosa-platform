// assets/js/app.js
// SHOSA shared frontend helpers (Phase 3.4)
// - Central API base
// - Token helpers
// - Safe fetch wrapper (auto-redirect on token expiry)
// - Simple role-aware nav helpers

(function () {
  const API_BASE = window.SHOSA_API_BASE || "http://localhost:4000";

  function getAlumniToken() {
    return localStorage.getItem("shosa_token");
  }

  function getAdminToken() {
    return localStorage.getItem("shosa_admin_token");
  }

  function clearAlumniSession() {
    localStorage.removeItem("shosa_token");
  }

  function clearAdminSession() {
    localStorage.removeItem("shosa_admin_token");
  }

  function redirectTo(page) {
    window.location.href = page;
  }

  // ✅ Call on any alumni-only page
  function requireAlumniAuth({ redirect = "alumni-login.html" } = {}) {
    const t = getAlumniToken();
    if (!t) {
      redirectTo(redirect);
      return null;
    }
    return t;
  }

  // ✅ Call on any admin-only page
  function requireAdminAuth({ redirect = "admin-login.html" } = {}) {
    const t = getAdminToken();
    if (!t) {
      redirectTo(redirect);
      return null;
    }
    return t;
  }

  // ✅ Always use this for API calls so token expiry is handled
  async function apiFetch(path, options = {}) {
    const url = path.startsWith("http") ? path : API_BASE + path;

    const headers = Object.assign(
      { "Content-Type": "application/json" },
      options.headers || {}
    );

    const res = await fetch(url, Object.assign({}, options, { headers }));

    // Token expired / invalid
    if (res.status === 401) {
      // Decide which token was used (if any)
      const auth = headers.Authorization || headers.authorization || "";
      if (auth.includes("Bearer ")) {
        // If admin token exists & this was admin-ish endpoint, clear admin token
        if (url.includes("/api/admin/")) {
          clearAdminSession();
          redirectTo("admin-login.html?expired=1");
        } else {
          clearAlumniSession();
          redirectTo("alumni-login.html?expired=1");
        }
      }
    }

    return res;
  }

  function toastFromQueryParam() {
    // Optional small UX: if redirected due to expired token, show a message.
    const params = new URLSearchParams(window.location.search);
    if (params.get("expired") === "1") {
      // If a page has #globalMessage element, we show it
      const el = document.getElementById("globalMessage");
      if (el) {
        el.className = "alert alert-error";
        el.textContent = "Your session expired. Please log in again.";
      }
    }
  }

  // Expose globally
  window.SHOSA = {
    API_BASE,
    getAlumniToken,
    getAdminToken,
    clearAlumniSession,
    clearAdminSession,
    requireAlumniAuth,
    requireAdminAuth,
    apiFetch,
    redirectTo,
    toastFromQueryParam,
  };
})();
