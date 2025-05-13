// 이미지 오류 처리 함수
function handleImageError(image) {
  image.onerror = null; // 무한 루프 방지
  image.src = "../assets/images/default-profile.png"; // 기본 이미지로 대체
}

document.addEventListener("DOMContentLoaded", function () {
  // include 요소 처리
  const includeElements = document.querySelectorAll("[data-include-path]");
  includeElements.forEach(async function (el) {
    const path = el.getAttribute("data-include-path");
    const response = await fetch(path);
    const html = await response.text();
    el.innerHTML = html;
  });

  // 탭 전환 기능
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", async function () {
      // 모든 탭 버튼에서 active 클래스 제거
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      // 클릭한 탭 버튼에 active 클래스 추가
      this.classList.add("active");

      // 모든 탭 컨텐츠 숨기기
      tabContents.forEach((content) => content.classList.add("hidden"));
      // 선택한 탭 컨텐츠 표시
      const tabId = this.getAttribute("data-tab");
      document.getElementById(tabId + "-content").classList.remove("hidden");

      // 선택된 탭에 따라 해당 API 호출
      // 세션스토리지에서 nickname을 가져옵니다
      const nickname = sessionStorage.getItem("nickname");

      if (!nickname) {
        // 닉네임이 없으면 먼저 사용자 정보를 로드합니다
        await loadUserProfile();
        return;
      }

      // 닉네임이 있으면 해당 탭에 맞는 API를 호출합니다
      if (tabId === "activity") {
        // 활동 내역 API 호출
        loadActivityData(nickname);
      } else if (tabId === "reviews") {
        // 작성 리뷰 API 호출
        loadReviewsData(nickname);
      } else if (tabId === "settings") {
        // 프로필 설정 API 호출
        loadProfileSettingsData(nickname);
      }
    });
  });

  // 세션스토리지에서 nickname 추출 및 사용자 정보 로드
  loadUserProfile();
});

// 세션스토리지에서 nickname 추출 및 사용자 정보 로드
async function loadUserProfile() {
  // 세션스토리지에서 nickname 가져오기
  const nickname = sessionStorage.getItem("nickname");

  if (!nickname) {
    console.error("세션스토리지에서 nickname을 찾을 수 없습니다.");
    window.location.href = "/";
    return;
  }

  try {
    // API 호출하여 사용자 정보 가져오기
    const response = await fetch(`/api/v1/users/${nickname}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (response.status === 401) {
      const retry = await handle401Error();
      if (!retry) {
        window.location.href = "/login";
        return;
      }
      // 토큰 갱신 성공, 요청 재시도
      return await loadUserProfile();
    }

    if (!response.ok) {
      console.error("사용자 정보 요청 실패:", response.status);
      showErrorMessage("사용자 정보를 불러올 수 없습니다.");
      return;
    }

    const result = await response.json();

    if (result.status === 200 && result.code === "SUCCESS" && result.data) {
      // 만약 사용자가 mentor인 경우 /mypage로 리다이렉트
      if (result.data.role === "MENTOR") {
        window.location.href = "/mypage";
        return;
      }

      updateUserProfile(result.data);

      // me 값에 따라 탭 버튼 표시/숨김 처리
      handleTabVisibility(result.data.me);
    } else {
      console.error("API 응답 형식이 예상과 다릅니다:", result);
      showErrorMessage("사용자 정보를 불러올 수 없습니다.");
    }
  } catch (error) {
    console.error("사용자 정보 조회 중 오류 발생:", error);
    showErrorMessage("사용자 정보를 불러올 수 없습니다.");
  }
}

// 사용자 프로필 정보 업데이트
function updateUserProfile(userData) {
  // 프로필 이미지 업데이트
  const profileImage = document.getElementById("profile-image");
  if (profileImage) {
    profileImage.src = userData.profileImageUrl || "../assets/images/default-profile.png";
    profileImage.onerror = function () {
      handleImageError(this);
    };
  }

  // 닉네임 업데이트
  const nameElement = document.getElementById("user-nickname");
  if (nameElement) {
    nameElement.textContent = userData.nickname || "이름 없음";
  }

  // 관심 분야 및 지역 업데이트
  const infoElement = document.getElementById("user-info");
  if (infoElement) {
    const interest = userData.interest || "";
    const location = (userData.area || "") + (userData.sigungu ? " " + userData.sigungu : "");
    infoElement.textContent = `${interest} | ${location}`;
  }

  // 소개글 업데이트
  const introElement = document.getElementById("user-introduction");
  if (introElement) {
    introElement.textContent = userData.introduction || "소개글이 없습니다.";
  }

  // 태그 업데이트
  const tagsContainer = document.getElementById("user-tags");
  if (tagsContainer && userData.tag) {
    tagsContainer.innerHTML = ""; // 기존 태그 제거

    // 태그 문자열을 배열로 변환 (쉼표로 구분된 경우)
    const tags = userData.tag.split(",").map((tag) => tag.trim());

    // 태그 추가
    tags.forEach((tag) => {
      if (tag) {
        const tagElement = document.createElement("span");
        tagElement.className = "bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full";
        tagElement.textContent = `#${tag}`;
        tagsContainer.appendChild(tagElement);
      }
    });
  }
}

