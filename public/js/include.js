/**
 * include.js - Load header and footer components
 * This script loads the header and footer components into each page
 * and highlights the active navigation link based on the current page.
 */

// HTML 요소를 로드하는 함수
async function loadHTML(element, url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('HTML 로드 실패');
    
    const html = await response.text();
    element.innerHTML = html;
    
    // 헤더가 로드된 경우에만 로그인 상태 업데이트
    if (url.includes('header.html')) {
      if (typeof window.updateAuthUI === 'function') {
        window.updateAuthUI();
      }
    }
  } catch (error) {
    console.error('HTML 로드 중 오류:', error);
  }
}

// 페이지 로드 시 include 요소 처리
document.addEventListener('DOMContentLoaded', () => {
  const includeElements = document.querySelectorAll('[data-include-path]');
  const promises = includeElements.map(element => {
    const path = element.getAttribute('data-include-path');
    return loadHTML(element, path);
  });
  
  // 모든 HTML 로드가 완료된 후 실행
  Promise.all(promises).then(() => {
    // 활성 네비게이션 링크 하이라이트
    highlightActiveNavLink();
  });
});

/**
 * 활성 네비게이션 링크 하이라이트
 */
function highlightActiveNavLink() {
  const currentPage = window.location.pathname.split('/').pop();
  const activeClass = 'text-primary font-medium border-b-2 border-primary pb-1';
  const inactiveClass = 'text-gray-800 hover:text-primary font-medium';

  document.querySelectorAll('nav a').forEach(link => {
    link.className = inactiveClass;
  });

  if (currentPage === '' || currentPage === 'index.html') {
    const homeLink = document.getElementById('nav-home');
    if (homeLink) homeLink.className = activeClass;
  } else if (currentPage === 'match.html') {
    const matchLink = document.getElementById('nav-match');
    if (matchLink) matchLink.className = activeClass;
  } else if (currentPage === 'community.html') {
    const communityLink = document.getElementById('nav-community');
    if (communityLink) communityLink.className = activeClass;
  } else if (currentPage.includes('mypage')) {
    const mypageLink = document.getElementById('nav-mypage');
    if (mypageLink) mypageLink.className = activeClass;
  }
}

