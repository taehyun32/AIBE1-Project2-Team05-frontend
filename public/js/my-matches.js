// 이미지 오류 처리 함수
function handleImageError(image) {
  image.onerror = null; // 무한 루프 방지
  image.src = "../assets/images/default-profile.png"; // 기본 이미지로 대체
}

// 현재 사용자 정보 가져오기
async function getCurrentUserInfo() {
  try {
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
      console.error("사용자 정보 요청 실패:", response.status);
      return null;
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("사용자 정보 조회 중 오류 발생:", error);
    return null;
  }
}

// 매칭 데이터 로드 및 렌더링
async function loadMatchData(id, page = 0) {
  const contentList = document.getElementById("content-list");
  contentList.innerHTML =
    '<div class="text-center py-10"><div class="spinner"></div><p class="mt-2 text-gray-500">매칭 정보를 불러오는 중</p></div>';

  // 세션 스토리지에서 닉네임 가져오기 (한 번만 호출)
  const sessionNickname = sessionStorage.getItem("nickname");

  if (!sessionNickname) {
    contentList.innerHTML = `
        <div class="text-center py-10">
          <div class="w-12 h-12 mx-auto mb-3 text-red-500">
            <i class="ri-error-warning-line text-3xl"></i>
          </div>
          <p class="text-gray-700 font-medium">사용자 정보를 찾을 수 없습니다.</p>
          <p class="text-gray-500 mt-1">다시 접근해주세요.</p>
        </div>
      `;
    return;
  }

  // 현재 사용자 정보 가져오기
  const currentUser = await getCurrentUserInfo();
  const isOwner = currentUser && currentUser.status === 200 && currentUser.code === "SUCCESS";

  // 세션의 닉네임과 API에서 반환된 닉네임 비교
  const isAuthorized = isOwner && currentUser.data && currentUser.data.nickname === sessionNickname;

  // 매칭 목록 API 호출 함수
  async function fetchMyMatches(pageNumber = 0) {
    const apiUrl = `/api/v1/users/${sessionNickname}/activity/more-details?type=my-matches&page=${pageNumber}&size=10`;
    const response = await fetch(apiUrl, {
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
      return await fetchMyMatches(pageNumber);
    }

    if (!response.ok) {
      throw new Error("API 요청 실패: " + response.status);
    }

    return response.json();
  }

  try {
    const result = await fetchMyMatches(page);

    if (result.status === 200 && result.code === "SUCCESS" && result.data && result.data.content) {
      // 데이터가 있는 경우 렌더링
      renderMatches(result.data.content, isAuthorized);

      // 페이지네이션 정보가 있으면 페이지네이션 렌더링
      if (result.data.page) {
        renderPagination(result.data.page);
      }
    } else {
      console.error("API 응답 형식이 예상과 다릅니다:", result);
      showNoMatchesMessage();
    }
  } catch (error) {
    console.error("매칭 데이터 로드 중 오류 발생:", error);
    contentList.innerHTML = `
        <div class="text-center py-10">
          <div class="w-12 h-12 mx-auto mb-3 text-red-500">
            <i class="ri-error-warning-line text-3xl"></i>
          </div>
          <p class="text-gray-700 font-medium">데이터를 불러올 수 없습니다.</p>
          <p class="text-gray-500 mt-1">${error.message || "나중에 다시 시도해주세요."}</p>
        </div>
      `;
  }
}

// 페이지네이션 렌더링 함수
function renderPagination(pageInfo) {
  const paginationContainer = document.querySelector(".flex.justify-center.mt-6");
  if (!paginationContainer) return;

  // 페이지네이션 컨테이너 초기화
  paginationContainer.innerHTML = '<nav class="inline-flex rounded-md shadow-sm"></nav>';

  const navElement = paginationContainer.querySelector("nav");

  // 이전 페이지 버튼
  const prevButton = document.createElement("a");
  prevButton.href = "#";
  prevButton.className = "px-3 py-2 border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 rounded-l-md";
  prevButton.textContent = "이전";

  if (pageInfo.number > 0) {
    prevButton.addEventListener("click", function (e) {
      e.preventDefault();
      loadMatchData(null, pageInfo.number - 1);
    });
  } else {
    prevButton.classList.add("opacity-50", "cursor-not-allowed");
  }

  navElement.appendChild(prevButton);

  // 페이지 번호 버튼
  const startPage = Math.max(0, pageInfo.number - 2);
  const endPage = Math.min(pageInfo.totalPages - 1, pageInfo.number + 2);

  for (let i = startPage; i <= endPage; i++) {
    const pageButton = document.createElement("a");
    pageButton.href = "#";
    pageButton.textContent = i + 1;

    if (i === pageInfo.number) {
      pageButton.className = "px-3 py-2 border-t border-b border-gray-300 bg-primary text-white";
    } else {
      pageButton.className = "px-3 py-2 border-t border-b border-gray-300 bg-white text-gray-500 hover:bg-gray-50";
      pageButton.addEventListener("click", function (e) {
        e.preventDefault();
        loadMatchData(null, i);
      });
    }

    navElement.appendChild(pageButton);
  }

  // 다음 페이지 버튼
  const nextButton = document.createElement("a");
  nextButton.href = "#";
  nextButton.className = "px-3 py-2 border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 rounded-r-md";
  nextButton.textContent = "다음";

  if (pageInfo.number < pageInfo.totalPages - 1) {
    nextButton.addEventListener("click", function (e) {
      e.preventDefault();
      loadMatchData(null, pageInfo.number + 1);
    });
  } else {
    nextButton.classList.add("opacity-50", "cursor-not-allowed");
  }

  navElement.appendChild(nextButton);
}

// 매칭 데이터 렌더링
function renderMatches(matchesData, isAuthorized) {
  const contentList = document.getElementById("content-list");
  contentList.innerHTML = "";

  // 데이터가 없는 경우 처리
  if (!matchesData || matchesData.length === 0) {
    showNoMatchesMessage();
    return;
  }

  // 매칭 데이터 렌더링
  matchesData.forEach((match, index) => {
    const mentorData = match.mentor;
    const createdAt = new Date(match.createdAt);
    const formattedDate = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}-${String(
      createdAt.getDate()
    ).padStart(2, "0")}`;

    // 고유 ID 생성
    const contactBtnId = `contact-btn-${index}-${match.sessionId}`;
    const terminateBtnId = `terminate-btn-${index}-${match.sessionId}`;

    // 진행 중 여부 확인
    const isInProgress = match.status === "IN_PROGRESS";

    const matchesElement = document.createElement("div");
    matchesElement.className = "border border-gray-200 rounded-lg p-4 hover:shadow-md transition";

    // 버튼 영역 HTML - 삼항 연산자로 간결하게 작성
    const buttonsHtml = !isInProgress
      ? `<span class="text-gray-400 text-sm">완료된 매칭</span>`
      : isAuthorized
      ? `<div class="flex items-center gap-2">
                 <button id="${contactBtnId}" class="text-primary text-sm font-medium hover:underline" data-id="${mentorData.mentorId}" data-session="${match.sessionId}">
                   연락하기
                 </button>
                 <button id="${terminateBtnId}" class="text-gray-500 hover:text-red-500 text-sm" data-id="${mentorData.mentorId}" data-session="${match.sessionId}">
                   종료하기
                 </button>
               </div>`
      : `<div></div>`;

    matchesElement.innerHTML = `
             <div class="flex items-start gap-3">
               <div class="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                 <img src="${mentorData.profileImageUrl || "../assets/images/default-profile.png"}" 
                      alt="프로필" 
                      class="w-full h-full object-cover"
                      onerror="handleImageError(this)" />
               </div>
               <div class="flex-1">
                 <div class="flex justify-between items-start">
                   <div>
                     <h3 class="font-medium">${mentorData.nickname || "이름 없음"}</h3>
                     <p class="text-xs text-gray-500">${formattedDate} 요청</p>
                   </div>
                   <div class="flex items-center gap-2">
                     <span class="${
                       isInProgress ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"
                     } text-xs px-2 py-1 rounded-full">
                       ${isInProgress ? "진행중" : "완료"}
                     </span>
                   </div>
                 </div>
                 <p class="text-primary text-sm font-medium mt-1">${mentorData.interest || ""}</p>
                 <p class="text-sm text-gray-600 mt-2">${mentorData.introduction || "소개 정보가 없습니다."}</p>
                 <div class="flex items-center justify-between mt-3">
                   <div class="flex items-center text-sm text-gray-500">
                     <div class="w-4 h-4 flex items-center justify-center mr-1">
                       <i class="ri-time-line"></i>
                     </div>
                     <span>${mentorData.activityTime || "시간 정보 없음"}</span>
                   </div>
                   ${buttonsHtml}
                 </div>
               </div>
             </div>
           `;

    // DOM에 요소 추가
    contentList.appendChild(matchesElement);

    // 권한이 있고 상태가 IN_PROGRESS인 경우에만 이벤트 리스너 추가
    if (isAuthorized && isInProgress) {
      // 요소가 DOM에 추가된 후 이벤트 리스너 연결
      const contactButton = document.getElementById(contactBtnId);
      if (contactButton) {
        contactButton.addEventListener("click", function () {
          handleMatchContact(this.getAttribute("data-id"), mentorData.contactLink);
        });
      }

      // 종료하기 버튼에 이벤트 리스너 추가
      const terminateButton = document.getElementById(terminateBtnId);
      if (terminateButton) {
        terminateButton.addEventListener("click", function () {
          handleMatchTerminate(this.getAttribute("data-id"), this.getAttribute("data-session"));
        });
      }
    }
  });
}

// 매칭 없음 메시지 표시
function showNoMatchesMessage() {
  const contentList = document.getElementById("content-list");
  contentList.innerHTML = `
          <div class="text-center py-10">
            <div class="w-16 h-16 mx-auto mb-3 text-gray-300">
              <i class="ri-file-list-3-line text-4xl"></i>
            </div>
            <p class="text-gray-700 font-medium">신청한 매칭이 없습니다.</p>
            <p class="text-gray-500 mt-1">재능 기부 페이지에서 관심있는 멘토를 찾아보세요!</p>
            <a href="/matching-type-selection" class="inline-block mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-600">
              재능 기부 찾기
            </a>
          </div>
        `;
}

// 매칭 연락하기 처리
function handleMatchContact(mentorId, contactLink) {
  console.log(`멘토 ID ${mentorId} 연락하기`);

  if (contactLink) {
    // 연락 링크가 있는 경우 해당 링크로 이동
    window.open(contactLink, "_blank");
  } else {
    // 연락 링크가 없는 경우 알림 표시
    alert("연락처 정보가 없습니다. 관리자에게 문의해주세요.");
  }
}

// 매칭 종료하기 처리
function handleMatchTerminate(mentorId, sessionId) {
  console.log(`멘토 ID ${mentorId}, 세션 ID ${sessionId} 매칭 종료하기`);

  if (confirm("정말 이 매칭을 종료하시겠습니까?")) {
    // 종료 처리 로직 구현
    // ...
  }
}
