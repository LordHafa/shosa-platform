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
    localStorage.removeItem('shosa_token'); localStorage.removeItem('shosa_alumni'); localStorage.removeItem('shosa_full_name'); localStorage.removeItem('shosa_user_name');
    window.location.href = 'index.html';
  }
  function logoutAdmin(){ localStorage.removeItem('shosa_admin_token'); window.location.href = 'admin-login.html'; }

  function bindLogout(id, fn){ var btn = document.getElementById(id); if(btn) btn.addEventListener('click', fn); }

  function renderAuthAwareNav(){
    var desktop = document.querySelector('#nav .nav-actions');
    var mobile = document.querySelector('#mobNav .mobile-nav-btns');
    if(!desktop && !mobile) return;
    if(hasAdmin()){
      if(desktop) desktop.innerHTML = '<a href="admin-dashboard.html" class="btn btn-outline-white btn-sm">Admin Dashboard</a><button type="button" class="btn btn-gold btn-sm" id="adminNavLogoutDesktop">Logout</button>';
      if(mobile) mobile.innerHTML = '<a href="admin-dashboard.html" class="btn btn-secondary btn-block">Admin Dashboard</a><button type="button" class="btn btn-gold btn-block" id="adminNavLogoutMobile">Logout</button>';
      bindLogout('adminNavLogoutDesktop', logoutAdmin); bindLogout('adminNavLogoutMobile', logoutAdmin);
      return;
    }
    if(hasAlumni()){
      if(desktop) desktop.innerHTML = '<a href="alumni-dashboard.html" class="btn btn-outline-white btn-sm">Dashboard</a><a href="profile.html" class="btn btn-outline-white btn-sm">Profile</a><button type="button" class="btn btn-gold btn-sm" id="navLogoutDesktop">Logout</button>';
      if(mobile) mobile.innerHTML = '<a href="alumni-dashboard.html" class="btn btn-secondary btn-block">Dashboard</a><a href="profile.html" class="btn btn-secondary btn-block">Profile</a><a href="sacco-register.html" class="btn btn-secondary btn-block">SACCO</a><button type="button" class="btn btn-gold btn-block" id="navLogoutMobile">Logout</button>';
      bindLogout('navLogoutDesktop', logoutAlumni); bindLogout('navLogoutMobile', logoutAlumni);
      return;
    }
    if(desktop) desktop.innerHTML = '<a href="alumni-login.html" class="btn btn-outline-white btn-sm">Log in</a><a href="alumni-register.html" class="btn btn-gold btn-sm">Register →</a>';
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

  function initHamburger(){ var ham = document.getElementById('ham'); var mob = document.getElementById('mobNav'); if(ham && mob){ ham.addEventListener('click', function(){ ham.classList.toggle('open'); mob.classList.toggle('open'); }); } }
  function initReveal(){ if(!('IntersectionObserver' in window)) return; var obs = new IntersectionObserver(function(entries){ entries.forEach(function(entry){ if(entry.isIntersecting){ entry.target.classList.add('visible'); obs.unobserve(entry.target); } }); }, { threshold: 0.1 }); document.querySelectorAll('.fade-up').forEach(function(el){ obs.observe(el); }); }

  document.addEventListener('click', function(e){ if(e.defaultPrevented) return; var link = e.target.closest('a[href]'); if(isSaccoLink(link)){ guardSaccoLink(e); return; } });
  document.addEventListener('keydown', function(e){ var active = document.activeElement; if(!active) return; if((e.key === 'Enter' || e.key === ' ') && active.matches('a.btn, .btn[role="button"], [data-enter-click="true"]')){ e.preventDefault(); active.click(); } });

  document.addEventListener('DOMContentLoaded', function(){
    initHamburger(); renderAuthAwareNav(); bindLogout('logoutBtn', logoutAlumni); bindLogout('adminLogoutBtn', logoutAdmin); initReveal(); renderFlash();
  });
})();