// 멘토링 세션 목록을 가져오는 함수
async function loadMentoringSessions(mentorSelect) {
  if (!mentorSelect) return null;

  // 로딩 상태 표시
  mentorSelect.innerHTML = '<option value="" disabled selected>로딩 중...</option>';

  // API 호출하여 멘토링 세션 목록 가져오기
  const response = await fetch("/api/v1/mentee/review", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  // 401 에러 처리 (토큰 만료)
  if (response.status === 401) {
    const retry = await handle401Error();
    if (!retry) {
      window.location.href = "/login";
      return null;
    }
    // 토큰 갱신 성공, 요청 재시도
    return await loadMentoringSessions(mentorSelect);
  }

  // 기타 에러 처리
  if (!response.ok) {
    throw new Error("멘토링 세션 정보 로드 실패: " + response.status);
  }

  // 응답 객체만 반환
  return response;
}

// DOM이 로드되면 초기화
document.addEventListener("DOMContentLoaded", async function () {
  // URL에서 리뷰 ID 가져오기
  const urlParams = new URLSearchParams(window.location.search);
  const reviewId = urlParams.get("id");
  const isEditMode = !!reviewId;

  if (isEditMode) {
    // HTML 문서의 <title> 변경
    document.title = "재능 기부 플랫폼 - 리뷰 수정";
  }

  // 페이지 제목과 버튼 텍스트 변경
  const pageTitle = document.querySelector("h1");
  const submitButton = document.querySelector('button[type="submit"]');

  if (pageTitle && isEditMode) {
    pageTitle.textContent = "리뷰 수정";
  }

  if (submitButton && isEditMode) {
    submitButton.textContent = "리뷰 수정";
  }

  // 멘토 select 요소 가져오기
  const mentorSelect = document.getElementById("mentor");
  if (!mentorSelect) return;

  // 별점 관련 요소 선택
  const starsWrapper = document.querySelector(".stars-wrapper");
  const starHalves = document.querySelectorAll(".star-half");
  const ratingValue = document.getElementById("rating-value");
  const ratingInput = document.getElementById("rating-input");
  let currentRating = 0;

  // 수정 모드일 경우 기존 리뷰 데이터 가져오기
  if (isEditMode) {
    try {
      // 리뷰 상세 정보 가져오기
      const reviewResponse = await fetch(`/api/v1/mentee/review/${reviewId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (reviewResponse.status === 401) {
        const retry = await handle401Error();
        if (!retry) {
          window.location.href = "/login";
          return;
        }
        // 재시도
        window.location.reload();
        return;
      }

      if (!reviewResponse.ok) {
        throw new Error("리뷰 정보 로드 실패: " + reviewResponse.status);
      }

      const reviewData = await reviewResponse.json();

      if (reviewData.status === 200 && reviewData.code === "SUCCESS" && reviewData.data) {
        // 리뷰 데이터로 폼 필드 채우기
        populateReviewForm(reviewData.data);
      } else {
        throw new Error("리뷰 데이터를 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error("리뷰 데이터 로드 중 오류:", error);
      alert("리뷰 정보를 불러올 수 없습니다: " + error.message);
    }
  }

  // 멘토 목록 로드 (try-catch는 외부에서 처리)
  if (!isEditMode) {
    // 새 리뷰 작성 모드일 때만 멘토 목록 로드
    try {
      // 응답 객체 가져오기
      const response = await loadMentoringSessions(mentorSelect);

      if (response) {
        // 응답 데이터 파싱
        const responseData = await response.json();

        if (responseData.status === 200 && responseData.code === "SUCCESS" && Array.isArray(responseData.data)) {
          // 멘토 목록 업데이트
          mentorSelect.innerHTML = '<option value="" disabled selected>멘토를 선택해주세요</option>';

          // 세션이 없는 경우
          if (responseData.data.length === 0) {
            mentorSelect.innerHTML += '<option value="" disabled>리뷰 작성 가능한 세션이 없습니다</option>';
          } else {
            // 세션 목록 추가
            responseData.data.forEach((session) => {
              const option = document.createElement("option");
              option.value = session.sessionId;
              option.textContent = `${session.mentorName}`;
              mentorSelect.appendChild(option);
            });
          }
        } else {
          throw new Error("API 응답 형식이 예상과 다릅니다");
        }
      }
    } catch (error) {
      console.error("멘토링 세션 목록 로드 중 오류:", error);
      mentorSelect.innerHTML = '<option value="" disabled selected>멘토를 선택해주세요</option>';
      mentorSelect.innerHTML += '<option value="" disabled>멘토 목록을 불러올 수 없습니다</option>';
    }
  }

  // 별의 반쪽 영역에 이벤트 추가
  if (starHalves.length) {
    // 별 클릭 및 마우스 오버 이벤트
    starHalves.forEach((half) => {
      // 마우스 오버 이벤트
      half.addEventListener("mouseover", function () {
        const rating = parseFloat(this.dataset.rating);
        highlightStars(rating);
        ratingValue.textContent = rating.toFixed(1);
      });

      // 클릭 이벤트
      half.addEventListener("click", function () {
        const rating = parseFloat(this.dataset.rating);
        currentRating = rating;
        ratingInput.value = rating;
        highlightStars(rating);
        ratingValue.textContent = rating.toFixed(1);
      });
    });

    // 마우스 아웃 이벤트 (별점 컨테이너에 위임)
    if (starsWrapper) {
      starsWrapper.addEventListener("mouseout", function () {
        highlightStars(currentRating);
        ratingValue.textContent = currentRating.toFixed(1);
      });
    }
  }

  // 별점 하이라이트 함수
  function highlightStars(rating) {
    const starWrappers = document.querySelectorAll(".star-wrapper");

    starWrappers.forEach((wrapper, index) => {
      const starPosition = index + 1; // 1부터 시작
      const fillOverlay = wrapper.querySelector(".star-fill-overlay");

      if (starPosition <= Math.floor(rating)) {
        // 꽉 찬 별
        fillOverlay.style.width = "100%";
      } else if (starPosition === Math.ceil(rating) && rating % 1 !== 0) {
        // 반 별
        fillOverlay.style.width = "50%";
      } else {
        // 빈 별
        fillOverlay.style.width = "0";
      }
    });
  }

  // 리뷰 데이터로 폼 필드를 채우는 함수
  function populateReviewForm(reviewData) {
    // 멘토 선택 필드 (disabled로 변경)
    if (mentorSelect) {
      // 기존 옵션 제거
      mentorSelect.innerHTML = "";

      // 멘토 정보 추가
      const option = document.createElement("option");
      option.value = reviewData.mentoringSessionId;
      option.textContent = `${reviewData.mentorName}`;
      option.selected = true;
      mentorSelect.appendChild(option);

      // 수정 모드에서는 멘토 변경 불가
      mentorSelect.disabled = true;
    }

    // 별점 설정
    if (ratingInput && ratingValue) {
      const starRating = parseFloat(reviewData.star) || 0;
      ratingInput.value = starRating;
      ratingValue.textContent = starRating.toFixed(1);

      // 별점 UI 업데이트
      highlightStars(starRating);
      currentRating = starRating;
    }

    // 제목 및 내용 채우기
    const titleInput = document.getElementById("review-title");
    const contentInput = document.getElementById("review-content");
    if (titleInput) titleInput.value = reviewData.title || "";
    if (contentInput) contentInput.value = reviewData.content || "";

    // 카테고리 선택
    const categorySelect = document.getElementById("category");
    if (categorySelect && reviewData.interest) {
      for (let i = 0; i < categorySelect.options.length; i++) {
        if (categorySelect.options[i].value === reviewData.interest) {
          categorySelect.selectedIndex = i;
          break;
        }
      }
    }
  }

  // 취소 버튼 클릭 이벤트
  const cancelButton = document.getElementById("cancel-button");
  if (cancelButton) {
    cancelButton.addEventListener("click", function () {
      window.location.href = "/mypage-mentee";
    });
  }

  // 폼 제출 이벤트
  const reviewForm = document.getElementById("review-form");
  if (reviewForm) {
    reviewForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      // 리뷰 작성 모드
      const sessionId = document.getElementById("mentor").value;

      // 필수 입력 필드 검증
      const reviewTitle = document.getElementById("review-title").value;
      const reviewContent = document.getElementById("review-content").value;
      const category = document.getElementById("category").value;

      if ((!isEditMode && !sessionId) || currentRating === 0 || !reviewTitle || !reviewContent || !category) {
        alert("모든 필드를 입력해주세요.");
        return;
      }

      // 제출 버튼 비활성화
      const submitButton = reviewForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = isEditMode ? "수정 중..." : "등록 중...";

      try {
        // 리뷰 데이터 준비
        var reviewData;

        if (isEditMode) {
          // 수정 모드일 때는 mentoringSessionId 제외
          reviewData = {
            title: reviewTitle,
            content: reviewContent,
            star: currentRating,
            interest: category,
          };
        } else {
          // 작성 모드일 때는 mentoringSessionId 포함
          reviewData = {
            mentoringSessionId: sessionId,
            title: reviewTitle,
            content: reviewContent,
            star: currentRating,
            interest: category,
          };
        }

        // API 호출 - 수정 모드에 따라 다른 API 사용
        const apiUrl = isEditMode ? `/api/v1/mentee/review/${reviewId}` : "/api/v1/mentee/review";
        const httpMethod = isEditMode ? "PATCH" : "POST";

        const response = await fetch(apiUrl, {
          method: httpMethod,
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(reviewData),
        });

        if (response.status === 401) {
          const retry = await handle401Error();
          if (!retry) {
            window.location.href = "/login";
            return;
          }
          // 토큰 갱신 성공, 페이지 새로고침
          window.location.reload();
          return;
        }

        if (!response.ok) {
          throw new Error((isEditMode ? "리뷰 수정 실패: " : "리뷰 등록 실패: ") + response.status);
        }

        const result = await response.json();

        if (result.status === 201 && result.code === "CREATED") {
          alert(isEditMode ? "리뷰가 성공적으로 수정되었습니다." : "리뷰가 성공적으로 등록되었습니다.");
          window.location.href = "/mypage-mentee";
        } else {
          throw new Error("API 응답 형식이 예상과 다릅니다");
        }
      } catch (error) {
        console.error(isEditMode ? "리뷰 수정 중 오류 발생:" : "리뷰 등록 중 오류 발생:", error);
        alert(
          (isEditMode ? "리뷰 수정 중 오류가 발생했습니다: " : "리뷰 등록 중 오류가 발생했습니다: ") + error.message
        );
        // 버튼 상태 복원
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    });
  }
});
