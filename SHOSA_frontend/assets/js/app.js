// assets/js/app.js
(() => {
  // ✅ Single source of truth for API base
  window.SHOSA_API = window.SHOSA_API || "http://localhost:4000";

  // ---- Auth helpers (Alumni) ----
  window.getShosaToken = function () {
    return localStorage.getItem("shosa_token");
  };

  window.clearShosaAuth = function () {
    localStorage.removeItem("shosa_token");
    localStorage.removeItem("shosa_alumni");
    localStorage.removeItem("shosa_full_name");
    localStorage.removeItem("shosa_user_name");
    localStorage.removeItem("shosa_user");
  };

  window.requireShosaAuth = function (redirectTo = "alumni-login.html") {
    const t = localStorage.getItem("shosa_token");
    if (!t) {
      window.location.href = redirectTo;
      return null;
    }
    return t;
  };

  window.authHeaders = function (token) {
    return token ? { Authorization: "Bearer " + token } : {};
  };

  // ---- URL helper ----
  window.absApiUrl = function (path) {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return window.SHOSA_API + path;
  };

  // ---- Common response guard ----
  // Usage: if (await window.guard401(res)) return; // it redirected
  window.guard401 = async function (res, redirectTo = "alumni-login.html") {
    if (!res) return false;
    if (res.status === 401) {
      window.clearShosaAuth();
      window.location.href = redirectTo;
      return true;
    }
    return false;
  };
})();
