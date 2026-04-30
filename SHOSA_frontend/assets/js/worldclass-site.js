(function () {
  'use strict';

  document.documentElement.classList.add('has-worldclass-theme');

  var API = window.SHOSA_API || 'http://localhost:4000';
  var SACCO_LINKS = ['sacco-register.html', 'sacco-payments.html', 'sacco-dashboard.html'];

  function $(selector, root) { return (root || document).querySelector(selector); }
  function $all(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }

  function hasAlumni() { return !!localStorage.getItem('shosa_token'); }
  function hasAdmin() { return !!localStorage.getItem('shosa_admin_token'); }
  function authHeader() {
    var token = localStorage.getItem('shosa_token');
    return token ? { Authorization: 'Bearer ' + token } : {};
  }

  function setFlash(message, type) {
    try { sessionStorage.setItem('shosa_flash_message', JSON.stringify({ message: message, type: type || 'info' })); } catch (e) {}
  }

  function readFlash() {
    try {
      var raw = sessionStorage.getItem('shosa_flash_message');
      if (!raw) return null;
      sessionStorage.removeItem('shosa_flash_message');
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  function renderFlash() {
    var flash = readFlash();
    if (!flash || !flash.message) return;
    var box = document.createElement('div');
    box.className = 'site-flash site-flash-' + (flash.type || 'info');
    box.innerHTML = '<div class="wrap"><div class="site-flash-inner">' + flash.message + '</div></div>';
    var nav = document.getElementById('nav');
    document.body.insertBefore(box, nav ? nav.nextSibling : document.body.firstChild);
  }

  function logoutAlumni() {
    ['shosa_token', 'shosa_alumni', 'shosa_full_name', 'shosa_user_name', 'shosa_user'].forEach(function (key) {
      localStorage.removeItem(key);
    });
    window.location.href = 'alumni-login.html';
  }

  function logoutAdmin() {
    localStorage.removeItem('shosa_admin_token');
    window.location.href = 'alumni-login.html';
  }

  function bindLogout(id, fn) {
    var btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', fn);
  }

  function renderAuthAwareNav() {
    var desktop = document.querySelector('#nav .nav-actions');
    var mobile = document.querySelector('#mobNav .mobile-nav-btns');

    if (hasAdmin()) {
      if (desktop) desktop.innerHTML = '<a href="admin-dashboard.html" class="btn btn-outline-white btn-sm">Admin Dashboard</a><button type="button" class="btn btn-gold btn-sm" id="adminNavLogoutDesktop">Logout</button>';
      if (mobile) mobile.innerHTML = '<a href="admin-dashboard.html" class="btn btn-secondary btn-block">Admin Dashboard</a><button type="button" class="btn btn-gold btn-block" id="adminNavLogoutMobile">Logout</button>';
      bindLogout('adminNavLogoutDesktop', logoutAdmin);
      bindLogout('adminNavLogoutMobile', logoutAdmin);
      return;
    }

    if (hasAlumni()) {
      if (desktop) desktop.innerHTML = '<a href="alumni-dashboard.html" class="btn btn-outline-white btn-sm">Dashboard</a><a href="profile.html" class="btn btn-outline-white btn-sm">Profile</a><a href="sacco-register.html" class="btn btn-outline-white btn-sm">SACCO</a><button type="button" class="btn btn-gold btn-sm" id="navLogoutDesktop">Logout</button>';
      if (mobile) mobile.innerHTML = '<a href="alumni-dashboard.html" class="btn btn-secondary btn-block">Dashboard</a><a href="profile.html" class="btn btn-secondary btn-block">Profile</a><a href="sacco-register.html" class="btn btn-secondary btn-block">SACCO</a><button type="button" class="btn btn-gold btn-block" id="navLogoutMobile">Logout</button>';
      bindLogout('navLogoutDesktop', logoutAlumni);
      bindLogout('navLogoutMobile', logoutAlumni);
      return;
    }

    if (desktop) desktop.innerHTML = '<a href="alumni-login.html" class="btn btn-outline-white btn-sm">Log in</a><a href="alumni-register.html" class="btn btn-gold btn-sm">Register →</a>';
    if (mobile) mobile.innerHTML = '<a href="alumni-register.html" class="btn btn-gold btn-block">Register as Alumni</a><a href="alumni-login.html" class="btn btn-secondary btn-block">Log in</a>';
  }

  function isSaccoLink(el) {
    if (!el || !el.getAttribute) return false;
    var href = el.getAttribute('href') || '';
    return SACCO_LINKS.some(function (item) { return href.indexOf(item) !== -1; });
  }

  function getDestination(href) {
    return href ? href.split('#')[0].split('?')[0] : '';
  }

  async function getSaccoStatus() {
    var token = localStorage.getItem('shosa_token');
    if (!token) return { unauthenticated: true };
    try {
      var res = await fetch(API + '/api/sacco/status', { headers: authHeader() });
      if (res.status === 401) {
        localStorage.removeItem('shosa_token');
        localStorage.removeItem('shosa_alumni');
        return { unauthenticated: true };
      }
      var data = await res.json().catch(function () { return null; });
      return data || { error: true };
    } catch (e) { return { error: true }; }
  }

  async function guardSaccoLink(e) {
    var link = e.target.closest('a[href]');
    if (!isSaccoLink(link)) return;
    var href = link.getAttribute('href');
    if (!href || href.startsWith('http')) return;

    e.preventDefault();
    var destination = getDestination(href);
    var status = await getSaccoStatus();

    if (status.unauthenticated) {
      setFlash('Please log in as an alumni member before continuing to the SACCO area.', 'info');
      window.location.href = 'alumni-login.html';
      return;
    }

    if (status.error) {
      setFlash('We could not confirm your SACCO status right now. Please try again in a moment.', 'error');
      return;
    }

    if (!status.membership) {
      if (destination === 'sacco-register.html') window.location.href = href;
      else {
        setFlash('Please complete your SACCO registration first.', 'info');
        window.location.href = 'sacco-register.html';
      }
      return;
    }

    if (!status.membershipFeePaid) {
      if (destination === 'sacco-payments.html') window.location.href = 'sacco-payments.html?required=sacco_membership_fee';
      else {
        setFlash('Before using SACCO member features, pay the required UGX 50,000 membership registration fee.', 'info');
        window.location.href = 'sacco-payments.html?required=sacco_membership_fee';
      }
      return;
    }

    window.location.href = href;
  }

  function initHamburger() {
    var ham = document.getElementById('ham');
    var mob = document.getElementById('mobNav');
    if (ham && mob) {
      ham.addEventListener('click', function () {
        ham.classList.toggle('open');
        mob.classList.toggle('open');
      });
    }
  }

  function initReveal() {
    if (!('IntersectionObserver' in window)) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    $all('.fade-up').forEach(function (el) { obs.observe(el); });
  }

  function initThemeToggle() {
  if (document.getElementById("theme-toggle")) return;

  const style = document.createElement("style");
  style.id = "theme-toggle-runtime-style";
  style.textContent = `
    #theme-toggle.theme-toggle {
      position: fixed !important;
      right: 22px !important;
      bottom: 22px !important;
      left: auto !important;
      z-index: 999999 !important;
      height: 52px !important;
      min-width: 124px !important;
      padding: 0 18px !important;
      border-radius: 999px !important;
      border: 1px solid rgba(255,255,255,.28) !important;
      background: linear-gradient(135deg,#2f5bea,#f2c94c) !important;
      color: #fff !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 9px !important;
      font-size: 12px !important;
      font-weight: 900 !important;
      letter-spacing: .06em !important;
      text-transform: uppercase !important;
      box-shadow: 0 18px 42px rgba(0,0,0,.36) !important;
      cursor: pointer !important;
    }

    #theme-toggle.theme-toggle:hover {
      transform: translateY(-2px) !important;
    }

    body.shosa-worldclass.theme-bright,
    body.theme-bright {
      background: linear-gradient(180deg,#2f5bea 0%,#2453bd 45%,#153a91 100%) !important;
      color: #fff !important;
    }

    body.shosa-worldclass.theme-bright nav,
    body.theme-bright nav,
    body.shosa-worldclass.theme-bright #nav,
    body.theme-bright #nav {
      background: rgba(27,68,170,.96) !important;
      border-bottom: 1px solid rgba(255,229,139,.28) !important;
    }

    body.shosa-worldclass.theme-bright footer,
    body.theme-bright footer {
      background: #123681 !important;
    }

    body.shosa-worldclass.theme-bright section,
    body.theme-bright section,
    body.shosa-worldclass.theme-bright main,
    body.theme-bright main {
      background-color: transparent !important;
    }

    body.shosa-worldclass.theme-bright .hero-main,
    body.theme-bright .hero-main,
    body.shosa-worldclass.theme-bright .section,
    body.theme-bright .section,
    body.shosa-worldclass.theme-bright .page-hero,
    body.theme-bright .page-hero {
      background:
        radial-gradient(circle at top right, rgba(255,229,139,.24), transparent 32%),
        linear-gradient(135deg,#2f5bea,#173f98) !important;
    }

    body.shosa-worldclass.theme-bright .card,
    body.theme-bright .card,
    body.shosa-worldclass.theme-bright .panel,
    body.theme-bright .panel,
    body.shosa-worldclass.theme-bright .form-card,
    body.theme-bright .form-card,
    body.shosa-worldclass.theme-bright .contact-card,
    body.theme-bright .contact-card {
      background: linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,.08)) !important;
      border-color: rgba(255,255,255,.24) !important;
      color: #fff !important;
    }

    body.shosa-worldclass.theme-bright p,
    body.theme-bright p,
    body.shosa-worldclass.theme-bright small,
    body.theme-bright small,
    body.shosa-worldclass.theme-bright .muted,
    body.theme-bright .muted,
    body.shosa-worldclass.theme-bright .card-subtitle,
    body.theme-bright .card-subtitle {
      color: rgba(255,255,255,.86) !important;
    }

    @media(max-width:640px){
      #theme-toggle.theme-toggle{
        right:14px !important;
        bottom:14px !important;
        min-width:54px !important;
        width:54px !important;
        padding:0 !important;
      }
      #theme-toggle .theme-toggle-text{
        display:none !important;
      }
    }
  `;
  document.head.appendChild(style);

  const btn = document.createElement("button");
  btn.id = "theme-toggle";
  btn.className = "theme-toggle";
  btn.type = "button";
  btn.setAttribute("aria-label", "Toggle SHOSA theme");
  btn.innerHTML = `<span>◐</span><span class="theme-toggle-text">Bright</span>`;
  document.body.appendChild(btn);

  const savedTheme = localStorage.getItem("shosa_theme");
  if (savedTheme === "bright") {
    document.body.classList.add("theme-bright");
  }

  function syncLabel() {
    const isBright = document.body.classList.contains("theme-bright");
    const label = btn.querySelector(".theme-toggle-text");
    if (label) label.textContent = isBright ? "Classic" : "Bright";
  }

  syncLabel();

  btn.addEventListener("click", function () {
    document.body.classList.toggle("theme-bright");
    localStorage.setItem(
      "shosa_theme",
      document.body.classList.contains("theme-bright") ? "bright" : "classic"
    );
    syncLabel();
  });
}

  function initFilePickers() {
    $all('input[type="file"]').forEach(function (input) {
      if (input.dataset.shosaFileEnhanced === 'true') return;
      input.dataset.shosaFileEnhanced = 'true';

      var existing = input.nextElementSibling;
      if (existing && existing.classList && existing.classList.contains('shosa-file-picker')) return;

      var id = input.id || ('shosa-file-' + Math.random().toString(36).slice(2));
      input.id = id;
      input.classList.add('shosa-file-input');

      var picker = document.createElement('label');
      picker.className = 'shosa-file-picker';
      picker.setAttribute('for', id);
      picker.innerHTML = '<span class="shosa-file-icon">📸</span><span class="shosa-file-copy"><strong>Choose image</strong><small>PNG/JPG/WebP up to 5MB.</small></span><span class="shosa-file-name">No file selected</span>';
      input.insertAdjacentElement('afterend', picker);

      var nameBox = picker.querySelector('.shosa-file-name');
      input.addEventListener('change', function () {
        var file = input.files && input.files[0];
        nameBox.textContent = file ? file.name : 'No file selected';
        picker.classList.toggle('has-file', !!file);
      });
    });
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented) return;
    var link = e.target.closest('a[href]');
    if (isSaccoLink(link)) guardSaccoLink(e);
  });

  document.addEventListener('keydown', function (e) {
    var active = document.activeElement;
    if (!active) return;
    if ((e.key === 'Enter' || e.key === ' ') && active.matches('a.btn, .btn[role="button"], [data-enter-click="true"]')) {
      e.preventDefault();
      active.click();
    }
  });

  window.addEventListener('scroll', function () {
    var nav = document.getElementById('nav');
    if (!nav) return;
    nav.style.boxShadow = window.scrollY > 40 ? '0 14px 32px rgba(0,0,0,.24)' : '0 10px 30px rgba(0,0,0,.14)';
  }, { passive: true });

  document.addEventListener('DOMContentLoaded', function () {
    initHamburger();
    renderAuthAwareNav();
    bindLogout('logoutBtn', logoutAlumni);
    bindLogout('adminLogoutBtn', logoutAdmin);
    initReveal();
    renderFlash();
    initThemeToggle();
    initFilePickers();
  });
})();
