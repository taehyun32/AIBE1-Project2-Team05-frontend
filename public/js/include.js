/**
 * enhancedInclude.js - Improved header and footer component loader
 *
 * This script ensures consistent header and footer components across all pages
 * by providing a more reliable mechanism for loading includes.
 */

document.addEventListener('DOMContentLoaded', async function() {
  // 플레이스홀더 요소 찾기
  const headerPlaceholder = document.getElementById('header-placeholder');
  const footerPlaceholder = document.getElementById('footer-placeholder');

  // 헤더 플레이스홀더가 존재하면 헤더 로드
  if (headerPlaceholder) {
    try {
      const headerResponse = await fetch('/includes/header.html');
      if (headerResponse.ok) {
        const headerHtml = await headerResponse.text();
        headerPlaceholder.innerHTML = headerHtml;

        // 헤더 로드 후, 현재 페이지에 맞게 네비게이션 활성화
        highlightActiveNavLink();

        // 로그아웃 핸들러 설정
        setupLogoutHandler();

        // 마이페이지 버튼 핸들러 설정
        setupMyPageHandler();

        // 로그인 상태에 따라 UI 업데이트
        updateAuthUI();
      } else {
        console.error('헤더 로드 실패:', headerResponse.status);
      }
    } catch (error) {
      console.error('헤더 로드 중 오류:', error);
    }
  }

  // 푸터 플레이스홀더가 존재하면 푸터 로드
  if (footerPlaceholder) {
    try {
      const footerResponse = await fetch('/includes/footer.html');
      if (footerResponse.ok) {
        const footerHtml = await footerResponse.text();
        footerPlaceholder.innerHTML = footerHtml;
      } else {
        console.error('푸터 로드 실패:', footerResponse.status);
      }
    } catch (error) {
      console.error('푸터 로드 중 오류:', error);
    }
  }

  // 이전 버전과의 호환성을 위해 data-include-path 요소도 처리
  const includeElements = document.querySelectorAll('[data-include-path]');
  if (includeElements.length > 0) {
    for (const element of includeElements) {
      const path = element.getAttribute('data-include-path');
      try {
        const response = await fetch(path);
        if (response.ok) {
          const html = await response.text();
          element.innerHTML = html;

          // 헤더를 포함하는 경우 네비게이션 초기화
          if (path.includes('header') || element.id === 'header-placeholder') {
            highlightActiveNavLink();
            setupLogoutHandler();
            setupMyPageHandler();
            updateAuthUI();
          }
        } else {
          console.error(`${path}에서 인클루드 로드 실패:`, response.status);
        }
      } catch (error) {
        console.error(`${path}에서 인클루드 로드 중 오류:`, error);
      }
    }
  }
});

/**
 * 현재 페이지에 따라 활성 네비게이션 링크 강조 표시
 */
function highlightActiveNavLink() {
  // 현재 페이지 경로 가져오기
  const currentPage = window.location.pathname;

  // 활성 및 비활성 클래스 정의
  const activeClass = 'text-primary font-medium border-b-2 border-primary pb-1';
  const inactiveClass = 'text-gray-800 hover:text-primary font-medium';

  // 모든 네비게이션 링크 초기화
  document.querySelectorAll('nav a').forEach(link => {
    link.className = inactiveClass;
  });

  // 현재 페이지에 따라 활성 링크 설정
  if (currentPage === '/' || currentPage.includes('index.html')) {
    const homeLink = document.getElementById('nav-home');
    if (homeLink) homeLink.className = activeClass;
  }
  else if (currentPage.includes('match') || currentPage.includes('matching')) {
    const matchLink = document.getElementById('nav-match');
    if (matchLink) matchLink.className = activeClass;
  }
  else if (currentPage.includes('community') ||
      currentPage.includes('newPost') ||
      currentPage.includes('community-detail')) {
    const communityLink = document.getElementById('nav-community');
    if (communityLink) communityLink.className = activeClass;
  }
  else if (currentPage.includes('mypage')) {
    const mypageLink = document.getElementById('nav-mypage');
    if (mypageLink) mypageLink.className = activeClass;
  }
}

/**
 * 로그아웃 버튼 클릭 핸들러 설정
 */
function setupLogoutHandler() {
  const logoutButton = document.querySelector('#logged-in-buttons button');
  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      try {
        await fetch('/api/logout', {
          method: 'POST',
          credentials: 'include'
        });
        sessionStorage.clear();
        window.location.href = '/';
      } catch (error) {
        console.error('로그아웃 오류:', error);
      }
    });
  }
}

/**
 * 마이페이지 버튼 클릭 핸들러 설정
 */
  function setupMyPageHandler() {
    const myPageButton = document.getElementById('nav-mypage');
    if (myPageButton) {
      myPageButton.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          const role = await fetch('/api/v1/authUser/me', {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Accept': 'application/json'
            }
          });

          if (role.status === 200) {
            const res = await role.json();
            if (res.data.role === 'ROLE_MENTOR') {
              sessionStorage.setItem('nickname', res.data.nickname);
              window.location.href = '/mypage';
              return;
            } else if (res.data.role === 'ROLE_MENTEE') {
              sessionStorage.setItem('nickname', res.data.nickname);
              window.location.href = '/mypage-mentee';
              return;
            }
            sessionStorage.setItem('nickname', res.data.nickname);
            window.location.href = '/user-type-selection';
            return;
          } else if (role.status === 401) {
            // 가능한 경우 토큰 갱신 시도
            const isRefreshed = await window.handle401Error();
            if (isRefreshed) {
              // 토큰 갱신 후 다시 시도
              await setupMyPageHandler();
              return;
            }
            window.location.href = '/login';
            return;
          }
        } catch (error) {
          console.error('역할 정보 가져오기 오류:', error);
          window.location.href = '/login';
        }
      });
    }
  }

/**
 * 인증 상태에 따라 UI 업데이트
 */
function updateAuthUI() {
  const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
  const loggedOutButtons = document.getElementById('logged-out-buttons');
  const loggedInButtons = document.getElementById('logged-in-buttons');

  if (loggedOutButtons && loggedInButtons) {
    if (isLoggedIn) {
      loggedOutButtons.style.display = 'none';
      loggedInButtons.style.display = 'block';
    } else {
      loggedOutButtons.style.display = 'block';
      loggedInButtons.style.display = 'none';
    }
  }
}

// 다른 스크립트에서 사용할 수 있도록 전역으로 함수 노출
window.highlightActiveNavLink = highlightActiveNavLink;
window.updateAuthUI = updateAuthUI;