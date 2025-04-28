document.addEventListener('DOMContentLoaded', function() {
  // 사용자 유형 선택 기능
  const userTypeOptions = document.querySelectorAll('.user-type-option');
  const userTypeRadios = document.querySelectorAll('input[name="userType"]');
  const confirmUserTypeBtn = document.getElementById('confirmUserType');

  // URL에서 소셜 로그인 타입 파라미터 가져오기
  const urlParams = new URLSearchParams(window.location.search);
  const socialType = urlParams.get('socialType');
  
  // 초기 상태에서 첫 번째 옵션 선택 표시
  userTypeOptions[0].classList.add('selected');

  // 사용자 유형 옵션 클릭 시 라디오 버튼 선택
  userTypeOptions.forEach(option => {
    option.addEventListener('click', function() {
      const type = this.dataset.type;
      const radio = this.querySelector('input[type="radio"]');

      // 모든 라디오 버튼 선택 해제
      userTypeRadios.forEach(r => r.checked = false);

      // 클릭한 옵션의 라디오 버튼 선택
      radio.checked = true;

      // 시각적 표시 (선택된 옵션 강조)
      userTypeOptions.forEach(opt => {
        opt.classList.remove('selected');
      });

      this.classList.add('selected');

      // 애니메이션 효과 추가
      this.classList.add('animate-scaleIn');
      setTimeout(() => {
        this.classList.remove('animate-scaleIn');
      }, 300);
    });
  });

  // 선택 완료 버튼 클릭 시
  confirmUserTypeBtn.addEventListener('click', function() {
    // 선택된 사용자 유형 가져오기
    const selectedType = document.querySelector('input[name="userType"]:checked').value;

    // 로컬 스토리지에 저장 (실제 구현에서는 서버에 저장해야 함)
    localStorage.setItem('userType', selectedType);
    
    // 소셜 로그인 타입도 저장 (있는 경우)
    if (socialType) {
      localStorage.setItem('socialType', socialType);
    }

    // 사용자 유형에 따라 적절한 마이페이지로 리디렉션 (실제 로그인 후)
    console.log(`사용자 유형 "${selectedType}"으로 회원가입 진행`);
    
    // 소셜 로그인 타입이 있으면 알림 표시
    if (socialType) {
      alert(`${getSocialTypeName(socialType)}으로 ${selectedType} 유형 회원가입을 진행합니다.`);
    }

    // 실제 구현에서는 이 부분을 주석 해제하고 소셜 로그인 처리 후 리디렉션
    if (selectedType === 'mentee') {
      window.location.href = 'mypage-mentee.html';
    } else {
      window.location.href = 'mypage.html';
    }
  });
  
  // 소셜 로그인 타입 이름 가져오기
  function getSocialTypeName(type) {
    switch(type) {
      case 'kakao':
        return '카카오로';
      case 'naver':
        return '네이버로';
      case 'google':
        return '구글로';
      default:
        return '';
    }
  }
});