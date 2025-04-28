document.addEventListener('DOMContentLoaded', function() {
  // 소셜 로그인 버튼 클릭 시 사용자 유형 선택 페이지로 리다이렉트
  const socialLoginButtons = document.querySelectorAll('button.w-full');

  socialLoginButtons.forEach(button => {
    // 호버 효과 추가
    button.classList.add('hover-scale');

    button.addEventListener('click', function(e) {
      // 기본 동작 방지
      e.preventDefault();

      // 소셜 로그인 타입 결정
      let socialType = '';
      if (this.textContent.includes('카카오')) {
        socialType = 'kakao';
      } else if (this.textContent.includes('네이버')) {
        socialType = 'naver';
      } else if (this.textContent.includes('구글')) {
        socialType = 'google';
      }

      // 사용자 유형 선택 페이지로 리다이렉트 (소셜 로그인 타입을 URL 파라미터로 전달)
      window.location.href = `user-type-selection.html?socialType=${socialType}`;
    });
  });
});
