document.addEventListener('DOMContentLoaded', function() {
  const includeElements = document.querySelectorAll('[data-include-path]');

  includeElements.forEach(async function(el) {
    const path = el.getAttribute('data-include-path');
    const response = await fetch(path);
    const html = await response.text();
    el.innerHTML = html;
  });

  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      tabButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');

      tabContents.forEach(content => content.classList.add('hidden'));
      const tabId = this.getAttribute('data-tab');
      document.getElementById(tabId + '-content').classList.remove('hidden');
    });
  });

  const interestLabels = document.querySelectorAll('label.inline-flex');
  interestLabels.forEach(label => {
    label.addEventListener('click', function() {
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


});

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
  const response = await fetch(`/api/v1/users/${nickname}`, {
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
async function populateProfileData() {
  const data = await getProfile();

  const nicknameInput = document.getElementById('nickname');
  if (nicknameInput) nicknameInput.value = data.nickname || '';

  const imgPreview = document.getElementById('profile-image-preview');
  const imgHeader = document.getElementById('profile-image'); // 추가

  if (imgPreview) {
    imgPreview.src = data.profileImageUrl || "https://via.placeholder.com/150";
    imgPreview.alt = data.nickname ? `${data.nickname}님의 프로필 이미지` : '기본 프로필 이미지';
  }

  if (imgHeader) {
    imgHeader.src = data.profileImageUrl || "https://via.placeholder.com/150"; // 추가
    imgHeader.alt = data.nickname ? `${data.nickname}님의 프로필 이미지` : '기본 프로필 이미지'; // 추가
  }
  // 프로필 헤더 정보 업데이트
  const profileName = document.querySelector('.flex-1.text-center.md\\:text-left .text-2xl.font-bold');
  if (profileName) profileName.textContent = data.nickname || '닉네임 없음';

  const profileLocation = document.querySelector('.flex-1.text-center.md\\:text-left .text-gray-600.mb-4');
  if (profileLocation) {
    profileLocation.textContent = `${data.interestDisplayName || '전문 분야 없음'} | ${data.area || '지역 없음'} ${data.sigunguName || ''}`;
  }

  const profileIntro = document.querySelector('.flex-1.text-center.md\\:text-left .text-gray-700.mb-4');
  if (profileIntro) profileIntro.textContent = data.introduction || '소개글 없음';

  // 태그 업데이트 (API에 태그 정보가 있는 경우)
  const tagContainer = document.querySelector('.flex-1.text-center.md\\:text-left .flex.flex-wrap.gap-2');
  if (tagContainer) {
    tagContainer.innerHTML = ''; // 기존 태그 초기화
    if (data.tags && data.tags.length > 0) {
      data.tags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full';
        tagElement.textContent = `#${tag}`;
        tagContainer.appendChild(tagElement);
      });
    } else {
      // 태그가 없는 경우 메시지 표시
      const noTagsMessage = document.createElement('span');
      noTagsMessage.textContent = '태그 없음';
      tagContainer.appendChild(noTagsMessage);
    }
  }

  const intro = document.getElementById('introduction');
  if (intro) intro.value = data.introduction || '';

  const regionButton = document.getElementById('regionButton');
  const sigunguButton = document.getElementById('sigunguButton');
  if(data.area){
    regionButton.querySelector('span').textContent = data.area;
    regionButton.setAttribute('data-area', data.areaCode);
  }
  if(data.sigunguName){
    sigunguButton.querySelector('span').textContent = data.sigunguName;
    sigunguButton.setAttribute('data-sigungu', data.sigunguCode);
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
}