// me 값에 따라 탭 버튼 표시/숨김 처리
function handleTabVisibility(isMe) {
  const reviewsTabButton = document.getElementById("reviews-tab");
  const settingsTabButton = document.getElementById("settings-tab");

  if (!isMe) {
    // 본인이 아닌 경우 리뷰 및 설정 탭 버튼 숨김
    if (reviewsTabButton) reviewsTabButton.style.display = "none";
    if (settingsTabButton) settingsTabButton.style.display = "none";
  } else {
    // 본인인 경우 모든 탭 버튼 표시
    if (reviewsTabButton) reviewsTabButton.style.display = "";
    if (settingsTabButton) settingsTabButton.style.display = "";
  }
}

// 활동 내역 데이터 로드
async function loadActivityData(nickname) {
  // nickname이 없으면 세션스토리지에서 가져옵니다
  if (!nickname) {
    nickname = sessionStorage.getItem("nickname");
    if (!nickname) {
      console.error("닉네임 정보가 없습니다.");
      return;
    }
  }

  // 여기에 활동 내역 데이터 로드 로직 구현 (틀만)
  console.log("활동 내역 데이터 로드:", nickname);
}

// 프로필 설정 데이터 로드
async function loadProfileSettingsData(nickname) {
  // nickname이 없으면 세션스토리지에서 가져옵니다
  if (!nickname) {
    nickname = sessionStorage.getItem("nickname");
    if (!nickname) {
      console.error("닉네임 정보가 없습니다.");
      return;
    }
  }

  // 여기에 프로필 설정 데이터 로드 로직 구현 (틀만)
  console.log("프로필 설정 데이터 로드:", nickname);
}

