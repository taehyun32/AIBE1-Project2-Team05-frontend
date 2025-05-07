document.addEventListener('DOMContentLoaded', function() {
  const socialLoginButtons = document.querySelectorAll('button.w-full');

  socialLoginButtons.forEach(button => {
    button.classList.add('hover-scale');

    button.addEventListener('click', function(e) {
      e.preventDefault();

      let authUrl = '';

      if (this.textContent.includes('카카오')) {
        authUrl = '/auth/oauth2/authorization/kakao';
      } else if (this.textContent.includes('네이버')) {
        authUrl = '/auth/oauth2/authorization/naver';
      } else if (this.textContent.includes('구글')) {
        authUrl = '/auth/oauth2/authorization/google';
      }

      // OAuth2 로그인 페이지로 이동
      window.location.href = authUrl;

      handleOAuthRedirect();
    });
  });

  // OAuth2 로그인 후 리다이렉트된 경우 처리
  function handleOAuthRedirect() {
    // URL에 로그인 성공 파라미터가 있는지 확인
    const urlParams = new URLSearchParams(window.location.search);
    const loggedIn = urlParams.get('loggedIn') === 'true';
    const socialType = urlParams.get('socialType');

    if (loggedIn && socialType) {
      // 로그인 성공 시 사용자 유형 선택 페이지로 이동
      window.location.href = `/user-type-selection.html?socialType=${socialType}`;
    }
  }

  // 페이지 로드 시 OAuth 리다이렉트 처리 실행
  handleOAuthRedirect();
});