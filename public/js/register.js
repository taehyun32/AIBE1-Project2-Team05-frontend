document.addEventListener('DOMContentLoaded', function () {
  const socialLoginButtons = document.querySelectorAll('button.w-full');

  socialLoginButtons.forEach(button => {
    button.classList.add('hover-scale');

    button.addEventListener('click', function (e) {
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
        
        const url = `https://backend.linkup.o-r.kr/oauth2/authorization/${provider}`; 
        console.log(`소셜 로그인 요청: ${url}`);
        sessionStorage.setItem('isLoggedIn', 'true');
        window.location.href = url;
      }
    });
  });
});
