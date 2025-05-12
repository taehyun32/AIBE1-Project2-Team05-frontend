function loadMatchData(id) {
  const contentList = document.getElementById("content-list");

  // Mock data for matching requests
  const mockRequests = [
    {
      id: 1,
      mentee: {
        name: "최서연",
        image:
          "https://readdy.ai/api/search-image?query=professional%20asian%20female%20portrait%2C%20neutral%20background%2C%20casual%20style%2C%20high%20quality&width=100&height=100&seq=4&orientation=squarish",
        date: "2025-04-22",
      },
      content: "React와 Node.js로 풀스택 개발 배우기 재능에 관심이 있습니다. 기초부터 차근차근 배우고 싶습니다.",
      preferredTime: "희망 시간: 주말 오후",
      status: "pending",
    },
    {
      id: 2,
      mentee: {
        name: "박준호",
        image:
          "https://readdy.ai/api/search-image?query=professional%20asian%20male%20portrait%2C%20neutral%20background%2C%20glasses%2C%20friendly%20look%2C%20high%20quality&width=100&height=100&seq=3&orientation=squarish",
        date: "2025-04-20",
      },
      content:
        "주니어 개발자를 위한 코드 리뷰 재능에 관심이 있습니다. 현재 진행 중인 프로젝트에 대한 코드 리뷰를 받고 싶습니다.",
      preferredTime: "희망 시간: 평일 저녁",
      status: "pending",
    },
    {
      id: 3,
      mentee: {
        name: "김민지",
        image:
          "https://readdy.ai/api/search-image?query=professional%20asian%20female%20portrait%2C%20neutral%20background%2C%20young%20professional%2C%20high%20quality&width=100&height=100&seq=8&orientation=squarish",
        date: "2025-04-18",
      },
      content:
        "React 컴포넌트 설계와 상태 관리에 대해 배우고 싶습니다. 실무에서 사용하는 패턴과 구조에 대해 알고 싶습니다.",
      preferredTime: "희망 시간: 주말 오전",
      status: "accepted",
    },
  ];

  // 매칭 리스트 렌더링 기존 코드
  mockRequests.forEach((match) => {
    const matchesElement = document.createElement("div");
    matchesElement.className = "border border-gray-200 rounded-lg p-4 hover:shadow-md transition";
    matchesElement.innerHTML = `
        <div class="flex items-start gap-3">
          <div class="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
            <img src="${match.mentee.image}" alt="프로필" class="w-full h-full object-cover">
          </div>
          <div class="flex-1">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-medium">${match.mentee.name}</h3>
                <p class="text-xs text-gray-500">${match.mentee.date} 요청</p>
              </div>
              <div class="flex items-center gap-2">
                ${
                  match.status === "pending"
                    ? `
                <span class="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">진행중</span>
              `
                    : match.status === "accepted"
                    ? `
                <span class="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">완료</span>
              `
                    : ``
                }
              </div>
            </div>
            <p class="text-sm text-gray-600 mt-2">${match.content}</p>
             <div class="flex items-center justify-between mt-3">
              <div class="flex items-center text-sm text-gray-500">
                <div class="w-4 h-4 flex items-center justify-center mr-1">
                    <i class="ri-time-line"></i>
                </div>
                <span> ${match.preferredTime}</span>
                </div>
                <div class="flex items-center gap-2">
                <button class="text-primary text-sm font-medium hover:underline">
                    연락하기
                </button>
                <button class="text-gray-500 hover:text-red-500 text-sm">
                    종료하기
                </button>
              </div>
          </div>
        </div>
      `;

    // 수락/거절 버튼에 이벤트 리스너 추가
    const acceptButton = matchesElement.querySelector(".bg-primary");
    const rejectButton = matchesElement.querySelector(".bg-gray-200");

    if (acceptButton) {
      acceptButton.addEventListener("click", function () {
        handleMatchAccept(match.id);
      });
    }

    if (rejectButton) {
      rejectButton.addEventListener("click", function () {
        handleMatchReject(match.id);
      });
    }

    contentList.appendChild(matchesElement);
  });
}

/**
 * 매칭 수락 처리
 * @param {number} matchId - 매칭 ID
 */
function handleMatchAccept(matchId) {
  console.log(`매칭 ID ${matchId} 수락 처리`);

  // API 호출 및 처리 로직
  alert(`매칭이 수락되었습니다. (ID: ${matchId})`);

  // 페이지 새로고침 또는 상태 업데이트
  loadMyMatching();
}

/**
 * 매칭 거절 처리
 * @param {number} matchId - 매칭 ID
 */
function handleMatchReject(matchId) {
  console.log(`매칭 ID ${matchId} 거절 처리`);

  // API 호출 및 처리 로직
  alert(`매칭이 거절되었습니다. (ID: ${matchId})`);

  // 페이지 새로고침 또는 상태 업데이트
  loadMyMatching();
}
