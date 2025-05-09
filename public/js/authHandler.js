/**
 * 모든 페이지에서 사용할 수 있는 통합 HTML 삽입 및 로그인 상태 처리 스크립트
 */
document.addEventListener('DOMContentLoaded', function() {
    // 초기 로그인 상태 확인
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
        showLoggedInState();
    } else {
        showLoggedOutState();
    }

    // 방법 1: data-include-path 속성을 사용한 HTML 삽입
    const includeElements = document.querySelectorAll('[data-include-path]');
    if (includeElements.length > 0) {
        processIncludeElements();
    }
    // 방법 2: header-placeholder, footer-placeholder를 사용한 HTML 삽입
    else {
        processPlaceholders();
    }
});

/**
 * data-include-path 속성을 사용하여 HTML 삽입
 */
async function processIncludeElements() {
    const includeElements = document.querySelectorAll('[data-include-path]');
    const promises = [];

    includeElements.forEach(function(el) {
        const path = el.getAttribute('data-include-path');
        const promise = fetch(path)
            .then(response => response.text())
            .then(html => {
                el.innerHTML = html;

                // 이 요소가 헤더를 포함하는지 확인
                if (path.includes('header') || html.includes('id="logged-out-buttons"')) {
                    return true;
                }
                return false;
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
        checkLoginStatus();
        highlightActiveNavLink();
        setupLogoutHandler();
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
                checkLoginStatus();
                highlightActiveNavLink();
                setupLogoutHandler();
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
 * 로그인된 상태 UI 표시
 */
function showLoggedInState() {
    const loggedOutButtons = document.getElementById('logged-out-buttons');
    const loggedInButtons = document.getElementById('logged-in-buttons');
    
    if (loggedOutButtons && loggedInButtons) {
        loggedOutButtons.style.display = 'none';
        loggedInButtons.style.display = 'block';
    }
}

/**
 * 로그아웃된 상태 UI 표시
 */
function showLoggedOutState() {
    const loggedOutButtons = document.getElementById('logged-out-buttons');
    const loggedInButtons = document.getElementById('logged-in-buttons');
    
    if (loggedOutButtons && loggedInButtons) {
        loggedOutButtons.style.display = 'block';
        loggedInButtons.style.display = 'none';
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

    // URL 파라미터 확인
    const urlParams = new URLSearchParams(window.location.search);
    const isLoggedInParam = urlParams.get('loggedIn');
    const socialType = urlParams.get('socialType');

    // 소셜 로그인인 경우
    if (socialType) {
        if (isLoggedInParam === 'true') {
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('socialType', socialType);
            showLoggedInState();
            console.log("User logged in via social login:", socialType);
            return;
        }
    }

    // 일반 로그인 상태 확인
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        showLoggedInState();
        console.log("User logged in based on sessionStorage");
    } else {
        try {
            const isLoggedIn = await checkWithServer();
            if (isLoggedIn) {
                showLoggedInState();
                console.log("User logged in based on server check");
            } else {
                showLoggedOutState();
                console.log("User not logged in");
            }
        } catch (error) {
            console.error("Error checking login status:", error);
            showLoggedOutState();
        }
    }
}

/**
 * 서버에 로그인 상태 확인
 * @returns {Promise<boolean>} 로그인 되어 있으면 true
 */
async function checkWithServer() {
    try {
        const response = await fetch('/status', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include'
        });

        const data = await response.json();
        
        if (data.status === 200) {
            sessionStorage.setItem('isLoggedIn', 'true');
            showLoggedInState();
            return true;
        }

        // 401 또는 다른 에러
        sessionStorage.removeItem('isLoggedIn');
        showLoggedOutState();
        return false;
    } catch (error) {
        console.error("Error in checkWithServer:", error);
        sessionStorage.removeItem('isLoggedIn');
        showLoggedOutState();
        return false;
    }
}

/**
 * API 호출 시 401 에러 처리
 * @returns {Promise<boolean>} 토큰 갱신 성공하면 true
 */
async function handle401Error() {
    try {
        const response = await fetch('/status', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include'
        });

        const data = await response.json();
        
        if (data.status === 200) {
            sessionStorage.setItem('isLoggedIn', 'true');
            showLoggedInState();
            return true;
        }

        // 리프레시 토큰도 만료된 경우
        sessionStorage.removeItem('isLoggedIn');
        showLoggedOutState();
        return false;
    } catch (error) {
        console.error("Error handling 401:", error);
        sessionStorage.removeItem('isLoggedIn');
        showLoggedOutState();
        return false;
    }
}

// 전역에서 사용할 수 있도록 window 객체에 추가
window.handle401Error = handle401Error;

/**
 * 로그아웃 버튼 클릭 이벤트 처리
 */
async function setupLogoutHandler() {
    const logoutButton = document.querySelector('#logged-in-buttons button');
    if (logoutButton) {
        logoutButton.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await fetch('/api/logout', {
                    method: 'POST',
                    credentials: 'include'
                });
                sessionStorage.clear();
                window.location.href = '/';
            } catch (error) {
                console.error('Logout error:', error);
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

// 페이지 로드 시 로그아웃 핸들러 설정
document.addEventListener('DOMContentLoaded', setupLogoutHandler);