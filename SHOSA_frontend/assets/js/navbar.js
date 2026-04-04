// assets/js/navbar.js
document.addEventListener("DOMContentLoaded", function () {
  const navbarHost = document.getElementById("navbar");
  if (!navbarHost) return;

  const alumniToken = localStorage.getItem("shosa_token");
  const adminToken = localStorage.getItem("shosa_admin_token");

  // Decide dashboard target
  let dashHref = "alumni-login.html";
  let dashLabel = "Login";
  if (adminToken) {
    dashHref = "admin-dashboard.html";
    dashLabel = "Admin Dashboard";
  } else if (alumniToken) {
    dashHref = "alumni-dashboard.html";
    dashLabel = "Dashboard";
  }

  // Optional user actions
  const alumniActions = alumniToken
    ? `
      <a href="alumni-dashboard.html">My dashboard</a>
      <a href="profile.html">My profile</a>
      <a href="#" id="navLogoutAlumni">Logout (Alumni)</a>
    `
    : `
      <a href="alumni-login.html">Alumni login</a>
      <a href="alumni-register.html">Register as alumni</a>
    `;

  const adminActions = adminToken
    ? `
      <a href="admin-dashboard.html">Admin dashboard</a>
      <a href="#" id="navLogoutAdmin">Logout (Admin)</a>
    `
    : `
      <a href="admin-login.html">Admin login</a>
    `;

  navbarHost.innerHTML = `
<header>
  <div class="navbar">
    <!-- Left: Dashboard -->
    <div class="nav-left">
      <a href="${dashHref}" class="nav-dashboard-link">${dashLabel}</a>
    </div>

    <!-- Center: Brand -->
    <div class="brand">
      <div class="brand-logo">
        <img src="assets/images/logos/shosa-logo.jpeg" alt="SHOSA logo">
      </div>
      <div class="brand-text">
        <div class="brand-title">SHOSA</div>
        <div class="brand-sub">Seeta High Old Students Association</div>
      </div>
    </div>

    <!-- Mobile toggle -->
    <button class="nav-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false">
      <span class="nav-toggle-bar"></span>
      <span class="nav-toggle-bar"></span>
      <span class="nav-toggle-bar"></span>
    </button>

    <!-- Right: Navigation -->
    <nav class="nav-right">
      <ul class="nav-menu">
        <!-- Home -->
        <li class="nav-item">
          <a href="index.html" class="nav-link-main">Home</a>
          <div class="dropdown">
            <a href="index.html#hero">Hero</a>
            <a href="index.html#cta">Get involved</a>
          </div>
        </li>

        <!-- About -->
        <li class="nav-item">
          <a href="about.html" class="nav-link-main">About</a>
          <div class="dropdown">
            <a href="about.html#about-shosa">About SHOSA</a>
            <a href="about.html#pillars">Pillars</a>
            <a href="about.html#engage">Ways to engage</a>
          </div>
        </li>

        <!-- Events -->
        <li class="nav-item">
          <a href="events.html" class="nav-link-main">Events</a>
          <div class="dropdown">
            <a href="events.html#league">SHOSA League</a>
            <a href="events.html#dinners">Dinners &amp; reunions</a>
            <a href="events.html#career">Career guidance</a>
            <a href="events.html#medical">Medical camps</a>
          </div>
        </li>

        <!-- Gallery -->
        <li class="nav-item">
          <a href="gallery.html" class="nav-link-main">Gallery</a>
          <div class="dropdown">
            <a href="gallery.html#league">League moments</a>
            <a href="gallery.html#dinners">Dinners</a>
            <a href="gallery.html#career">Career &amp; mentorship</a>
            <a href="gallery.html#medical">Medical camps</a>
          </div>
        </li>

        <!-- Alumni -->
        <li class="nav-item">
          <a href="alumni-register.html" class="nav-link-main">Alumni</a>
          <div class="dropdown">
            ${alumniActions}
          </div>
        </li>

        <!-- SACCO -->
        <li class="nav-item">
          <a href="sacco-dashboard.html" class="nav-link-main">SACCO</a>
          <div class="dropdown">
            <a href="sacco-dashboard.html">SACCO overview</a>
            <a href="sacco-register.html">Join / update SACCO</a>
            <a href="sacco-payments.html">SACCO payments</a>
          </div>
        </li>

        <!-- Admin -->
        <li class="nav-item">
          <a href="admin-login.html" class="nav-link-main">Admin</a>
          <div class="dropdown">
            ${adminActions}
          </div>
        </li>

        <!-- Donate -->
        <li class="nav-item">
          <a href="donate.html" class="nav-link-main">Donate</a>
          <div class="dropdown">
            <a href="donate.html#once">One-time donation</a>
            <a href="donate.html#recurring">Recurring support</a>
          </div>
        </li>

        <!-- Contact -->
        <li class="nav-item">
          <a href="contact.html" class="nav-link-main">Contact</a>
          <div class="dropdown">
            <a href="contact.html#form">Contact form</a>
            <a href="contact.html#details">Contact details</a>
          </div>
        </li>
      </ul>
    </nav>
  </div>
</header>
  `;

  // ✅ Mobile toggle: use .nav-menu.open (matches your CSS)
  const toggle = navbarHost.querySelector(".nav-toggle");
  const navMenu = navbarHost.querySelector(".nav-menu");

  if (toggle && navMenu) {
    toggle.addEventListener("click", () => {
      const open = navMenu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // ✅ Logout handlers (if present)
  const logoutAlumni = navbarHost.querySelector("#navLogoutAlumni");
  if (logoutAlumni) {
    logoutAlumni.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("shosa_token");
      window.location.href = "index.html";
    });
  }

  const logoutAdmin = navbarHost.querySelector("#navLogoutAdmin");
  if (logoutAdmin) {
    logoutAdmin.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("shosa_admin_token");
      window.location.href = "index.html";
    });
  }
});
