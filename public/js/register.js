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

    });
  });

});