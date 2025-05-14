// js/common-utils.js

/**
 * DOM에 메시지를 표시합니다.
 * @param {HTMLElement} container - 메시지를 표시할 부모 요소
 * @param {string} message - 표시할 메시지
 * @param {'info' | 'error' | 'no-data' | 'loading'} type - 메시지 종류
 */
function displayMessage(container, message, type = 'info') {
  if (!container) {
    // console.error('Message container not found for:', message); // 너무 많은 로그를 유발할 수 있음
    return;
  }
  let iconHtml = '';
  let textColor = 'text-gray-700';
  let justify = 'justify-center'; // 기본은 중앙 정렬

  // 로딩 스피너 CSS (main.compiled.css 또는 별도 CSS 파일에 정의 필요)
  // .spinner { border: 4px solid rgba(0, 0, 0, .1); border-left-color: #4f46e5; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; }
  // @keyframes spin { to { transform: rotate(360deg); } }

  switch (type) {
    case 'loading':
      iconHtml =
        '<div class="spinner mr-3" role="status" aria-label="Loading"></div>';
      textColor = 'text-gray-500';
      break;
    case 'error':
      iconHtml =
        '<i class="ri-error-warning-line text-red-500 text-2xl mr-3"></i>';
      textColor = 'text-red-600';
      break;
    case 'no-data':
      iconHtml =
        '<i class="ri-file-list-3-line text-gray-400 text-2xl mr-3"></i>';
      textColor = 'text-gray-500';
      break;
    case 'info':
    default:
      iconHtml =
        '<i class="ri-information-line text-blue-500 text-2xl mr-3"></i>';
      textColor = 'text-blue-600';
      break;
  }
  container.innerHTML = `
    <div class="flex items-center ${justify} py-10 ${textColor} text-base">
      ${iconHtml}
      <p>${message}</p>
    </div>
  `;
}

/**
 * 이미지 로딩 실패 시 기본 이미지로 대체합니다.
 * @param {HTMLImageElement} image - 대상 이미지 요소
 * @param {string} defaultImagePath - 기본 이미지 경로 (옵션)
 */
function handleImageError(
  image,
  defaultImagePath = '../assets/images/default-profile.png'
) {
  // 경로 확인 필요
  if (image) {
    image.onerror = null; // 무한 루프 방지
    image.src = defaultImagePath;
  }
}

/**
 * 날짜 문자열을 YYYY-MM-DD 형식으로 포맷합니다.
 * @param {string | Date} dateInput - 날짜 문자열 또는 Date 객체
 * @returns {string} 포맷된 날짜 또는 원본 문자열 (오류 시)
 */
function formatDate(dateInput) {
  if (!dateInput) return '날짜 정보 없음';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return String(dateInput); // 유효하지 않은 날짜면 원본 반환

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(date.getDate()).padStart(2, '0')}`;
  } catch (e) {
    return String(dateInput); // 오류 발생 시 원본 반환
  }
}

/**
 * 세션 스토리지에서 현재 사용자의 닉네임을 가져옵니다.
 * @returns {string | null} 닉네임 또는 null
 */
function getCurrentNickname() {
  return sessionStorage.getItem('nickname');
}

/**
 * URL 파라미터를 업데이트하고 history에 상태를 푸시합니다.
 * @param {object} paramsToUpdate - 업데이트할 파라미터 객체 {key: value, ...}
 * value가 null이나 undefined면 해당 파라미터 제거
 */
function updateUrlParameters(paramsToUpdate) {
  const url = new URL(window.location.href);
  for (const key in paramsToUpdate) {
    if (
      paramsToUpdate[key] === null ||
      paramsToUpdate[key] === undefined ||
      paramsToUpdate[key] === ''
    ) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, String(paramsToUpdate[key]));
    }
  }
  window.history.pushState({ path: url.href }, '', url.href);
}

/**
 * Remix Icon을 사용하여 별점 HTML을 생성합니다.
 * @param {number} rating - 평점 (0-5)
 * @returns {string} 별점 HTML 문자열
 */
function generateStarRatingHtml(rating) {
  let starsHtml = '';
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  for (let i = 0; i < fullStars; i++) {
    starsHtml += '<i class="ri-star-fill text-yellow-400"></i>';
  }
  if (halfStar) {
    starsHtml += '<i class="ri-star-half-fill text-yellow-400"></i>';
  }
  for (let i = 0; i < emptyStars; i++) {
    starsHtml += '<i class="ri-star-line text-yellow-400"></i>'; // 빈 별도 노란색 테두리 유지 또는 회색: text-gray-300
  }
  return starsHtml;
}
