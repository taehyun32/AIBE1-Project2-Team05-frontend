// login-redirect.js
// OAuth2 로그인 성공 후 처리를 위한 스크립트

document.addEventListener('DOMContentLoaded', function() {
    // OAuth2 로그인 성공 후 받은 응답을 확인하여 리다이렉트 처리
    async function handleOAuthResponse() {
        try {
            // 1. JSON 응답을 파싱
            const responseText = document.body.textContent.trim();
            if (!responseText) return;

            try {
                // 응답이 JSON 형식인지 확인
                const data = JSON.parse(responseText);

                // 2. 로그인 성공 여부 확인
                if (data.loggedIn) {
                    // 3. 사용자 유형 선택 페이지로 리다이렉트
                    window.location.href = `/user-type-selection.html?socialType=${data.socialType}`;
                } else {
                    // 로그인 실패 시 로그인 페이지로 리다이렉트
                    window.location.href = '/login.html';
                }
            } catch (jsonError) {
                // JSON 파싱 실패 시 무시 (일반 페이지일 수 있음)
                console.log('Not a JSON response');
            }
        } catch (error) {
            console.error('OAuth 응답 처리 중 오류:', error);
        }
    }

    // 페이지 로드 시 실행
    handleOAuthResponse();
});