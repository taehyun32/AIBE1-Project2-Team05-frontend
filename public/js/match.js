// 이미지 오류 처리 함수
function handleImageError(image) {
  image.onerror = null; // 무한 루프 방지
  image.src = "../assets/images/default-profile.png"; // 기본 이미지로 대체
}

document.addEventListener("DOMContentLoaded", function () {
  const profileDetail = document.getElementById("profileDetail");
  const defaultMessage = document.getElementById("defaultMessage");

  const regionButton = document.getElementById("regionButton");
  const regionDropdown = document.getElementById("regionDropdown");
  const sigunguButton = document.getElementById("sigunguButton");

  const categoryButton = document.getElementById("categoryButton");
  const categoryDropdown = document.getElementById("categoryDropdown");

  // 검색 버튼 클릭 이벤트 리스너
  const searchButton = document.getElementById("searchButton");
  if (searchButton) {
    searchButton.addEventListener("click", performSearch);
  }

  async function performSearch() {
    if (searchButton) {
      searchButton.disabled = true;
      searchButton.textContent = "검색 중...";
    }

    // 선택된 카테고리 가져오기
    const interest = categoryButton.getAttribute("data-category");

    // 선택된 지역 및 시군구 코드 가져오기
    const areaCode = regionButton.getAttribute("data-area");
    const sigunguCode = sigunguButton.getAttribute("data-sigungu");

    // 선택된 시간대 가져오기
    const selectedTimeCheckboxes = document.querySelectorAll("input[data-time]:checked");
    const activityTimes = Array.from(selectedTimeCheckboxes).map((checkbox) => checkbox.getAttribute("data-time"));

    // 선택된 활동 유형 가져오기
    const selectedTypeRadio = document.querySelector('input[name="activityType"]:checked');
    const activityType = selectedTypeRadio ? selectedTypeRadio.getAttribute("data-type") : "ALL";

    // API 요청 데이터 생성
    const requestData = {
      interest: interest,
      areaCode: parseInt(areaCode),
      sigunguCode: parseInt(sigunguCode),
      // activityTime: activityTimes.length > 0 ? activityTimes[0] : null,
      activityTime: activityTimes.length > 0 ? activityTimes : null,
      activityType: activityType === "ALL" ? null : activityType,
    };

    // 매칭 목록 API 호출 함수
    async function searchMatchingList() {
      const response = await fetch("/api/v1/matching/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestData),
      });

      // console.log("응답 상태:", response.status);

      if (response.status === 401) {
        const retry = await handle401Error();
        if (!retry) {
          window.location.href = "/login";
          return;
        }
        // 토큰 갱신 성공, 요청 재시도
        return await searchMatchingList();
      }

      if (!response.ok) {
        throw new Error("API 요청 실패: " + response.status);
      }

      return response.json();
    }

    try {
      const result = await searchMatchingList();

      if (result.status === 200 && result.code === "SUCCESS" && Array.isArray(result.data)) {
        // 데이터가 배열이면서 결과가 있는 경우
        if (result.data.length > 0) {
          displaySearchResults(result.data);
        } else {
          // 빈 배열인 경우 (검색 결과 없음)
          console.log("검색 결과가 없습니다");
          displayNoResults();
        }
      } else {
        console.error("API 응답 형식이 예상과 다릅니다:", result);
        displayNoResults();
      }
    } catch (error) {
      console.error("매칭 검색 중 오류 발생:", error);
      displayNoResults();
    } finally {
      // 검색 버튼 상태 복원
      if (searchButton) {
        searchButton.disabled = false;
        searchButton.textContent = "검색하기";
      }
    }
  }

  // 멘토 상세 정보 API 호출 함수
  async function fetchMentorDetail(nickname) {
    const response = await fetch(`/api/v1/matching/${nickname}`, {
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
      return await fetchMentorDetail(nickname);
    }

    if (!response.ok) {
      throw new Error("API 요청 실패: " + response.status);
    }

    return response.json();
  }

  // 매칭하기 API 호출 함수
  async function requestMatching(nickname) {
    const matchingResponse = await fetch(`/api/v1/matching/${nickname}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (matchingResponse.status === 401) {
      const retry = await handle401Error();
      if (!retry) {
        window.location.href = "/login";
        return;
      }
      // 토큰 갱신 성공, 요청 재시도
      return await requestMatching(nickname);
    }

    if (!matchingResponse.ok) {
      throw new Error("API 요청 실패: " + matchingResponse.status);
    }

    return matchingResponse.json();
  }

  // 검색 결과 표시 함수
  function displaySearchResults(results) {
    // 스크롤 컨테이너 찾기 (overflow-y-auto와 custom-scrollbar 클래스를 가진 요소)
    const scrollContainer = document.querySelector(".space-y-4.overflow-y-auto.custom-scrollbar");

    if (!scrollContainer) {
      console.error("스크롤 컨테이너를 찾을 수 없습니다.");
      return;
    }

    // 기존 프로필 카드 제거 (컨테이너 자체는 유지)
    scrollContainer.innerHTML = "";

    // 결과가 없는 경우
    if (!results || results.length === 0) {
      scrollContainer.innerHTML = `
      <div class="flex flex-col items-center justify-center py-10 text-gray-500">
        <div class="w-12 h-12 flex items-center justify-center mb-2">
          <i class="ri-search-line ri-2x"></i>
        </div>
        <p class="text-lg">검색 결과가 없습니다</p>
        <p class="text-sm mt-2">다른 검색 조건을 선택해보세요</p>
      </div>
    `;

      // 상세 정보 영역 초기화
      const profileDetail = document.getElementById("profileDetail");
      const defaultMessage = document.getElementById("defaultMessage");

      if (profileDetail && defaultMessage) {
        profileDetail.classList.add("hidden");
        defaultMessage.classList.remove("hidden");
      }

      return;
    }

    // 결과가 있는 경우 - 각 멘토에 대한 프로필 카드 생성
    results.forEach((mentor) => {
      const profileCard = document.createElement("div");
      profileCard.className =
        "border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer profile-card";
      profileCard.setAttribute("data-profile-id", mentor.mentorId);

      const displayTime = mentor.activityTime;
      const displayInterest = mentor.interest;
      const location = `${mentor.areaName} ${mentor.sigunguName}`;

      profileCard.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
         <img
            src="${mentor.profileImageUrl || "../assets/images/default-profile.png"}"
            alt="프로필"
            class="w-full h-full object-cover"
            onerror="handleImageError(this)" />
        </div>
        <div class="flex-1">
          <div class="flex justify-between items-start">
            <h3 class="font-medium">${mentor.nickname}</h3>
            <div class="flex items-center text-sm text-gray-500">
              <div class="w-4 h-4 flex items-center justify-center mr-1">
                <i class="ri-map-pin-line"></i>
              </div>
              <span>${location}</span>
            </div>
          </div>
          <p class="text-primary text-sm font-medium mt-1">${displayInterest}</p>
          <p class="text-sm text-gray-600 mt-2">
            ${mentor.introduction || "소개가 없습니다."}
          </p>
          <div class="flex items-center justify-between mt-3">
            <div class="flex items-center text-sm text-gray-500">
              <div class="w-4 h-4 flex items-center justify-center mr-1">
                <i class="ri-time-line"></i>
              </div>
              <span>${displayTime}</span>
            </div>
            <div class="text-sm text-gray-500">
              ${mentor.activityType}
            </div>
          </div>
        </div>
      </div>`;

      // 현재 사용자 정보 가져오기 API 함수
      async function getCurrentUserInfo() {
        const response = await fetch("/api/v1/authUser/me", {
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
            return null;
          }
          // 토큰 갱신 성공, 요청 재시도
          return await getCurrentUserInfo();
        }

        if (!response.ok) {
          throw new Error("API 요청 실패: " + response.status);
        }

        return response.json();
      }

      // 프로필 카드 클릭 이벤트
      profileCard.addEventListener("click", async function () {
        try {
          // 멘토 상세 정보 API 호출 함수
          const result = await fetchMentorDetail(mentor.nickname);

          if (result.status === 200 && result.code === "SUCCESS" && result.data) {
            const mentorData = result.data;

            // 프로필 상세 정보 업데이트
            document.getElementById("profileDetailImg").src =
              mentorData.profileImageUrl || "../assets/images/default-profile.png";
            document.getElementById("profileDetailImg").onerror = function () {
              handleImageError(this);
            };
            document.getElementById("profileDetailName").textContent = mentorData.nickname;
            document.getElementById("profileDetailCategory").textContent = mentorData.interest;
            document.getElementById("profileDetailLocation").textContent = `${mentorData.area} ${mentorData.sigungu}`;
            document.getElementById("profileDetailTime").textContent = mentorData.activityTime;
            document.getElementById("profileDetailIntro").textContent = mentorData.introduction || "소개가 없습니다.";

            // 매칭하기 버튼 이벤트 리스너 추가
            const matchingButton = document.getElementById("matchingButton");
            if (matchingButton) {
              matchingButton.onclick = async function (event) {
                // 이벤트 버블링 방지
                event.stopPropagation();

                const originalText = matchingButton.textContent;
                matchingButton.disabled = true;
                matchingButton.textContent = "매칭 중";
                matchingButton.classList.add("opacity-70", "cursor-not-allowed");

                try {
                  // 매칭하기 API 호출 함수
                  const matchingResult = await requestMatching(mentorData.nickname);

                  if (matchingResult.status === 201 && matchingResult.code === "CREATED") {
                    // 성공적으로 멘토링 요청이 전송된 경우
                    alert("매칭 신청이 성공적으로 완료되었습니다.");

                    // 현재 사용자 정보 가져오기
                    const userResult = await getCurrentUserInfo();

                    if (userResult.status === 200 && userResult.code === "SUCCESS" && userResult.data) {
                      // 세션 스토리지에 닉네임 저장
                      sessionStorage.setItem("nickname", userResult.data.nickname);
                    } else {
                      console.error("사용자 정보를 가져오는데 실패했습니다:", userResult);
                      sessionStorage.removeItem("nickname");
                    }

                    matchingButton.textContent = "매칭완료";
                    window.location.href = `/more-details?type=my-matches`;
                  }
                } catch (error) {
                  console.error("멘토 매칭 요청 중 오류 발생:", error);
                  alert("매칭 요청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");

                  // 버튼 상태 복원
                  matchingButton.disabled = false;
                  matchingButton.textContent = originalText;
                  matchingButton.classList.remove("opacity-70", "cursor-not-allowed");
                }
              };
            }

            // 게시글 목록 업데이트
            const postsContainer = document.getElementById("profileDetailPosts");
            postsContainer.innerHTML = "";

            if (mentorData.communityPosts && mentorData.communityPosts.length > 0) {
              // API에서 받아온 게시글 데이터 사용
              mentorData.communityPosts.forEach((post) => {
                const createdAt = new Date(post.createdAt);
                const formattedDate = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(
                  2,
                  "0"
                )}-${String(createdAt.getDate()).padStart(2, "0")}`;

                const postElement = document.createElement("div");
                postElement.className =
                  "border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition";
                postElement.dataset.postId = post.communityId;
                postElement.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                  <h4 class="text-lg font-medium">${post.title}</h4>
                  <span class="text-sm text-gray-500">${formattedDate}</span>
                </div>
                <p class="text-gray-700 mb-3">${post.content}</p>
                <div class="flex items-center space-x-4">
                  <button class="flex items-center text-gray-500 hover:text-primary">
                    <div class="w-5 h-5 flex items-center justify-center mr-1">
                      <i class="ri-heart-line"></i>
                    </div>
                    <span>${post.likeCount || 0}</span>
                  </button>
                  <button class="flex items-center text-gray-500 hover:text-primary">
                    <div class="w-5 h-5 flex items-center justify-center mr-1">
                      <i class="ri-chat-1-line"></i>
                    </div>
                    <span>${post.comments || 0}</span>
                  </button>
                </div>
              `;

                // 게시글 클릭 이벤트 추가
                postElement.addEventListener("click", function (event) {
                  // 좋아요나 댓글 버튼 클릭 시 이벤트 전파 방지
                  if (event.target.closest("button")) {
                    return;
                  }

                  const postId = this.dataset.postId;
                  window.location.href = `/community-detail?postId=${postId}`;
                });

                postsContainer.appendChild(postElement);
              });
            } else {
              // 게시글이 없는 경우
              postsContainer.innerHTML = `
              <div class="text-center py-6 text-gray-500">
                <p>작성된 게시글이 없습니다.</p>
              </div>
            `;
            }

            // 상세 정보 표시
            const profileDetail = document.getElementById("profileDetail");
            const defaultMessage = document.getElementById("defaultMessage");

            if (profileDetail && defaultMessage) {
              profileDetail.classList.remove("hidden");
              defaultMessage.classList.add("hidden");
            }
          } else {
            console.error("API 응답 형식이 예상과 다릅니다:", result);
            showErrorMessage();
          }
        } catch (error) {
          console.error("멘토 상세 정보 조회 중 오류 발생:", error);
          showErrorMessage();
        }
      });

      // 스크롤 컨테이너에 카드 추가
      scrollContainer.appendChild(profileCard);
    });
  }

  // 검색 결과가 없는 경우 표시
  function displayNoResults() {
    // 스크롤 컨테이너 찾기
    const scrollContainer = document.querySelector(".space-y-4.overflow-y-auto.custom-scrollbar");

    if (scrollContainer) {
      scrollContainer.innerHTML = `
      <div class="flex flex-col items-center justify-center py-10 text-gray-500">
        <div class="w-12 h-12 flex items-center justify-center mb-2">
          <i class="ri-search-line ri-2x"></i>
        </div>
        <p class="text-lg">검색 결과가 없습니다</p>
        <p class="text-sm mt-2">다른 검색 조건을 선택해보세요</p>
      </div>
    `;
    }

    // 상세 정보 영역 초기화
    const profileDetail = document.getElementById("profileDetail");
    const defaultMessage = document.getElementById("defaultMessage");

    if (profileDetail && defaultMessage) {
      profileDetail.classList.add("hidden");
      defaultMessage.classList.remove("hidden");
    }
  }

  // 오류 메시지 표시
  function showErrorMessage() {
    // 프로필 상세 정보 영역
    const profileDetail = document.getElementById("profileDetail");
    const defaultMessage = document.getElementById("defaultMessage");

    // 기본 메시지 영역의 내용을 오류 메시지로 변경
    if (defaultMessage) {
      defaultMessage.innerHTML = `
      <div class="flex flex-col items-center justify-center py-20 text-gray-500">
        <div class="w-16 h-16 flex items-center justify-center mb-4 text-red-500">
          <i class="ri-error-warning-line ri-3x"></i>
        </div>
        <p class="text-lg">정보를 불러오는 중 오류가 발생했습니다</p>
        <p class="text-sm mt-2">잠시 후 다시 시도해주세요</p>
      </div>
    `;
    }

    // 상세 정보 숨기고 오류 메시지 표시
    if (profileDetail && defaultMessage) {
      profileDetail.classList.add("hidden");
      defaultMessage.classList.remove("hidden");
    }
  }

  // 카테고리 드롭다운
  if (categoryButton && categoryDropdown) {
    categoryButton.addEventListener("click", function () {
      categoryDropdown.classList.toggle("hidden");
    });
    document.addEventListener("click", function (event) {
      if (!categoryButton.contains(event.target) && !categoryDropdown.contains(event.target)) {
        categoryDropdown.classList.add("hidden");
      }
    });
    const categoryOptions = categoryDropdown.querySelectorAll("button");
    categoryOptions.forEach((option) => {
      option.addEventListener("click", function () {
        categoryButton.querySelector("span").textContent = this.textContent;
        categoryButton.setAttribute("data-category", this.getAttribute("data-category"));
        categoryDropdown.classList.add("hidden");
      });
    });
  }

  // 지역 드롭다운
  if (regionButton && regionDropdown) {
    regionButton.addEventListener("click", function () {
      regionDropdown.classList.toggle("hidden");
    });

    document.addEventListener("click", function (event) {
      if (!regionButton.contains(event.target) && !regionDropdown.contains(event.target)) {
        regionDropdown.classList.add("hidden");
      }
    });

    const regionOptions = regionDropdown.querySelectorAll("button");
    regionOptions.forEach((option) => {
      option.addEventListener("click", function () {
        regionButton.querySelector("span").textContent = this.textContent;
        regionButton.setAttribute("data-area", this.getAttribute("data-area"));
        regionDropdown.classList.add("hidden");

        // 선택한 지역에 따라 시군구 드롭다운 업데이트
        const areaCode = this.getAttribute("data-area");
        fetchSigunguData(areaCode);
      });
    });
  }

  // 시군구 드롭다운 기능 추가
  const sigunguDropdown = document.getElementById("sigunguDropdown");
  const sigunguOptions = document.getElementById("sigunguOptions");
  if (sigunguButton && sigunguDropdown) {
    // 시군구 버튼 클릭 시 드롭다운 표시
    sigunguButton.addEventListener("click", function () {
      // 지역이 선택되어 있는지 확인
      const selectedArea = regionButton.getAttribute("data-area");

      if (selectedArea) {
        // 이미 지역이 선택되어 있으면 시군구 드롭다운 토글
        sigunguDropdown.classList.toggle("hidden");

        // 시군구 옵션이 비어있다면 데이터 다시 불러오기
        if (sigunguOptions.children.length === 0) {
          fetchSigunguData(selectedArea);
        }
      }
    });

    // 시군구 드롭다운 닫기
    document.addEventListener("click", function (event) {
      if (!sigunguButton.contains(event.target) && !sigunguDropdown.contains(event.target)) {
        sigunguDropdown.classList.add("hidden");
      }
    });
  }
});

