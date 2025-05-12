/**
 * include_and_auth.js
 * 통합 HTML 삽입 및 인증 상태 처리 스크립트
 */

// 페이지 이동 함수
function navigateTo(path) {
    window.location.href = path;
  }
  
  document.addEventListener('DOMContentLoaded', async () => {
    await loadIncludes();
    await initAuth();
  });
  
  async function loadIncludes() {
    const headerEl = document.getElementById('header-placeholder');
    const footerEl = document.getElementById('footer-placeholder');
    const includeEls = document.querySelectorAll('[data-include-path]');
  
    const tasks = [];
    if (headerEl) tasks.push(fetchAndInsert(headerEl, '/includes/header.html'));
    if (footerEl) tasks.push(fetchAndInsert(footerEl, '/includes/footer.html'));
    includeEls.forEach(el => tasks.push(fetchAndInsert(el, el.dataset.includePath)));
  
    await Promise.all(tasks);
    afterLoad();
  }
  
  async function fetchAndInsert(el, path) {
    try {
      const res = await fetch(path);
      if (res.ok) {
        el.innerHTML = await res.text();
      }
    } catch (e) {
      console.error(`Include load error: ${path}`, e);
    }
  }
  
  function afterLoad() {
    highlightActiveNavLink();
    setupLogoutHandler();
    setupMyPageHandler();
  }
  
  async function initAuth() {
    const params = new URLSearchParams(location.search);
    const social = params.get('socialType');
    const loggedInParam = params.get('loggedIn') === 'true';
  
    if (social && loggedInParam) {
      sessionStorage.setItem('isLoggedIn', 'true');
      sessionStorage.setItem('socialType', social);
    } else {
      if (!sessionStorage.getItem('isLoggedIn')) {
        await checkSession();
      }
    }
    updateAuthUI();
  }
  
  function updateAuthUI() {
    const loggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    document.getElementById('logged-out-buttons')?.style.setProperty('display', loggedIn ? 'none' : 'block');
    document.getElementById('logged-in-buttons')?.style.setProperty('display', loggedIn ? 'flex' : 'none');
  }
  
  async function checkSession() {
    try {
      const res = await fetch('/status', { credentials: 'include' });
      if (res.ok) sessionStorage.setItem('isLoggedIn', 'true');
      else sessionStorage.removeItem('isLoggedIn');
    } catch {
      sessionStorage.removeItem('isLoggedIn');
    }
  }
  
  async function setupLogoutHandler() {
    const btn = document.querySelector('#logged-in-buttons button');
    btn?.addEventListener('click', async e => {
      e.preventDefault();
      await fetch('/api/logout', { method: 'POST', credentials: 'include' });
      sessionStorage.clear();
      navigateTo('/');
    });
  }
  
  async function setupMyPageHandler() {
    const btn = document.getElementById('nav-mypage');
    if (!btn) return;
    btn.addEventListener('click', async e => {
      e.preventDefault();
      if (!await ensureAuthenticated()) return navigateTo('/login');
  
      const resp = await fetch('/api/v1/authUser/me', { credentials: 'include' });
      if (resp.ok) {
        const { data } = await resp.json();
        sessionStorage.setItem('nickname', data.nickname);
        const dest = data.role === 'ROLE_MENTOR' ? '/mypage' : data.role === 'ROLE_MENTEE' ? '/mypage-mentee' : '/user-type-selection';
        navigateTo(dest);
      }
    });
  }
  
  async function ensureAuthenticated() {
    const isLogged = sessionStorage.getItem('isLoggedIn') === 'true';
    if (isLogged) return true;
    const refreshed = await handle401Error();
    return refreshed;
  }
  
  async function handle401Error() {
    try {
      const res = await fetch('/status', { credentials: 'include' });
      if (res.ok) {
        sessionStorage.setItem('isLoggedIn', 'true');
        updateAuthUI();
        return await refreshToken();
      }
    } catch {}
    sessionStorage.removeItem('isLoggedIn');
    updateAuthUI();
    return false;
  }

  window.handle401Error = handle401Error;
  
  async function refreshToken() {
    try {
      const res = await fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include' });
      if (res.ok) {
        sessionStorage.setItem('isLoggedIn', 'true');
        updateAuthUI();
        return true;
      }
    } catch {}
    sessionStorage.removeItem('isLoggedIn');
    updateAuthUI();
    return false;
  }
  
  function highlightActiveNavLink() {
    const path = location.pathname;
    const activeCls = 'text-primary font-medium border-b-2 border-primary pb-1';
    const inactiveCls = 'text-gray-800 hover:text-primary font-medium';
    document.querySelectorAll('nav a, nav button').forEach(el => el.className = inactiveCls);
    if (path === '/' || path.includes('index.html')) selectNav('nav-home', activeCls);
    else if (path.includes('match') || path.includes('matching')) selectNav('nav-match', activeCls);
    else if (path.includes('community')) selectNav('nav-community', activeCls);
    else if (path.includes('mypage')) selectNav('nav-mypage', activeCls);
  }
  
  function selectNav(id, cls) {
    const el = document.getElementById(id);
    if (el) el.className = cls;
  }
  