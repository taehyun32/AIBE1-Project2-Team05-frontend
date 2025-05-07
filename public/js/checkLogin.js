/**
 * 로그인 상태 및 쿠키 관련 유틸리티 함수
 */

// 모든 쿠키 출력 (디버깅용)
function logAllCookies() {
    console.log('현재 모든 쿠키:', document.cookie);

    const cookies = document.cookie.split(';');
    if (cookies.length === 1 && cookies[0] === '') {
        console.log('쿠키가 없습니다.');
        return;
    }

    cookies.forEach((cookie, index) => {
        console.log(`쿠키 ${index + 1}: ${cookie.trim()}`);
    });
}

// JWT 토큰 쿠키 확인
function checkJwtCookie() {
    const jwtCookie = getCookie('jwt_token');
    console.log('JWT 토큰 상태:', jwtCookie ? '존재함' : '없음');
    return !!jwtCookie;
}

// 특정 이름의 쿠키 값 가져오기
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// 로그인 상태 확인 (header.html의 함수 향상 버전)
function checkLoginStatus() {
    const cookies = document.cookie.split(';');

    // 각 쿠키 로그
    console.log('로그인 쿠키 확인 중...');

    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();

        // JWT 토큰 확인
        if (cookie.startsWith('jwt_token=') && cookie.substring(10) !== '') {
            console.log('jwt_token 쿠키 발견');
            return true;
        }

        // 기존 체크 로직 유지
        if (cookie.startsWith('isLoggedIn=true')) {
            console.log('isLoggedIn 쿠키 발견');
            return true;
        }
        if (cookie.startsWith('authToken=') && cookie.substring(10) !== '') {
            console.log('authToken 쿠키 발견');
            return true;
        }
        if (cookie.startsWith('sessionId=') && cookie.substring(10) !== '') {
            console.log('sessionId 쿠키 발견');
            return true;
        }
    }

    console.log('로그인 관련 쿠키가 없음');
    return false;
}

// 세션 정보 API 호출 테스트
async function checkSessionAPI() {
    try {
        console.log('세션 API 호출 테스트 중...');
        const res = await fetch('/auth/v1/auth/session-info', {
            credentials: 'include', // 중요: 쿠키 포함
        });

        console.log('세션 API 응답 상태:', res.status);

        if (!res.ok) {
            throw new Error(`세션 확인 실패: ${res.status}`);
        }

        const data = await res.json();
        console.log('세션 API 응답 데이터:', data);

        return data.loggedIn;
    } catch (err) {
        console.error('세션 체크 API 호출 오류:', err);
        return false;
    }
}

// 페이지 로드 시 자동 실행
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 로그인 상태 확인 도구 실행됨');
    logAllCookies();
    const isLoggedIn = checkLoginStatus();
    console.log('로그인 상태:', isLoggedIn ? '✅ 로그인됨' : '❌ 로그인 안됨');

    // 필요하다면 세션 API 호출
    // checkSessionAPI().then(result => {
    //   console.log('세션 API 확인 결과:', result ? '✅ 로그인됨' : '❌ 로그인 안됨');
    // });
});