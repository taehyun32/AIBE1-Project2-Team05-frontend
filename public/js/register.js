document.addEventListener('DOMContentLoaded', function() {
  const socialLoginButtons = document.querySelectorAll('button.w-full');

  socialLoginButtons.forEach(button => {
    button.classList.add('hover-scale');

    button.addEventListener('click', function(e) {
      e.preventDefault();

      let provider = '';

      if (this.textContent.includes('카카오')) {
        provider = 'kakao';
      } else if (this.textContent.includes('네이버')) {
        provider = 'naver';
      } else if (this.textContent.includes('구글')) {
        provider = 'google';
      }

      if (provider) {
        // 프론트엔드 서버의 OAuth 요청 라우트로 리다이렉트
        const url = `/oauth2/authorization/${provider}`;
        const backendUrl = `${process.env.API_URL}${url}`;  // 템플릿 리터럴 사용
        console.log(`소셜 로그인 요청: ${url}`);
        sessionStorage.setItem('isLoggedIn', 'true');
        window.location.href = backendUrl;
      }
    });
  });
});