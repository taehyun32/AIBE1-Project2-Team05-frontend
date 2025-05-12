/**
 * 모든 페이지에서 사용할 수 있는 통합 HTML 삽입 및 로그인 상태 처리 스크립트
 */
document.addEventListener('DOMContentLoaded', function() {
    // URL 파라미터 확인
    const urlParams = new URLSearchParams(window.location.search);
    const isLoggedInParam = urlParams.get('loggedIn');
    const socialType = urlParams.get('socialType');

    // 소셜 로그인인 경우
    if (socialType && isLoggedInParam === 'true') {
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('socialType', socialType);
        showLoggedInState();
    } else {
        // 일반 로그인 상태 확인
        const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
        if (isLoggedIn) {
            showLoggedInState();
        } else {
            // 세션스토리지가 없을 때 쿠키 확인
            checkCookieAndRefresh();
        }
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
                return path.includes('header') || html.includes('id="logged-out-buttons"');
            })
            .catch(error => {
                console.error(`Error loading element from ${path}:`, error);
                return false;
            });

        promises.push(promise);
    });

    // 모든 비동기 작업이 완료될 때까지 기다림
    const results = await Promise.all(promises);

    // 헤더가 포함된 경우에만 내비게이션 활성화
    if (results.some(Boolean)) {
        highlightActiveNavLink();
        setupLogoutHandler();
        
        // 헤더 로드 후 로그인 상태에 따라 UI 업데이트
        const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
        if (isLoggedIn) {
            showLoggedInState();
        } else {
            showLoggedOutState();
        }
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
                highlightActiveNavLink();
                setupLogoutHandler();

                // 마이페이지 버튼 클릭 이벤트 설정
                const myPageButton = document.querySelector('#nav-mypage');
                if (myPageButton) {
                    myPageButton.addEventListener('click', async (e) => {
                        e.preventDefault();
                        await handleMyPageClick();
                    });
                }
                
                // 헤더 로드 후 로그인 상태에 따라 UI 업데이트
                const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
                if (isLoggedIn) {
                    showLoggedInState();
                } else {
                    showLoggedOutState();
                }
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
 * 쿠키 확인 및 리프레시 토큰 발급
 */
async function checkCookieAndRefresh() {
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
            // 쿠키가 있고 유효한 경우
            sessionStorage.setItem('isLoggedIn', 'true');
            showLoggedInState();
        } else {
            // 쿠키가 없거나 만료된 경우
            sessionStorage.removeItem('isLoggedIn');
            showLoggedOutState();
        }
    } catch (error) {
        console.error("Error checking cookie:", error);
        sessionStorage.removeItem('isLoggedIn');
        showLoggedOutState();
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
            // 쿠키가 있는 경우
            sessionStorage.setItem('isLoggedIn', 'true');
            showLoggedInState();
            const retry = await refreshAccessToken();
            if (!retry) {
                return false;
            }
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
 * 리프레시 토큰으로 새로운 액세스 토큰을 발급받는 함수
 * @returns {Promise<boolean>} 성공 시 true, 실패 시 false
 */
async function refreshAccessToken() {
    try {
        const response = await fetch('/api/v1/auth/refresh', {
            method: 'POST',
            credentials: 'include', // 쿠키 기반 인증
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            // 서버가 새로운 액세스 토큰을 쿠키나 헤더로 내려줄 수 있음
            // 필요하다면 추가로 세션스토리지 등에 상태 저장 가능
            sessionStorage.setItem('isLoggedIn', 'true');
            showLoggedInState();
            return true;
        } else {
            // 리프레시 토큰 만료 등으로 실패
            sessionStorage.removeItem('isLoggedIn');
            showLoggedOutState();
            return false;
        }
    } catch (error) {
        console.error('refreshAccessToken error:', error);
        sessionStorage.removeItem('isLoggedIn');
        showLoggedOutState();
        return false;
    }
}

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
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json'
                    }
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

/**
 * 페이지 이동 처리 함수
 */
async function navigateTo(path) {
    try {
        if (path === '/community' || path === '/matching-type-selection') {
            const isRefreshed = await handle401Error();
            if (isRefreshed) {
                const role = await findUserType();
                if (role === 'ROLE_TEMP') {
                    window.location.href = '/user-type-selection';
                    return;
                } 
                window.location.href = path;
                return;
            }
            window.location.href = '/login';
            return;
        }

        // 기본 페이지 이동
        window.location.href = path;
    } catch (error) {
        console.error('Navigation error:', error);
        window.location.href = path;
    }
}

/**
 * 마이페이지 이동 처리 함수
 */
async function handleMyPageClick() {
    try {
        const response = await findUserType();
        if (response) {
            console.log('User data:', response);
            if (response.data.role === 'ROLE_MENTOR') {
                sessionStorage.setItem('nickname', response.data.nickname);
                window.location.href = '/mypage';
                return;
            } else if (response.data.role === 'ROLE_MENTEE') {
                sessionStorage.setItem('nickname', response.data.nickname);
                window.location.href = '/mypage-mentee';
                return;
            } else if (response.data.role === 'ROLE_TEMP') {
                sessionStorage.setItem('nickname', response.data.nickname);
                window.location.href = '/user-type-selection';
                return;
            }
        }
        
        // 401 에러 처리
        console.log('401 error, trying to refresh token');
        const isRefreshed = await handle401Error();
        console.log('Token refresh result:', isRefreshed);
        if (isRefreshed) {
            await handleMyPageClick();
            return;
        }
        window.location.href = '/login';
    } catch (error) {
        console.error('Error in handleMyPageClick:', error);
        window.location.href = '/login';
    }
}

/**
 * 사용자 타입 조회 함수
 */
async function findUserType() {
    try {
        const response = await fetch('/api/v1/authUser/me', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (response.status === 200) {
            const data = await response.json();
            console.log('User type response:', data);
            return data;
        }
        return null;
    } catch (error) {
        console.error('Error in findUserType:', error);
        return null;
    }
}