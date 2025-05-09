/**
 * include.js - Load header and footer components
 * This script loads the header and footer components into each page
 * and highlights the active navigation link based on the current page.
 */

document.addEventListener('DOMContentLoaded', function() {
  // Load header
  const headerPlaceholder = document.getElementById('header-placeholder');
  if (headerPlaceholder) {
    fetch('/includes/header.html')
        .then(response => response.text())
        .then(data => {
          headerPlaceholder.innerHTML = data;

          // 헤더가 DOM에 완전히 추가될 시간을 주기 위해 약간의 지연 후 실행
          setTimeout(() => {
            // 로그인 상태 체크 스크립트 실행
            checkLoginStatus();
            // 내비게이션 활성화
            highlightActiveNavLink();
          }, 100);
        })
        .catch(error => console.error('Error loading header:', error));
  }

  // Load footer
  const footerPlaceholder = document.getElementById('footer-placeholder');
  if (footerPlaceholder) {
    fetch('/includes/footer.html')
        .then(response => response.text())
        .then(data => {
          footerPlaceholder.innerHTML = data;
        })
        .catch(error => console.error('Error loading footer:', error));
  }
});

/**
 * 로그인 상태를 확인하고 버튼 표시를 업데이트합니다.
 */
async function checkLoginStatus() {
  console.log("Checking login status...");

  // Get references to button containers - 선택자를 정확히 확인
  const loggedOutButtons = document.getElementById('logged-out-buttons');
  const loggedInButtons = document.getElementById('logged-in-buttons');

  if (!loggedOutButtons || !loggedInButtons) {
    console.error("Login/logout button containers not found");
    console.log("DOM at this point:", document.body.innerHTML);
    return;
  }

  console.log("Found buttons:", {
    loggedOutButtons: loggedOutButtons,
    loggedInButtons: loggedInButtons
  });

  // 로그인 상태 확인 - sessionStorage 먼저 확인
  if (sessionStorage.getItem('isLoggedIn') === 'true') {
    // 로그인됨 - 로그아웃 버튼만 표시
    showLoggedInState();
    console.log("User logged in based on sessionStorage");
  } else {
    // 서버에 확인
    try {
      const isLoggedIn = await checkWithServer();
      if (isLoggedIn) {
        // 로그인됨
        showLoggedInState();
        console.log("User logged in based on server check");
      } else {
        // 로그인 안됨
        showLoggedOutState();
        console.log("User not logged in");
      }
    } catch (error) {
      console.error("Error checking login status:", error);
      // 오류 시 기본값은 로그인 안됨
      showLoggedOutState();
    }
  }

  // 로그인된 상태 UI 표시
  function showLoggedInState() {
    // 여러 방식으로 시도 (display 속성과 classList 모두)
    loggedOutButtons.style.display = 'none';
    loggedInButtons.style.display = 'block';

    // classList도 추가로 설정
    loggedOutButtons.classList.add('hidden');
    loggedInButtons.classList.remove('hidden');

    console.log("Set to logged in state");
    console.log("loggedOutButtons display:", loggedOutButtons.style.display);
    console.log("loggedInButtons display:", loggedInButtons.style.display);
  }

  // 로그아웃된 상태 UI 표시
  function showLoggedOutState() {
    // 여러 방식으로 시도
    loggedOutButtons.style.display = 'block';
    loggedInButtons.style.display = 'none';

    // classList도 추가로 설정
    loggedOutButtons.classList.remove('hidden');
    loggedInButtons.classList.add('hidden');

    console.log("Set to logged out state");
    console.log("loggedOutButtons display:", loggedOutButtons.style.display);
    console.log("loggedInButtons display:", loggedInButtons.style.display);
  }
}

/**
 * 서버에 로그인 상태 확인
 * @returns {Promise<boolean>} 로그인 되어 있으면 true
 */
async function checkWithServer() {
  try {
    console.log("Checking with server...");
    // 상태 확인 엔드포인트 호출
    const response = await fetch('/api/v1/auth/status', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await response.json();
    console.log("Status response:", data);

    if (data.status === 200) {
      // 성공 - 로그인됨
      sessionStorage.setItem('isLoggedIn', 'true');
      return true;
    } else if (data.status === 401) {
      // 인증 실패 - 토큰 갱신 시도
      return await refreshToken();
    }

    return false;
  } catch (error) {
    console.error("Error in checkWithServer:", error);
    return false;
  }
}

/**
 * 인증 토큰 갱신 시도
 * @returns {Promise<boolean>} 갱신 성공하면 true
 */
async function refreshToken() {
  try {
    console.log("Attempting to refresh token...");
    const response = await fetch('/api/v1/auth/refresh', {
      method: 'GET',
      credentials: 'include',
    });

    const result = await response.json();
    console.log("Refresh response:", result);

    if (result.status === 200) {
      sessionStorage.setItem('isLoggedIn', 'true');
      return true;
    }

    // 토큰 갱신 실패 - 로그아웃 상태로 간주
    sessionStorage.removeItem('isLoggedIn');
    return false;
  } catch (error) {
    console.error("Error in refreshToken:", error);
    sessionStorage.removeItem('isLoggedIn');
    return false;
  }
}

/**
 * Highlights the active navigation link based on the current page
 */
function highlightActiveNavLink() {
  // Get current page filename
  const currentPage = window.location.pathname.split('/').pop();

  // Default active class
  const activeClass = 'text-primary font-medium border-b-2 border-primary pb-1';
  // Default inactive class
  const inactiveClass = 'text-gray-800 hover:text-primary font-medium';

  // Reset all navigation links
  document.querySelectorAll('nav a').forEach(link => {
    link.className = inactiveClass;
  });

  // Set active link based on current page
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

/**
 * 로그아웃 버튼에 이벤트 리스너를 추가하는 함수
 * include.js에 추가해도 됩니다.
 */
async function setupLogoutHandler() {
  const logoutButton = document.querySelector('#logged-in-buttons button');
  if (logoutButton) {
      logoutButton.addEventListener('click', async () => {
          try {
              // 로그아웃 전에 세션 스토리지 초기화
              sessionStorage.removeItem('isLoggedIn');
              
              const response = await fetch('/api/logout', {
                  method: 'POST',
                  withCredentials: true,
                  headers: {
                      'Content-Type': 'application/json',
                  },
              });

              if (response.ok) {
                  // 로그아웃 성공 시 모든 세션 데이터 제거
                  sessionStorage.clear();
                  showLoggedOutState();
                  const data = await response.json();
                  console.log(data);
                  
                  // 현재 URL이 홈페이지가 아닌 경우에만 리다이렉트
                  if (window.location.pathname !== '/') {
                      window.location.replace('/');
                  }
              } else {
                  alert('로그아웃 중 오류가 발생했습니다.');
                  console.log(response.status);
              }
          } catch (error) {
              console.error('Logout error:', error);
              alert('로그아웃 중 오류가 발생했습니다.');
          }
      });
  }
}

async function loadHTML(element, url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        element.innerHTML = html;

        // HTML이 로드된 후 authHandler.js의 함수들 호출
        if (typeof checkLoginStatus === 'function') {
            checkLoginStatus();
        }
        if (typeof highlightActiveNavLink === 'function') {
            highlightActiveNavLink();
        }
        if (typeof setupLogoutHandler === 'function') {
            setupLogoutHandler();
        }
    } catch (error) {
        console.error('Error loading HTML:', error);
        element.innerHTML = '<p>Error loading content</p>';
    }
}