// 시군구 데이터를 fetch로 가져오는 함수
async function fetchSigunguData(areaCode) {
  // 시군구 JSON 파일 경로
  const sigunguJsonUrl = "/data/sigungu.json";

  try {
    // fetch로 시군구 JSON
    const response = await fetch(sigunguJsonUrl);
    const data = await response.json();

    // 해당 지역에 맞는 시군구 목록
    const sigunguList = data[areaCode] || [];

    const sigunguOptions = document.getElementById("sigunguOptions");
    if (!sigunguOptions) {
      console.error("시군구 옵션 컨테이너를 찾을 수 없습니다.");
      return;
    }

    sigunguOptions.innerHTML = "";

    // 시군구 목록을 드롭다운에 추가
    sigunguList.forEach((sigungu) => {
      const button = document.createElement("button");
      button.classList.add("w-full", "text-left", "px-4", "py-2", "hover:bg-gray-100");
      button.textContent = sigungu.sigunguname;
      button.setAttribute("data-sigungu", sigungu.sigungucode);

      const sigunguButton = document.getElementById("sigunguButton");
      if (!sigunguButton) {
        console.error("시군구 버튼을 찾을 수 없습니다.");
        return;
      }

      button.addEventListener("click", function () {
        sigunguButton.querySelector("span").textContent = sigungu.sigunguname;
        sigunguButton.setAttribute("data-sigungu", sigungu.sigungucode);

        const sigunguDropdown = document.getElementById("sigunguDropdown");
        if (sigunguDropdown) {
          sigunguDropdown.classList.add("hidden");
        }
      });

      sigunguOptions.appendChild(button);
    });

    // 시군구 드롭다운을 표시
    const sigunguDropdown = document.getElementById("sigunguDropdown");
    if (sigunguDropdown) {
      sigunguDropdown.classList.remove("hidden");
    }
  } catch (error) {
    console.error("시군구 데이터를 가져오는 중 오류 발생:", error);
  }
}
