(function(){
  document.documentElement.classList.add('has-worldclass-theme');
  var nav = document.getElementById('nav');
  var API = window.SHOSA_API || 'http://localhost:4000';
  var SACCO_LINKS = ['sacco-register.html','sacco-payments.html','sacco-dashboard.html'];

  function alumniData(){
    try { return JSON.parse(localStorage.getItem('shosa_alumni') || '{}'); } catch(e) { return {}; }
  }
  function hasAlumni(){ return !!localStorage.getItem('shosa_token'); }
  function hasAdmin(){ return !!localStorage.getItem('shosa_admin_token'); }

  window.addEventListener('scroll', function(){
    if(!nav) return;
    nav.style.boxShadow = window.scrollY > 40 ? '0 14px 32px rgba(0,0,0,.24)' : '0 10px 30px rgba(0,0,0,.14)';
  }, {passive:true});

  function setFlash(message, type){
    try { sessionStorage.setItem('shosa_flash_message', JSON.stringify({ message: message, type: type || 'info' })); } catch(e){}
  }
  function readFlash(){
    try { var raw = sessionStorage.getItem('shosa_flash_message'); if(!raw) return null; sessionStorage.removeItem('shosa_flash_message'); return JSON.parse(raw);} catch(e){ return null; }
  }
  function renderFlash(){
    var flash = readFlash(); if(!flash || !flash.message) return;
    var box = document.createElement('div');
    box.className = 'site-flash site-flash-' + (flash.type || 'info');
    box.innerHTML = '<div class="wrap"><div class="site-flash-inner">' + flash.message + '</div></div>';
    var anchor = document.body.firstElementChild;
    document.body.insertBefore(box, anchor && anchor.id === 'nav' ? anchor.nextSibling : anchor);
  }
  function authHeader(){ var token = localStorage.getItem('shosa_token'); return token ? { Authorization: 'Bearer ' + token } : {}; }
  function isSaccoLink(el){ if(!el || !el.getAttribute) return false; var href = el.getAttribute('href') || ''; return SACCO_LINKS.some(function(item){ return href.indexOf(item) !== -1; }); }
  function getDestination(href){ return href ? href.split('#')[0].split('?')[0] : ''; }

  function logoutAlumni(){
    localStorage.removeItem('shosa_token'); localStorage.removeItem('shosa_alumni'); localStorage.removeItem('shosa_full_name'); localStorage.removeItem('shosa_user_name'); localStorage.removeItem('shosa_user');
    window.location.href = 'alumni-login.html';
  }
  function logoutAdmin(){ localStorage.removeItem('shosa_admin_token'); window.location.href = 'alumni-login.html'; }

  function bindLogout(id, fn){ var btn = document.getElementById(id); if(btn) btn.addEventListener('click', fn); }

  function renderAuthAwareNav(){
    var desktop = document.querySelector('#nav .nav-actions') || document.querySelector('.site-nav .actions') || document.getElementById('navActionsDesktop');
    var mobile = document.querySelector('#mobNav .mobile-nav-btns');
    var desktopBtnClass = document.body.classList.contains('page-home') ? 'btn btn-ghost' : 'btn btn-outline-white btn-sm';
    var desktopGoldClass = document.body.classList.contains('page-home') ? 'btn btn-gold' : 'btn btn-gold btn-sm';
    if(!desktop && !mobile) return;

    if(hasAdmin()){
      if(desktop) desktop.innerHTML = '<a href="admin-dashboard.html" class="' + desktopBtnClass + '">Admin Dashboard</a><button type="button" class="' + desktopGoldClass + '" id="adminNavLogoutDesktop">Logout</button>';
      if(mobile) mobile.innerHTML = '<a href="admin-dashboard.html" class="btn btn-secondary btn-block">Admin Dashboard</a><button type="button" class="btn btn-gold btn-block" id="adminNavLogoutMobile">Logout</button>';
      bindLogout('adminNavLogoutDesktop', logoutAdmin); bindLogout('adminNavLogoutMobile', logoutAdmin);
      return;
    }

    if(hasAlumni()){
      if(desktop) desktop.innerHTML = '<a href="alumni-dashboard.html" class="' + desktopBtnClass + '">Dashboard</a><a href="profile.html" class="' + desktopBtnClass + '">Profile</a><a href="sacco-register.html" class="' + desktopBtnClass + '">SACCO</a><button type="button" class="' + desktopGoldClass + '" id="navLogoutDesktop">Logout</button>';
      if(mobile) mobile.innerHTML = '<a href="alumni-dashboard.html" class="btn btn-secondary btn-block">Dashboard</a><a href="profile.html" class="btn btn-secondary btn-block">Profile</a><a href="sacco-register.html" class="btn btn-secondary btn-block">SACCO</a><button type="button" class="btn btn-gold btn-block" id="navLogoutMobile">Logout</button>';
      bindLogout('navLogoutDesktop', logoutAlumni); bindLogout('navLogoutMobile', logoutAlumni);
      return;
    }

    if(desktop) desktop.innerHTML = '<a href="alumni-login.html" class="' + desktopBtnClass + '">Log in</a><a href="alumni-register.html" class="' + desktopGoldClass + '">Register →</a>';
    if(mobile) mobile.innerHTML = '<a href="alumni-register.html" class="btn btn-gold btn-block">Register as Alumni</a><a href="alumni-login.html" class="btn btn-secondary btn-block">Log in</a>';
  }

  async function getSaccoStatus(){
    var token = localStorage.getItem('shosa_token'); if(!token) return { unauthenticated: true };
    try {
      var res = await fetch(API + '/api/sacco/status', { headers: authHeader() });
      if(res.status === 401){ localStorage.removeItem('shosa_token'); localStorage.removeItem('shosa_alumni'); return { unauthenticated: true }; }
      var data = await res.json().catch(function(){ return null; }); return data || { error: true };
    } catch(e){ return { error: true }; }
  }

  async function guardSaccoLink(e){
    var link = e.target.closest('a[href]'); if(!isSaccoLink(link)) return; var href = link.getAttribute('href'); if(!href || href.startsWith('http')) return; e.preventDefault();
    var destination = getDestination(href); var status = await getSaccoStatus();
    if(status.unauthenticated){ setFlash('Please log in as an alumni member before continuing to the SACCO area.', 'info'); window.location.href = 'alumni-login.html'; return; }
    if(status.error){ setFlash('We could not confirm your SACCO status right now. Please try again in a moment.', 'error'); return; }
    if(!status.membership){ if(destination === 'sacco-register.html') { window.location.href = href; } else { setFlash('Please complete your SACCO registration first.', 'info'); window.location.href = 'sacco-register.html'; } return; }
    if(!status.membershipFeePaid){ if(destination === 'sacco-register.html'){ setFlash('Your SACCO membership is saved. Pay the required UGX 50,000 membership registration fee to activate your membership.', 'info'); window.location.href = 'sacco-payments.html?required=sacco_membership_fee'; } else if(destination !== 'sacco-payments.html') { setFlash('Before using SACCO member features, pay the required UGX 50,000 membership registration fee.', 'info'); window.location.href = 'sacco-payments.html?required=sacco_membership_fee'; } else { window.location.href = 'sacco-payments.html?required=sacco_membership_fee'; } return; }
    window.location.href = href;
  }



  function initThemeToggle(){
    if(document.getElementById('theme-toggle')) return;
    var btn = document.createElement('button');
    btn.id = 'theme-toggle';
    btn.className = 'theme-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Toggle SHOSA display style');
    btn.setAttribute('title', 'Toggle SHOSA display style');
    btn.innerHTML = '<span class="theme-toggle-icon">◐</span><span class="theme-toggle-text">Theme</span>';
    document.body.appendChild(btn);

    var saved = localStorage.getItem('shosa_theme');
    if(saved === 'bright') document.body.classList.add('theme-bright');

    function sync(){
      var bright = document.body.classList.contains('theme-bright');
      btn.setAttribute('aria-pressed', bright ? 'true' : 'false');
      var text = btn.querySelector('.theme-toggle-text');
      if(text) text.textContent = bright ? 'Classic' : 'Bright';
    }
    sync();
    btn.addEventListener('click', function(){
      document.body.classList.toggle('theme-bright');
      localStorage.setItem('shosa_theme', document.body.classList.contains('theme-bright') ? 'bright' : 'default');
      sync();
    });
  }

  function initFilePickers(){
    document.querySelectorAll('input[type="file"]').forEach(function(input){
      if(input.dataset.shosaFileEnhanced === 'true') return;
      input.dataset.shosaFileEnhanced = 'true';
      var id = input.id || ('shosa-file-' + Math.random().toString(36).slice(2));
      input.id = id;
      input.classList.add('shosa-file-input');

      var picker = document.createElement('label');
      picker.className = 'shosa-file-picker';
      picker.setAttribute('for', id);
      picker.innerHTML = '<span class="shosa-file-icon">📸</span><span class="shosa-file-copy"><strong>Choose a file</strong><small>Tap to upload an image. JPG, PNG or WebP works best.</small></span><span class="shosa-file-name">No file selected</span>';
      input.insertAdjacentElement('afterend', picker);

      var nameBox = picker.querySelector('.shosa-file-name');
      input.addEventListener('change', function(){
        var file = input.files && input.files[0];
        nameBox.textContent = file ? file.name : 'No file selected';
        picker.classList.toggle('has-file', !!file);
      });
    });
  }

  function initHamburger(){ var ham = document.getElementById('ham'); var mob = document.getElementById('mobNav'); if(ham && mob){ ham.addEventListener('click', function(){ ham.classList.toggle('open'); mob.classList.toggle('open'); }); } }
  function initReveal(){ if(!('IntersectionObserver' in window)) return; var obs = new IntersectionObserver(function(entries){ entries.forEach(function(entry){ if(entry.isIntersecting){ entry.target.classList.add('visible'); obs.unobserve(entry.target); } }); }, { threshold: 0.1 }); document.querySelectorAll('.fade-up').forEach(function(el){ obs.observe(el); }); }

  async function initDynamicHeroes() {
    var heroSections = Array.prototype.slice.call(document.querySelectorAll('.hero, .hero-main, .page-hero, .dynamic-hero'));
    if (!heroSections.length) return;

    var isStorePage = document.body.classList.contains('page-store') || /store\.html$/i.test(location.pathname);
    var isHomePage = document.body.classList.contains('page-home') || /index\.html$/i.test(location.pathname) || location.pathname.endsWith('/');

    var homeImages = [
      'assets/images/hero/alumni-orientation.jpg'
    ];

    var storeImages = [
      'assets/images/store/cap-clean.png',
      'assets/images/store/stickers-wristbands.png'
    ];

    function normalizeUrl(url) {
      if (!url) return '';
      if (/^https?:\/\//i.test(url)) return url;
      if (url.indexOf('/uploads/') === 0 || url.indexOf('/assets/') === 0) return API + url;
      return url;
    }

    function isStoreImage(url) {
      return /\/store\//i.test(url) || /cap|shirt|tshirt|t-shirt|hoodie|sticker|wristband|merch|product/i.test(url);
    }

    async function fetchGalleryImages() {
      var endpoints = ['/api/gallery/public', '/api/gallery/approved', '/api/gallery/all-public'];
      for (var i = 0; i < endpoints.length; i++) {
        try {
          var res = await fetch(API + endpoints[i]);
          if (!res.ok) continue;
          var data = await res.json().catch(function(){ return {}; });
          var urls = (data.images || data.gallery || data.items || [])
            .map(function(img){ return normalizeUrl(img.url || img.imageUrl || img.src); })
            .filter(Boolean);
          if (urls.length) return urls;
        } catch(e) {}
      }
      return [];
    }

    var uploadedImages = await fetchGalleryImages();
    var images;

    if (isStorePage) {
      images = storeImages.slice();
    } else {
      images = uploadedImages.filter(function(url){ return !isStoreImage(url); }).concat(homeImages);
    }

    images = images.filter(function(value, index, arr) {
      return value && arr.indexOf(value) === index;
    });

    if (!images.length) return;

    heroSections.forEach(function(hero, heroIndex){
      var index = heroIndex % images.length;
      hero.classList.add('dynamic-hero-ready');

      function applyHero(){
        var image = images[index % images.length];
        var bg = "linear-gradient(rgba(4,12,35,.70),rgba(4,12,35,.78)), url('" + image + "')";
        hero.style.setProperty('background-image', bg, 'important');
        hero.style.setProperty('background-size', 'cover', 'important');
        hero.style.setProperty('background-position', 'center', 'important');
        hero.style.setProperty('background-repeat', 'no-repeat', 'important');
        hero.style.setProperty('transition', 'background-image 900ms ease-in-out, background 900ms ease-in-out', 'important');
      }

      applyHero();

      if(images.length > 1){
        setInterval(function(){
          index = (index + 1) % images.length;
          applyHero();
        }, 8000 + (heroIndex * 700));
      }
    });
  }

  document.addEventListener('click', function(e){ if(e.defaultPrevented) return; var link = e.target.closest('a[href]'); if(isSaccoLink(link)){ guardSaccoLink(e); return; } });
  document.addEventListener('keydown', function(e){ var active = document.activeElement; if(!active) return; if((e.key === 'Enter' || e.key === ' ') && active.matches('a.btn, .btn[role="button"], [data-enter-click="true"]')){ e.preventDefault(); active.click(); } });

  document.addEventListener('DOMContentLoaded', function(){
    initHamburger(); renderAuthAwareNav(); bindLogout('logoutBtn', logoutAlumni); bindLogout('adminLogoutBtn', logoutAdmin); initReveal(); renderFlash(); initThemeToggle(); initFilePickers(); initDynamicHeroes();
  });
})();
