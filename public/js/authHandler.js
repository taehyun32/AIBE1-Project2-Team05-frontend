/**
 * 모든 페이지에서 사용할 수 있는 통합 HTML 삽입 및 로그인 상태 처리 스크립트
 */
document.addEventListener('DOMContentLoaded', function() {
    // 방법 1: data-include-path 속성을 사용한 HTML 삽입
    const includeElements = document.querySelectorAll('[data-include-path]');
    if (includeElements.length > 0) {
        console.log("Using data-include-path method");
        processIncludeElements();
    }
    // 방법 2: header-placeholder, footer-placeholder를 사용한 HTML 삽입
    else {
        console.log("Using placeholder method");
        processPlaceholders();
    }
});

/**
 * data-include-path 속성을 사용하여 HTML 삽입
 */
async function processIncludeElements() {
    const includeElements = document.querySelectorAll('[data-include-path]');
    const promises = [];

    // 모든 요소에 대해 비동기 작업 시작
    includeElements.forEach(function(el) {
        const path = el.getAttribute('data-include-path');
        const promise = fetch(path)
            .then(response => response.text())
            .then(html => {
                el.innerHTML = html;

                // 이 요소가 헤더를 포함하는지 확인
                if (path.includes('header') || html.includes('id="logged-out-buttons"')) {
                    console.log("Header detected in path:", path);
                    return true; // 이 요소는 헤더임을 표시
                }
                return false; // 헤더가 아님
            })
            .catch(error => {
                console.error(`Error loading element from ${path}:`, error);
                return false;
            });

        promises.push(promise);
    });

    // 모든 비동기 작업이 완료될 때까지 기다림
    const results = await Promise.all(promises);

    // 헤더가 포함된 경우 로그인 상태 확인 및 내비게이션 활성화
    if (results.some(Boolean)) {
        console.log("Header included, checking login status");
        setTimeout(() => {
            checkLoginStatus();
            highlightActiveNavLink();
            setupLogoutHandler();
        }, 100);
    }
}

/**
 * header-placeholder와 footer-placeholder를 사용한 HTML 삽입
 */
function processPlaceholders() {
    // Load header
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
        fetch('/includes/header.html')
            .then(response => response.text())
            .then(data => {
                headerPlaceholder.innerHTML = data;

                // 약간의 지연 후 로그인 상태 등 처리
                setTimeout(() => {
                    checkLoginStatus();
                    highlightActiveNavLink();
                    setupLogoutHandler();
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
}

/**
 * 로그인 상태를 확인하고 버튼 표시를 업데이트합니다.
 */
async function checkLoginStatus() {
    console.log("Checking login status...");

    // Get references to button containers
    const loggedOutButtons = document.getElementById('logged-out-buttons');
    const loggedInButtons = document.getElementById('logged-in-buttons');

    if (!loggedOutButtons || !loggedInButtons) {
        console.error("Login/logout button containers not found");
        console.log("DOM at this point:", document.querySelector('header')?.innerHTML || "Header not found");
        return;
    }

    console.log("Found buttons:", {
        loggedOutButtons: loggedOutButtons,
        loggedInButtons: loggedInButtons
    });

    // 로그인 상태 확인
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        // 로그인됨
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
        // 여러 방식으로 시도
        loggedOutButtons.style.display = 'none';
        loggedInButtons.style.display = 'block';

        // classList도 활용
        loggedOutButtons.classList.add('hidden');
        loggedInButtons.classList.remove('hidden');

        console.log("Set to logged in state");
    }

    // 로그아웃된 상태 UI 표시
    function showLoggedOutState() {
        // 여러 방식으로 시도
        loggedOutButtons.style.display = 'block';
        loggedInButtons.style.display = 'none';

        // classList도 활용
        loggedOutButtons.classList.remove('hidden');
        loggedInButtons.classList.add('hidden');

        console.log("Set to logged out state");
    }
}

/**
 * 서버에 로그인 상태 확인
 * @returns {Promise<boolean>} 로그인 되어 있으면 true
 */
async function checkWithServer() {
    try {
        console.log("Checking with server...");
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

        sessionStorage.removeItem('isLoggedIn');
        return false;
    } catch (error) {
        console.error("Error in refreshToken:", error);
        sessionStorage.removeItem('isLoggedIn');
        return false;
    }
}

/**
 * 로그아웃 버튼 클릭 이벤트 처리
 */
async function setupLogoutHandler() {
    const logoutButton = document.querySelector('#logged-in-buttons button');
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/vi/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                });

                if (response.ok) {
                    sessionStorage.removeItem('isLoggedIn');
                    showLoggedOutState();
                    window.location.href = '/';
                } else {
                    alert('로그아웃 중 오류가 발생했습니다.');
                }
            } catch (error) {
                console.error('Logout error:', error);
                alert('로그아웃 중 오류가 발생했습니다.');
            }
        });
    }
}

/**
 * 현재 페이지에 맞게 내비게이션 링크 하이라이트
 */
function highlightActiveNavLink() {
    // Get current page filename
    const currentPage = window.location.pathname;

    // Default active class
    const activeClass = 'text-primary font-medium border-b-2 border-primary pb-1';
    // Default inactive class
    const inactiveClass = 'text-gray-800 hover:text-primary font-medium';

    // Reset all navigation links
    document.querySelectorAll('nav a').forEach(link => {
        link.className = inactiveClass;
    });

    // Set active link based on current page
    if (currentPage === '/' || currentPage.includes('index.html')) {
        const homeLink = document.getElementById('nav-home');
        if (homeLink) homeLink.className = activeClass;
    } else if (currentPage.includes('match') || currentPage.includes('matching')) {
        const matchLink = document.getElementById('nav-match');
        if (matchLink) matchLink.className = activeClass;
    } else if (currentPage.includes('community')) {
        const communityLink = document.getElementById('nav-community');
        if (communityLink) communityLink.className = activeClass;
    } else if (currentPage.includes('mypage')) {
        const mypageLink = document.getElementById('nav-mypage');
        if (mypageLink) mypageLink.className = activeClass;
    }
}