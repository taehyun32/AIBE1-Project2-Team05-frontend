// 닉네임 중복 확인
async function checkNickname() {
  const nicknameInput = document.getElementById('nickname');
  if (!nicknameInput) {
    alert('닉네임 입력 필드를 찾을 수 없습니다.');
    return;
  }

  const nickname = nicknameInput.value.trim();
  if (!nickname) {
    alert('닉네임을 입력해주세요.');
    return;
  }

  try {
    const response = await fetch(`/api/v1/users/check-nickname?nickname=${nickname}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    if (result.data.duplicated === false) {
      alert('사용 가능한 닉네임입니다.');
    } else {
      alert('중복된 닉네임입니다.');
    }
  } catch (error) {
    console.error('닉네임 확인 중 오류 발생:', error);
    alert('닉네임 확인 중 오류가 발생했습니다.');
  }
}

// 프로필 이미지 변경
async function uploadProfileImage(event) {
  const file = event.target.files[0];
  if (!file) {
    alert('이미지를 선택해주세요.');
    return;
  }

  if (file.size > 1024) {
    alert('파일용량이 너무 큽니다');
    return;
  }
  const formData = new FormData();
  formData.append('profileImage', file);

  try {
    const nickname = sessionStorage.getItem('nickname');
    const response = await fetch(`/api/v1/users/${nickname}/profile/image`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (response.status === 200) {
      const result = await response.json();
      if (result.data === 'SUCCESS') {
        // 이미지 변경 성공
        alert('프로필 이미지가 변경되었습니다.');
        // 변경된 이미지 미리보기 업데이트
        const profileImagePreview = document.getElementById('profile-image-preview');
        if (profileImagePreview) {
          profileImagePreview.src = result.data.profileImageUrl;
        }
      }
    } else if (response.status === 401) {
      alert("401")
    }
  } catch (error) {
    console.error('프로필 이미지 변경 중 오류 발생:', error);
    alert('프로필 이미지 변경 중 오류가 발생했습니다.');
  }
}


// 시군구 데이터를 fetch로 가져오는 함수
async function fetchSigunguData(areaCode) {
  const sigunguJsonUrl = "/data/sigungu.json";

  try {
    const response = await fetch(sigunguJsonUrl);
    const data = await response.json();
    const sigunguList = data[areaCode] || [];

    const sigunguOptions = document.getElementById("sigunguOptions");
    if (!sigunguOptions) {
      console.error("시군구 옵션 컨테이너를 찾을 수 없습니다.");
      return;
    }

    sigunguOptions.innerHTML = "";

    sigunguList.forEach((sigungu) => {
      const button = document.createElement("button");
      button.type = "button";
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
    const sigunguDropdown = document.getElementById("sigunguDropdown");
    if (sigunguDropdown) {
      sigunguDropdown.classList.remove("hidden");
    }
  } catch (error) {
    console.error("시군구 데이터를 가져오는 중 오류 발생:", error);
  }
}

async function getProfile() {
  const nickname = sessionStorage.getItem('nickname');
  const response = await fetch(`/api/v1/users/${nickname}/profile`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const result = await response.json();
  return result.data;
}

window.getProfile = getProfile;

async function populateProfileData() {
  try {
    const data = await getProfile();
    console.log(data);
    const nicknameInput = document.getElementById('nickname');
    if (nicknameInput) nicknameInput.value = data.nickname || '';

    const imgPreview = document.getElementById('profile-image-preview');
    const imgHeader = document.getElementById('profile-image');

    if (imgPreview) {
      imgPreview.src = data.profileImageUrl || '';
      imgPreview.alt = data.nickname ? `${data.nickname}님의 프로필 이미지` : '기본 프로필 이미지';
    }

    if (imgHeader) {
      imgHeader.src = data.profileImageUrl || '';
      imgHeader.alt = data.nickname ? `${data.nickname}님의 프로필 이미지` : '기본 프로필 이미지';
    }

    const profileName = document.querySelector('.flex-1.text-center.md\\:text-left .text-2xl.font-bold');
    if (profileName) profileName.textContent = data.nickname || '닉네임 없음';

    const profileLocation = document.querySelector('.flex-1.text-center.md\\:text-left .text-gray-600.mb-4');
    if (profileLocation) {
      profileLocation.textContent = `${data.interestDisplayName || '전문 분야 없음'} | ${data.area || '지역 없음'} ${data.sigunguName || ''}`;
    }

    const profileIntro = document.querySelector('.flex-1.text-center.md\\:text-left .text-gray-700.mb-4');
    if (profileIntro) profileIntro.textContent = data.introduction || '소개글 없음';

    const tagContainer = document.querySelector('.flex-1.text-center.md\\:text-left .flex.flex-wrap.gap-2');
    if (tagContainer) {
      tagContainer.innerHTML = '';
      if (data.tags && data.tags.length > 0) {
        data.tags.forEach(tag => {
          const tagElement = document.createElement('span');
          tagElement.className = 'bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full';
          tagElement.textContent = `#${tag}`;
          tagContainer.appendChild(tagElement);
        });
      } else {
        const noTagsMessage = document.createElement('span');
        noTagsMessage.textContent = '태그 없음';
        tagContainer.appendChild(noTagsMessage);
      }
    }

    const intro = document.getElementById('introduction');
    if (intro) intro.value = data.introduction || '';

    // 지역 및 시군구 코드 설정
    const regionButton = document.getElementById('regionButton');
    const sigunguButton = document.getElementById('sigunguButton');
    if (regionButton && sigunguButton) {
      if (data.areaCode) {
        regionButton.setAttribute('data-area', data.areaCode);
        regionButton.querySelector('span').textContent = data.area; // 지역 이름 표시
        fetchSigunguData(data.areaCode); // 시군구 데이터 로드
      }
      if (data.sigunguCode) {
        sigunguButton.setAttribute('data-sigungu', data.sigunguCode);
        sigunguButton.querySelector('span').textContent = data.sigunguName; // 시군구 이름 표시
      }
    }

    const timeSelect = document.getElementById('available_time');
    if (timeSelect) timeSelect.value = data.activityTime || '';

    const activityTypeInputs = document.querySelectorAll('input[name="activity-type"]');
    activityTypeInputs.forEach(input => {
      if (data.activityType && input.value === data.activityType) {
        input.checked = true;
      }
    });

    const tagInput = document.getElementById('tags');
    if (tagInput) tagInput.value = data.tags ? data.tags.join(',') : '';

    const contactInput = document.getElementById('contact');
    if (contactInput) contactInput.value = data.contactLink || '';

    const matchToggle = document.querySelector('input[name="accept-matching"]');
    if (matchToggle !== null) matchToggle.checked = data.acceptingRequests;

    const introductionInput = document.getElementById('introduction');
    if (introductionInput) introductionInput.value = data.introduction || '';

    const availableTimeSelect = document.getElementById('available_time');
    if (availableTimeSelect) availableTimeSelect.value = data.activityTime || '';

    const tagsInput = document.getElementById('tags');
    if (tagsInput) tagsInput.value = data.tags ? data.tags.join(',') : '';

    const expertSelect = document.getElementById('expertise');
    if (expertSelect) expertSelect.value = data.interest || '';

    const contact = document.getElementById('contact');
    if (contact) contact.value = data.contactLink || '';

  } catch (error) {
    console.error('프로필 데이터 가져오기 및 설정 오류:', error);
  }
}


    document.addEventListener('DOMContentLoaded', function () {
      window.addEventListener('load', async function () {
        const includeElements = document.querySelectorAll('[data-include-path]');

        // include 완료된 후 실행되는 Promise.all
        await Promise.all(
            Array.from(includeElements).map(async el => {
              const path = el.getAttribute('data-include-path');
              const response = await fetch(path);
              const html = await response.text();
              el.innerHTML = html;
            })
        );
        // ✅ include가 끝난 후에만 실행하도록 여기에 탭/렌더링 JS를 배치해야 해!
        initMyPage();
      });

      function initMyPage() {
        // 탭 전환 기능
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
          button.addEventListener('click', function () {
            // 모든 탭 버튼에서 active 클래스 제거
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // 클릭한 탭 버튼에 active 클래스 추가
            this.classList.add('active');

            // 모든 탭 컨텐츠 숨기기
            tabContents.forEach(content => content.classList.add('hidden'));
            // 선택한 탭 컨텐츠 표시
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId + '-content').classList.remove('hidden');
          });
        });

        // 매칭 현황 탭 클릭 시 API 호출
        const matchingTab = document.querySelector('[data-tab="matching"]');

        let hasRenderedMatchingTab = false;

        matchingTab.addEventListener("click", () => {

          if (hasRenderedMatchingTab) return; // ❌ 중복 실행 방지
          hasRenderedMatchingTab = true;

          // 👇 리뷰 영역 먼저 안내 메시지
          const reviewContainer = document.querySelector('#received-review-list');
          if (reviewContainer) {
            reviewContainer.innerHTML = `<p class="text-sm text-gray-400">받은 리뷰를 불러오는 중...</p>`;
          }

          (async () => {
            const nickname = sessionStorage.getItem("nickname");
            if (!nickname) {
              console.error("⚠️ 닉네임 정보 없음");
              return;
            }

            try {
              const response = await fetch(`/api/v1/users/${nickname}/matching`, {
                credentials: "include",
              });
              const result = await response.json();

              if (result.code === "SUCCESS") {
                console.log("📦 받은 매칭 탭 데이터", result.data);
                renderMatchingTab(result.data);
              } else {
                console.error("❌ API 실패", result.message);
              }
            } catch (error) {
              console.error("❌ 매칭 탭 API 호출 실패", error);
            }
          })();

        });


        // [추가] 매칭 탭 렌더링 함수
        function renderMatchingTab(data) {

          console.log("📌 QnA 응답:", data.communityQnAs);
          console.log("⭐ 멘토링 통계:", data.stats);
          console.log("📬 받은 리뷰:", data.reviews);
          console.log("🚀 진행 중 매칭:", data.ongoingMatchings);


          renderOngoingMatchingSection(data.ongoingMatchings);
          console.log("📦 매칭 현황 전체 응답:", data);

          console.log("📦렌더링 함수 아래 받은 매칭 탭 데이터", data);
          // 다음 단계에서 실제 렌더링 구현할 거야
          // 받은 리뷰 렌더링
          // const reviewContainer = document.querySelector('#matching-content .border-t.border-gray-200.pt-4.space-y-4');
          const reviewContainer = document.querySelector('#received-review-list');
          if (!reviewContainer) {
            console.warn("📭 리뷰 영역 없음");
            return;
          }
          const reviews = data.reviews || [];
          if (reviews.length === 0) {
            reviewContainer.innerHTML = '<p class="text-sm text-gray-500">아직 받은 리뷰가 없습니다.</p>';
            return;
          }

          reviewContainer.innerHTML = ''; // 기존 더미 내용 제거


          reviews.forEach(review => {
            const card = document.createElement('div');
            card.className = 'review-card border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer';
            card.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
          <img src="${review.reviewerProfileImageUrl}" alt="프로필" class="w-full h-full object-cover">
        </div>
        <div class="flex-1">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="font-medium">${review.reviewerName}</h3>
              <p class="text-xs text-gray-500">${formatDateToKST(review.reviewDate)} 작성</p>
            </div>
            <div class="flex items-center">
              ${generateStars(review.star)}
              <span class="ml-1 text-sm font-medium text-yellow-400">${review.star.toFixed(1)}</span>
            </div>
          </div>
<!--          <p class="text-sm text-gray-600 mt-2">${review.content}</p>-->
          <p class="text-sm text-gray-600 mt-2 line-clamp-content" data-full="${review.content}">
            ${getShortenedContent(review.content)}
          </p>
          <span class="text-xs text-blue-500 cursor-pointer toggle-more" data-expanded="false">더보기</span>
        </div>
      </div>
    `;
            // ✅ 팝업 열기 이벤트
            card.addEventListener('click', () => {
              showReviewPopup(review);
            });
// ✅ "더보기/접기" 버튼 클릭 시: 내용 토글 (버블링 방지)
            const toggleBtn = card.querySelector('.toggle-more');
            toggleBtn.addEventListener('click', (e) => {
              e.stopPropagation(); // 팝업 이벤트 막기

              const contentEl = card.querySelector('.line-clamp-content');
              const full = contentEl.dataset.full;
              const isExpanded = toggleBtn.dataset.expanded === 'true';

              if (isExpanded) {
                // 접기
                contentEl.textContent = getShortenedContent(full);
                toggleBtn.textContent = '...더보기';
                toggleBtn.dataset.expanded = 'false';
              } else {
                // 펼치기
                const display = full.length > 100 ? full.slice(0, 100) + '...' : full;
                contentEl.textContent = display;
                toggleBtn.textContent = '▲ 접기';
                toggleBtn.dataset.expanded = 'true';
              }
            });
            reviewContainer.appendChild(card);
          });

          renderMentorStats(data.stats);


          // 🔹 멘토링 통계 렌더링
          function renderMentorStats(stats) {
            if (!stats) {
              console.warn("📭 멘토링 통계 데이터 없음");
              return;
            }
            console.log("📊 멘토링 분야별 통계:", stats.mentoringCategories);

            // 📍 총 멘토링 수, 진행 중, 평균 별점
            const totalEl = document.querySelector('#matching-content .text-primary.text-2xl');
            if (totalEl) totalEl.textContent = stats.totalMentoringCount;

            const ongoingEl = document.querySelector('#matching-content .text-yellow-600.text-2xl');
            if (ongoingEl) ongoingEl.textContent = stats.ongoingMentoringCount;

            const avgEl = document.querySelector('#matching-content .text-purple-600.text-2xl');
            if (avgEl) {
              avgEl.textContent = stats.averageRating != null
                  ? stats.averageRating.toFixed(1)
                  : '-';
            }

            console.log("⭐ 평균 만족도 확인:", stats.averageRating);


            // 🔹 분야별 통계 바 업데이트
            const container = document.getElementById('mentor-stat-list');
            const popup = document.getElementById('mentor-stat-popup');

            if (!container || !popup) return;

            container.innerHTML = ''; // 기존 예시 제거
            popup.innerHTML = '';

            stats.mentoringCategories.forEach((category, index) => {
              const displayName = category.displayName ?? category.interest;
              const percent = Math.min(100, (category.count / stats.totalMentoringCount * 100));

              const bar = document.createElement('div');
              bar.className = 'border border-gray-200 rounded-lg p-3 text-sm space-y-2';
              bar.innerHTML = `
           <div class="flex justify-between items-center">
            <span class="font-medium text-gray-700 whitespace-nowrap">${displayName}</span>
            <span class="text-xs text-gray-500 flex-shrink-0 whitespace-nowrap">총 ${category.count}회</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div class="bg-primary h-2.5 rounded-full" style="width: ${percent}%"></div>
          </div>
        `;
              if (index < 2) {
                container.appendChild(bar);
              } else {
                popup.appendChild(bar);
              }
            });
          }

          // renderReviewSection(data.reviews);
          // renderStatsSection(data.stats);
          console.log("🧩 QnA 응답:", data?.data?.communityQnAs);

          console.log("✅ QnA 개수:", data.communityQnAs?.length);

          if (data.communityQnAs && data.communityQnAs.length > 0) {
            renderCommunityQnASection(data.communityQnAs);
          }

        }

        function showReviewPopup(review) {
          document.getElementById("popup-reviewer-name").textContent = review.reviewerName;
          document.getElementById("popup-review-date").textContent = formatDateToKST(review.reviewDate) + " 작성";
          document.getElementById("popup-star").innerHTML =
              generateStars(review.star) + `<span class="ml-1 text-sm font-medium text-yellow-400">${review.star.toFixed(1)}</span>`;
          document.getElementById("popup-content").textContent = review.content;

          document.getElementById("review-popup").classList.remove("hidden");
        }

        document.getElementById("close-popup").addEventListener("click", () => {
          document.getElementById("review-popup").classList.add("hidden");
        });


        function getShortenedContent(content, limit = 45) {
          return content.length > limit ? content.slice(0, limit) + '...' : content;
        }


        // 사용자 유형에 따른 설정 표시
        // 이제 사용자 유형은 회원가입 시 선택되며 변경할 수 없음

        // 관심사 태그 선택 기능
        const interestLabels = document.querySelectorAll('label.inline-flex');
        interestLabels.forEach(label => {
          label.addEventListener('click', function () {
            const checkbox = this.querySelector('input[type="checkbox"]');
            checkbox.checked = !checkbox.checked;

            if (checkbox.checked) {
              this.classList.add('bg-primary', 'text-white');
              this.classList.remove('bg-gray-100', 'text-gray-700');
            } else {
              this.classList.remove('bg-primary', 'text-white');
              this.classList.add('bg-gray-100', 'text-gray-700');
            }
          });
        });

        // const Me = checkMe();
        // const check = sessionStorage.getItem('nickname') === Me;

        // handleTabVisibility(check)
        populateProfileData();

        // 지역 드롭다운
        const regionButton = document.getElementById("regionButton");
        const regionDropdown = document.getElementById("regionDropdown");
        const sigunguButton = document.getElementById("sigunguButton");
        if (regionButton && regionDropdown) {
          regionButton.addEventListener("click", function () {
            regionDropdown.classList.toggle("hidden");
          });

          document.addEventListener("click", function (event) {
            if (!regionButton.contains(event.target) && !regionDropdown.contains(event.target)) {
              regionDropdown.classList.add("hidden");
            }
          });

          // document.addEventListener('click', function (e) {
          //   if (e.target.classList.contains('toggle-more')) {
          //     const card = e.target.closest('.review-card') || e.target.closest('.flex-1');
          //     const contentEl = card.querySelector('.line-clamp-content');
          //     const full = contentEl.dataset.full;
          //     const isExpanded = e.target.dataset.expanded === 'true';
          //
          //     if (isExpanded) {
          //       // 접기
          //       contentEl.textContent = getShortenedContent(contentEl.dataset.full);
          //       e.target.textContent = '...더보기';
          //       e.target.dataset.expanded = 'false';
          //     } else {
          //       // 펼치기
          //       // 더보기 (최대 40자까지만 표시)
          //       const display = full.length > 100 ? full.slice(0, 100) + '...' : full;
          //       contentEl.textContent = display;
          //       e.target.textContent = '▲ 접기';
          //       e.target.dataset.expanded = 'true';
          //     }
          //   }
          // });

        }
// ✅ 여기 넣으면 돼!
        document.addEventListener('DOMContentLoaded', () => {
          const closeBtn = document.getElementById('close-popup');
          if (closeBtn) {
            closeBtn.addEventListener('click', () => {
              document.getElementById('review-popup').classList.add('hidden');
            });
          }
        });

        const regionOptions = regionDropdown.querySelectorAll("button");
        regionOptions.forEach((option) => {
          option.addEventListener("click", function (event) {
            event.preventDefault();
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
        sigunguButton.addEventListener("click", function () {
          const selectedArea = regionButton.getAttribute("data-area");

          if (selectedArea) {
            sigunguDropdown.classList.toggle("hidden");
            if (sigunguOptions.children.length === 0) {
              fetchSigunguData(selectedArea);
            }
          }
        });
        document.addEventListener("click", function (event) {
          if (!sigunguButton.contains(event.target) && !sigunguDropdown.contains(event.target)) {
            sigunguDropdown.classList.add("hidden");
          }
        });
      }


      // 닉네임 중복 확인 버튼 이벤트 리스너
      const checkNicknameButton = document.getElementById('checkNicknameButton');
      if (checkNicknameButton) {
        checkNicknameButton.addEventListener('click', checkNickname);
      }

      // document.addEventListener('click', function (e) {
      //   if (e.target.classList.contains('toggle-more')) {
      //     const card = e.target.closest('.review-card') || e.target.closest('.flex-1');
      //     const contentEl = card.querySelector('.line-clamp-content');
      //     const full = contentEl.dataset.full;
      //     const isExpanded = e.target.dataset.expanded === 'true';
      //
      //     if (isExpanded) {
      //       // 접기
      //       contentEl.textContent = getShortenedContent(contentEl.dataset.full);
      //       e.target.textContent = '...더보기';
      //       e.target.dataset.expanded = 'false';
      //     } else {
      //       // 펼치기
      //       // 더보기 (최대 40자까지만 표시)
      //       const display = full.length > 100 ? full.slice(0, 100) + '...' : full;
      //       contentEl.textContent = display;
      //       e.target.textContent = '▲ 접기';
      //       e.target.dataset.expanded = 'true';
      //     }
      //   }
      // });

    })


    document.addEventListener('DOMContentLoaded', () => {
      const closeBtn = document.getElementById('close-popup');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          document.getElementById('review-popup').classList.add('hidden');
        });
      }
    });

    // 프로필 이미지 변경 버튼 이벤트 리스너
    const changeProfileImageButton = document.getElementById('changeProfileImageButton');
    const profileImageInput = document.getElementById('profileImageInput');
    if (changeProfileImageButton && profileImageInput) {
      changeProfileImageButton.addEventListener('click', () => {
        profileImageInput.click(); // 파일 선택 창 열기
      });

      profileImageInput.addEventListener('change', uploadProfileImage);
    }

    // 변경사항 저장 버튼 이벤트 리스너
    const saveChangesButton = document.getElementById('saveChangesButton');
    if (saveChangesButton) {
      saveChangesButton.addEventListener('click', async function (e) {
        e.preventDefault();
        confirm("변경사항을 저장하시겠습니까?");
        await saveProfileChanges();
      });
    }

    const saveMenteeBtn = document.getElementById('save-settings-btn');
    if (saveMenteeBtn) {
      saveMenteeBtn.addEventListener('click', async function (e) {
        e.preventDefault();
        confirm('변경사항을 저장하시겠습니까?')
        await saveProfileChanges();
      });
    }

  async function saveProfileChanges() {
    const nicknameInput = document.getElementById('nickname');
    const introInput = document.getElementById('introduction');
    const timeSelect = document.getElementById('available_time');
    const regionButton = document.getElementById('regionButton');
    const sigunguButton = document.getElementById('sigunguButton');
    const tagInput = document.getElementById('tags');
    const contactInput = document.getElementById('contact');
    const activityTypeInputs = document.querySelectorAll('input[name="activity-type"]');
    const expertiseSelect = document.getElementById('expertise');

    let activityType = null;
    activityTypeInputs.forEach(input => {
      if (input.checked) {
        activityType = input.value;
      }
    });

    const matchToggle = document.querySelector('input[name="accept-matching"]');
    const openToMatching = matchToggle ? matchToggle.checked : false;

    const nickname = sessionStorage.getItem('nickname');
    const nick = nicknameInput?.value.trim();
    const introduction = introInput?.value.trim();
    const activityTime = timeSelect?.value;
    const areaCode = regionButton?.getAttribute("data-area");
    const sigunguCode = sigunguButton?.getAttribute("data-sigungu");
    const tags = tagInput?.value.trim().split(',').map(tag => tag.trim());
    const contactLink = contactInput?.value.trim();
    const interest = expertiseSelect?.value;

    // 필수 필드 검사 (선택 필드 검사 강화)
    if (!interest || interest === '선택') {
      alert('분야를 선택해주세요.');
      return;
    }
    if (!nickname) {
      alert('닉네임을 입력해주세요.');
      return;
    }
    if (!areaCode) {
      alert('지역을 선택해주세요.');
      return;
    }
    if (!sigunguCode) {
      alert('시군구를 선택해주세요.');
      return;
    }
    if (!tags || tags.length === 0 || tags.some(tag => !tag)) {
      alert('태그를 입력해주세요.');
      return;
    }

    try {
      const response = await fetch(`/api/v1/users/${nickname}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          nickname: nick,
          introduction: introduction,
          interest: interest,
          activityTime: activityTime,
          activityType: activityType,
          contactLink: contactLink,
          openToMatching: openToMatching,
          areaCode: parseInt(areaCode),
          sigunguCode: parseInt(sigunguCode),
          tags: tags
        }),
      });

      if (response.status === 200) {
        sessionStorage.setItem('nickname', nick);
        await populateProfileData();
        console.log("성공")
      } else {
        console.log(`프로필 업데이트 실패: ${response.status}`);
      }
    } catch (error) {
      console.error('프로필 업데이트 중 오류 발생:', error);
    }
  }
    container.innerHTML = ''; // 기존 내용 비우기

    posts.forEach(post => {
      const card = document.createElement('div');
      card.className = 'review-card border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer';

      // 태그 버튼 HTML 조립
      const tagHTML = (post.tags || []).map(tag => `<span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded mr-2">#${tag}</span>`).join("");

      card.innerHTML = `
    <div class="flex justify-between items-start">
      <div class="flex gap-3">
        <div class="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
          <img src="${post.profileImageUrl}" alt="프로필" class="w-full h-full object-cover">
        </div>
        <div>
          <p class="text-sm font-medium text-gray-800">${post.nickname}</p>
          <p class="text-xs text-gray-500">${formatDateToKST(post.createdAt)} · 질문/답변</p>
          <h3 class="font-semibold text-base mt-1">${post.title}</h3>
          <p class="text-sm text-gray-700 mt-1 line-clamp-2">${post.content}</p>
          <div class="mt-2 flex flex-wrap gap-1">${tagHTML}</div>
        </div>
      </div>
      <span class="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full whitespace-nowrap">
        답변 ${post.commentCount}개
      </span>
    </div>
    `;

      card.onclick = () => window.location.href = `/community-detail.html?id=${post.postId}`;
      container.appendChild(card);
    });

  function generateStars(rating) {
    const full = Math.floor(rating);  // 정수 부분 (ex. 4)
    const hasHalf = rating % 1 >= 0.25 && rating % 1 < 0.75; // 반개 기준
    const empty = 5 - full - (hasHalf ? 1 : 0); // 남은 빈 별
    return (
        '<i class="ri-star-fill text-yellow-400"></i>'.repeat(full) +
        (hasHalf ? '<i class="ri-star-half-line text-yellow-400"></i>' : '') +
        '<i class="ri-star-line text-yellow-400"></i>'.repeat(empty)
    );
  }

  function formatDateToKST(utcString) {
    const date = new Date(utcString); // UTC → Date 객체
    return date.toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",         // KST 시간대로 표시
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

// function showReviewPopup(review) {
//   document.getElementById('popup-reviewer-name').textContent = review.reviewerName;
//   document.getElementById('popup-review-date').textContent = formatDateToKST(review.reviewDate) + ' 작성';
//   document.getElementById('popup-star').innerHTML =
//       generateStars(review.star) +
//       ` <span class="ml-1 text-sm font-medium text-yellow-400">${review.star.toFixed(1)}</span>`;
//   document.getElementById('popup-content').textContent = review.content;
//
//   document.getElementById('review-popup').classList.remove('hidden');
// }

  function renderCommunityQnASection(posts) {
    const container = document.getElementById('interest-qna-list');
    if (!container || !posts || posts.length === 0) return;

    //  응답 데이터 로그 확인
    console.log("🔍 [QnA 리스트 응답]:", posts);
    posts.forEach((post, idx) => {
      console.log(`📌 QnA[${idx}]`);
      console.log(" - 닉네임:", post.nickname);
      console.log(" - 프로필 이미지:", post.profileImageUrl);
      console.log(" - 작성일:", post.createdAt);
      console.log(" - 제목:", post.title);
      console.log(" - 내용:", post.content);
      console.log(" - 태그:", post.tags);
    });

    container.innerHTML = ''; // 기존 내용 비우기

    posts.forEach(post => {
      const card = document.createElement('div');
      card.className = 'review-card border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer';

      // 태그 버튼 HTML 조립
      const tagHTML = (post.tags || []).map(tag => `<span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded mr-2">#${tag}</span>`).join("");

      card.innerHTML = `
    <div class="flex justify-between items-start">
      <div class="flex gap-3">
        <div class="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
          <img src="${post.profileImageUrl}" alt="프로필" class="w-full h-full object-cover">
        </div>
        <div>
          <p class="text-sm font-medium text-gray-800">${post.nickname}</p>
          <p class="text-xs text-gray-500">${formatDateToKST(post.createdAt)} · 질문/답변</p>
          <h3 class="font-semibold text-base mt-1">${post.title}</h3>
          <p class="text-sm text-gray-700 mt-1 line-clamp-2">${post.content}</p>
          <div class="mt-2 flex flex-wrap gap-1">${tagHTML}</div>
        </div>
      </div>
      <span class="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full whitespace-nowrap">
        답변 ${post.commentCount}개
      </span>
    </div>
    `;

      card.onclick = () => window.location.href = `/community-detail.html?id=${post.postId}`;
      container.appendChild(card);
    });
  }


// ✅ [추가] 진행 중인 매칭 섹션 렌더링 함수
  function renderOngoingMatchingSection(matchings) {
    const container = document.getElementById("ongoing-matching-list");
    if (!container || !matchings || matchings.length === 0) return;

    container.innerHTML = '';

    matchings.forEach(match => {
      // 기본값 처리
      const profileImage = match.menteeProfileImageUrl || '/images/default-profile.png';
      const nickname = match.menteeNickname || '닉네임 없음';
      const matchingDate = match.matchingDate?.split("T")[0] || '날짜 없음';
      const category = match.category || '카테고리 없음';
      const tag = match.tag || '-';
      const description = match.description || '';
      const contactLink = match.contactLink || '#';
      const status = match.status || '진행중';

      // 상태 pill 색상 지정
      const statusColorClass = status === "진행중"
          ? "bg-yellow-100 text-yellow-700"
          : "bg-green-100 text-green-700";

      const card = document.createElement("div");
      card.className = "border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition";

      card.innerHTML = `
      <div class="flex items-start gap-3">
        <!-- 프로필 이미지 -->
        <div class="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
          <img src="${profileImage}" alt="프로필" class="w-full h-full object-cover">
        </div>

        <!-- 본문 -->
        <div class="flex-1">
          <div class="flex justify-between items-start mb-1">
            <div>
              <p class="text-sm font-medium text-gray-800">${nickname}</p>
              <p class="text-xs text-gray-500">${matchingDate} 매칭</p>
            </div>
            <span class="text-xs ${statusColorClass} px-2 py-1 rounded-full whitespace-nowrap font-medium">
              ${status}
            </span>
          </div>

          <div class="text-xs text-purple-600 font-semibold mb-1">${category}</div>
          <p class="text-sm text-gray-700 line-clamp-2">${description}</p>

          <div class="mt-2 flex justify-end">
            <a href="${contactLink}" target="_blank" class="text-sm text-blue-800 font-extrabold hover:underline">연락하기</a>
          </div>
        </div>
      </div>
    `;

      container.appendChild(card);
    });
  }


