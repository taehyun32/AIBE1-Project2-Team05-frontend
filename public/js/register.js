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
        const url = `http://localhost:3000/oauth2/authorization/${provider}`;

        sessionStorage.setItem('isLoggedIn', 'true');
        window.location.href = url;
      }
    });
  });
});