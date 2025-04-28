document.addEventListener('DOMContentLoaded', function() {
  // 별점 평가 기능
  const ratingStars = document.querySelectorAll('.rating-star');
  const ratingValue = document.getElementById('rating-value');
  const ratingInput = document.getElementById('rating-input');
  let currentRating = 0;

  // 별점 클릭 이벤트
  ratingStars.forEach(star => {
    star.addEventListener('click', function() {
      const rating = parseInt(this.getAttribute('data-rating'));
      currentRating = rating;
      updateStars(rating);
      ratingValue.textContent = rating.toFixed(1);
      ratingInput.value = rating;
    });

    // 마우스 오버 이벤트
    star.addEventListener('mouseover', function() {
      const rating = parseInt(this.getAttribute('data-rating'));
      highlightStars(rating);
    });

    // 마우스 아웃 이벤트
    star.addEventListener('mouseout', function() {
      resetStars();
      if (currentRating > 0) {
        updateStars(currentRating);
      }
    });
  });

  // 별점 하이라이트 함수
  function highlightStars(rating) {
    ratingStars.forEach(star => {
      const starRating = parseInt(star.getAttribute('data-rating'));
      if (starRating <= rating) {
        star.classList.remove('text-gray-300');
        star.classList.add('text-yellow-400');
      } else {
        star.classList.remove('text-yellow-400');
        star.classList.add('text-gray-300');
      }
    });
  }

  // 별점 업데이트 함수
  function updateStars(rating) {
    ratingStars.forEach(star => {
      const starRating = parseInt(star.getAttribute('data-rating'));
      if (starRating <= rating) {
        star.classList.remove('text-gray-300');
        star.classList.add('text-yellow-400');
      } else {
        star.classList.remove('text-yellow-400');
        star.classList.add('text-gray-300');
      }
    });
  }

  // 별점 초기화 함수
  function resetStars() {
    ratingStars.forEach(star => {
      star.classList.remove('text-yellow-400');
      star.classList.add('text-gray-300');
    });
  }

  // 취소 버튼 클릭 이벤트
  const cancelButton = document.getElementById('cancel-button');
  cancelButton.addEventListener('click', function() {
    window.location.href = '/mypage-mentee.html';
  });

  // 폼 제출 이벤트
  const reviewForm = document.getElementById('review-form');
  reviewForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // 필수 입력 필드 검증
    const mentor = document.getElementById('mentor').value;
    const reviewTitle = document.getElementById('review-title').value;
    const reviewContent = document.getElementById('review-content').value;
    const category = document.getElementById('category').value;
    
    if (!mentor || currentRating === 0 || !reviewTitle || !reviewContent || !category) {
      alert('모든 필드를 입력해주세요.');
      return;
    }
    
    // 여기서 실제로는 서버에 데이터를 전송하는 코드가 들어갈 것입니다.
    // 현재는 데모 목적으로 성공 메시지를 표시하고 마이페이지로 리다이렉트합니다.
    alert('리뷰가 성공적으로 등록되었습니다.');
    window.location.href = '/mypage-mentee.html';
  });
});