// 작성 리뷰 데이터 로드
async function loadReviewsData(nickname) {
  // nickname이 없으면 세션스토리지에서 가져옵니다
  if (!nickname) {
    nickname = sessionStorage.getItem("nickname");
    if (!nickname) {
      console.error("닉네임 정보가 없습니다.");
      return;
    }
  }

  // 리뷰 컨테이너와 페이지네이션 컨테이너
  const reviewsContainer = document.getElementById("reviews-container");
  const paginationContainer = document.getElementById("reviews-pagination");

  if (reviewsContainer) {
    reviewsContainer.innerHTML = `
      <div class="text-center py-6 text-gray-500">
        <div class="w-8 h-8 mx-auto mb-3">
          <div class="spinner"></div>
        </div>
        <p>리뷰 데이터를 불러오는 중입니다...</p>
      </div>
    `;
  }

  if (paginationContainer) {
    paginationContainer.innerHTML = "";
  }

  try {
    // API 호출하여 리뷰 데이터 가져오기
    const response = await fetch(`/api/v1/mentee/review/list/${nickname}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (response.status === 401) {
      const retry = await handle401Error();
      if (!retry) {
        window.location.href = "/login";
        return;
      }
      // 토큰 갱신 성공, 요청 재시도
      return await loadReviewsData(nickname);
    }

    if (!response.ok) {
      console.error("리뷰 데이터 요청 실패:", response.status);
      if (reviewsContainer) {
        reviewsContainer.innerHTML = `
          <div class="text-center py-6 text-gray-500">
            <div class="w-12 h-12 mx-auto mb-3 text-red-500">
              <i class="ri-error-warning-line text-3xl"></i>
            </div>
            <p>리뷰 데이터를 불러올 수 없습니다.</p>
          </div>
        `;
      }
      return;
    }

    const result = await response.json();

    if (result.status === 200 && result.code === "SUCCESS") {
      // 리뷰 데이터 처리 및 화면에 표시
      updateReviewsData(result.data);
    } else {
      console.error("API 응답 형식이 예상과 다릅니다:", result);
      if (reviewsContainer) {
        reviewsContainer.innerHTML = `
          <div class="text-center py-6 text-gray-500">
            <p>작성한 리뷰가 없습니다.</p>
          </div>
        `;
      }
    }
  } catch (error) {
    console.error("리뷰 데이터 조회 중 오류 발생:", error);
    if (reviewsContainer) {
      reviewsContainer.innerHTML = `
        <div class="text-center py-6 text-gray-500">
          <div class="w-12 h-12 mx-auto mb-3 text-red-500">
            <i class="ri-error-warning-line text-3xl"></i>
          </div>
          <p>데이터를 불러올 수 없습니다.</p>
        </div>
      `;
    }
  }
}

// 리뷰 데이터 업데이트
function updateReviewsData(data) {
  const reviewsContainer = document.getElementById("reviews-container");
  const paginationContainer = document.getElementById("reviews-pagination");

  if (!reviewsContainer) return;

  // 데이터가 없는 경우
  if (!data || data.length === 0) {
    reviewsContainer.innerHTML = `
      <div class="text-center py-6 text-gray-500">
        <p>작성한 리뷰가 없습니다.</p>
      </div>
    `;
    return;
  }

  // 리뷰 목록 HTML 생성
  let reviewsHTML = '<div class="space-y-6">';

  data.forEach((review) => {
    // 별점 HTML 생성
    const starRating = parseFloat(review.star) || 0;
    const fullStars = Math.floor(starRating);
    const halfStar = starRating % 1 >= 0.5;

    let starsHTML = "";
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        starsHTML += '<i class="ri-star-fill text-yellow-400"></i>';
      } else if (i === fullStars && halfStar) {
        starsHTML += '<i class="ri-star-half-fill text-yellow-400"></i>';
      } else {
        starsHTML += '<i class="ri-star-line text-yellow-400"></i>';
      }
    }

    // 관심분야 표시 (api 수정 후 사라질 예정)
    let interestText = "";
    switch (review.interest) {
      case "WEB_DEV":
        interestText = "프로그래밍/웹개발";
        break;
      case "APP_DEV":
        interestText = "프로그래밍/앱개발";
        break;
      case "DESIGN_UX_UI":
        interestText = "디자인/UX/UI";
        break;
      case "DESIGN_GRAPHIC":
        interestText = "디자인/그래픽";
        break;
      case "EDUCATION_MATH":
        interestText = "교육/수학";
        break;
      case "EDUCATION_ENGLISH":
        interestText = "교육/영어";
        break;
      case "MUSIC_PIANO":
        interestText = "음악/피아노";
        break;
      case "FITNESS_YOGA":
        interestText = "운동/요가";
        break;
      default:
        interestText = review.interest || "기타";
    }

    // 현재 날짜 생성 (실제로는 API에서 날짜를 받아와야 함)
    const createdDate = new Date();
    const formattedDate = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, "0")}-${String(
      createdDate.getDate()
    ).padStart(2, "0")}`;

    reviewsHTML += `
      <div class="border border-gray-200 rounded-lg p-6 hover:shadow-md transition" data-review-id="${
        review.mentoringSessionId
      }">
        <div class="flex justify-between items-start mb-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
              <img
                src="../assets/images/default-profile.png"
                alt="프로필"
                class="w-full h-full object-cover"
                onerror="handleImageError(this)"
              />
            </div>
            <div>
              <h3 class="font-medium">${interestText} 멘토링</h3>
              <p class="text-xs text-gray-500">${formattedDate} 작성</p>
            </div>
          </div>
          <div class="flex items-center">
            ${starsHTML}
            <span class="ml-1 text-sm font-medium text-yellow-400">${starRating.toFixed(1)}</span>
          </div>
        </div>
        <div class="mb-4">
          <h4 class="font-medium mb-2">${review.title}</h4>
          <p class="text-gray-700">${review.content}</p>
        </div>
        <div class="flex justify-end">
          <div class="flex items-center gap-2">
            <button class="text-gray-500 hover:text-primary edit-review-btn" data-review-id="${
              review.mentoringSessionId
            }">
              <i class="ri-edit-line"></i>
            </button>
            <button class="text-gray-500 hover:text-red-500 delete-review-btn" data-review-id="${
              review.mentoringSessionId
            }">
              <i class="ri-delete-bin-line"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  });

  reviewsHTML += "</div>";
  reviewsContainer.innerHTML = reviewsHTML;

  // 리뷰 수정 버튼에 이벤트 리스너 추가
  const editButtons = document.querySelectorAll(".edit-review-btn");
  editButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const reviewId = this.getAttribute("data-review-id");
      editReview(reviewId);
    });
  });

  // 리뷰 삭제 버튼에 이벤트 리스너 추가
  const deleteButtons = document.querySelectorAll(".delete-review-btn");
  deleteButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const reviewId = this.getAttribute("data-review-id");
      deleteReview(reviewId);
    });
  });

  // 페이지네이션은 추가 예정..
  if (paginationContainer) {
    paginationContainer.innerHTML = `
      <nav class="inline-flex rounded-md shadow-sm">
        <a href="#" class="px-3 py-2 border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 rounded-l-md opacity-50 cursor-not-allowed">이전</a>
        <a href="#" class="px-3 py-2 border-t border-b border-gray-300 bg-primary text-white">1</a>
        <a href="#" class="px-3 py-2 border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 rounded-r-md opacity-50 cursor-not-allowed">다음</a>
      </nav>
    `;
  }
}

// 리뷰 수정 함수 추가 예정
function editReview(reviewId) {
  console.log(`리뷰 ${reviewId} 수정`);
  // 수정 페이지로 이동하거나 모달 창 표시
  window.location.href = `/edit-review.html?id=${reviewId}`;
}

// 리뷰 삭제 함수 추가 예정
function deleteReview(reviewId) {
  console.log(`리뷰 ${reviewId} 삭제`);

  if (confirm("정말 이 리뷰를 삭제하시겠습니까?")) {
    // API 호출하여 리뷰 삭제
    fetch(`/api/v1/mentee/review/${reviewId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status === 401) {
          return handle401Error().then((retry) => {
            if (retry) {
              return deleteReview(reviewId);
            } else {
              window.location.href = "/login";
            }
          });
        }

        if (!response.ok) {
          throw new Error("리뷰 삭제 실패");
        }

        return response.json();
      })
      .then((data) => {
        if (data.status === 200 || data.status === 204) {
          alert("리뷰가 삭제되었습니다.");
          // 리뷰 목록 다시 로드
          const nickname = sessionStorage.getItem("nickname");
          if (nickname) {
            loadReviewsData(nickname);
          }
        } else {
          alert("리뷰 삭제에 실패했습니다.");
        }
      })
      .catch((error) => {
        console.error("리뷰 삭제 중 오류 발생:", error);
        alert("리뷰 삭제 중 오류가 발생했습니다.");
      });
  }
}

// 오류 메시지 표시
function showErrorMessage(message) {
  // 메인 컨테이너에 오류 메시지 표시
  const mainContainer = document.querySelector("main.container");

  if (mainContainer) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "bg-white rounded-lg shadow-sm p-6 mb-6 text-center";
    errorDiv.innerHTML = `
      <div class="w-16 h-16 mx-auto mb-4 text-red-500">
        <i class="ri-error-warning-line text-4xl"></i>
      </div>
      <p class="text-lg font-medium text-gray-800">${message}</p>
      <p class="text-gray-600 mt-2">페이지를 새로고침하거나 다시 로그인해보세요.</p>
      <button onclick="window.location.reload()" class="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-600">
        새로고침
      </button>
    `;

    mainContainer.innerHTML = "";
    mainContainer.appendChild(errorDiv);
  }
}
