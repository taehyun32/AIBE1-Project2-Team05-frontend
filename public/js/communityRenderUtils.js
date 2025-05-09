/**
 * js/communityRenderUtils.js
 * UI 구성 요소를 렌더링하고 데이터를 형식화하는 유틸리티 기능을 포함
 */

import {
  CATEGORY_DISPLAY_NAMES,
  WEEKLY_RANK_BADGE_CLASSES,
} from "./communityContants.js";

/**
 * ISO 날짜 문자열(예: ZonedDateTime)을 YYYY-MM-DD 형식으로 포맷
 * @param {string} dateString - ISO 날짜 문자열
 * @returns {string} 형식화된 날짜 문자열 또는 'N/A'를 반환
 */
export function formatDate(dateString) {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return "Invalid Date";
  }
}

/**
 * 상수의 매핑을 사용하여 카테고리 열거 값의 표시 이름 GET
 * @param {string} categoryEnum - 카테고리 열거 값
 * @returns {string} 표시 이름 or 기타
 */
export function getCategoryDisplayName(categoryEnum) {
  return CATEGORY_DISPLAY_NAMES[categoryEnum?.toUpperCase()] || "기타"; // 기타?
}

/**
 * 템플릿과 데이터를 사용하여 post item DOM 요소 생성
 * @param {HTMLTemplateElement} templateElement - post item의 template element
 * @param {object} post - CommunitySummaryResponse DTO 데이터.
 * @param {boolean} [isPopular=false] - 게시물을 인기 있는 것으로 표시할지 여부(예: HOT 배지 표시)
 * @returns {Node|null} 템플릿/데이터가 유효하지 않은 경우 채워진 게시 항목 요소(DocumentFragment) 또는 null을 반환
 */
export function createPostItemFromTemplate(templateElement, post, isPopular) {
  if (!templateElement || !post) return null;

  const clone = templateElement.content.cloneNode(true);
  const postItemDiv = clone.querySelector(".post-item");
  const profileImg = clone.querySelector(".profile-img");
  const nicknameEl = clone.querySelector(".nickname");
  const dateEl = clone.querySelector(".post-date");
  const categoryEl = clone.querySelector(".post-category");
  const titleEl = clone.querySelector(".post-title");
  const contentEl = clone.querySelector(".post-content");
  const viewCountEl = clone.querySelector(".view-count");
  const likeCountEl = clone.querySelector(".like-count");
  const commentCountEl = clone.querySelector(".comment-count");
  const badgeEl = clone.querySelector(".post-badge");

  if (postItemDiv) postItemDiv.dataset.postId = post.id; // 게시물 ID 설정

  // 속성을 설정하기 전에 요소 채우기, 존재 여부 확인
  if (profileImg) {
    profileImg.src =
      post.profileImageUrl ||
      `https://i.pravatar.cc/40?u=${encodeURIComponent("default")}`;
    profileImg.alt = post.nickname
      ? `${post.nickname} 프로필 사진`
      : "프로필 사진";
  }
  if (nicknameEl) nicknameEl.textContent = post.nickname || "익명";
  if (dateEl) dateEl.textContent = formatDate(post.createdAt);
  if (categoryEl)
    categoryEl.textContent = getCategoryDisplayName(post.category);
  if (titleEl) titleEl.textContent = post.title;
  if (contentEl) contentEl.textContent = post.content;
  if (viewCountEl) viewCountEl.textContent = post.viewCount || 0;
  if (likeCountEl) likeCountEl.textContent = post.likeCount || 0;
  if (commentCountEl) commentCountEl.textContent = post.commentCount || 0;
  if (badgeEl) {
    badgeEl.textContent = "HOT";
    badgeEl.classList.toggle("hidden", !isPopular);
    // badgeEl.classList.add("hidden"); // Hide badge by default for now
  }

  return clone;
}

/**
 * 주간 인기 게시물 항목에 대한 DOM 요소 생성
 * @param {HTMLTemplateElement} templateElement - 주간 인기 게시물의 템플릿
 * @param {object} post - 주간 인기 게시물 데이터 ({ id, title, category }).
 * @param {number} rank - 게시물의 순위 (1 기준).
 * @returns {Node|null} 채워진 게시물 항목(문서 조각) 또는 null을 반환
 */
export function createWeeklyPopularPostItemFromTemplate(
  templateElement,
  post,
  rank
) {
  if (!templateElement || !post) return null;

  const clone = templateElement.content.cloneNode(true);
  const linkEl = clone.querySelector(".weekly-post-link");
  const rankEl = clone.querySelector(".weekly-post-rank");
  const categoryEl = clone.querySelector(".weekly-post-category");
  const titleEl = clone.querySelector(".weekly-post-title");

  if (linkEl) linkEl.href = `/community-detail.html?postId=${post.id}`;
  if (rankEl) {
    rankEl.textContent = rank;
    // 상수에서 순위별 스타일링 적용
    const badgeClassIndex = Math.min(
      rank - 1,
      WEEKLY_RANK_BADGE_CLASSES.length - 1
    );
    WEEKLY_RANK_BADGE_CLASSES[badgeClassIndex]
      .split(" ")
      .forEach((cls) => rankEl.classList.add(cls));
  }
  if (categoryEl)
    categoryEl.textContent = getCategoryDisplayName(post.category);
  if (titleEl) titleEl.textContent = post.title;

  return clone;
}

/**
 * 페이지네이션 컨트롤을 지정된 컨테이너로 렌더링
 * @param {HTMLElement} container - 페이지네이션을 위한 컨테이너 요소
 * @param {object} pageInfo - API 응답의 '페이지' 객체({크기, 숫자, totalElements, totalPages, first, last })
 * @param {Function} onPageClick - 페이지 링크를 클릭하면 콜백 기능이 페이지 번호를 수신
 */
export function renderPagination(container, pageInfo, onPageClick) {
  if (!container) {
    console.warn("Pagination container not found.");
    return;
  }
  // pageInfo가 null이거나 totalPages가 1 이하이면 숨김
  if (!pageInfo || pageInfo.totalPages == null || pageInfo.totalPages <= 1) {
    container.innerHTML = "";
    return;
  }
  container.innerHTML = "";

  if (!pageInfo || pageInfo.totalPages == null || pageInfo.totalPages <= 1) {
    return; //페이지 또는 1페이지에 대한 페이지 표시 필요 없음
  }

  const { totalPages, number: currentPageNum, first, last } = pageInfo; // pageInfo에서 직접 구조 분해 할당
  let paginationHtml =
    '<nav class="inline-flex rounded-md shadow-sm" aria-label="Pagination">';

  // 이전 버튼
  paginationHtml += `
        <a href="#" class="pagination-link relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-medium border border-gray-300 bg-white ${
          first
            ? "text-gray-300 cursor-not-allowed"
            : "text-gray-700 hover:bg-gray-50"
        }" data-page="${currentPageNum - 1}" ${
    first ? 'aria-disabled="true" tabindex="-1"' : ""
  }>
        이전
        </a>`;

  // 페이지 번호 로직 (동일)
  const MAX_VISIBLE_PAGES = 5;
  let startPage, endPage;

  if (totalPages <= MAX_VISIBLE_PAGES) {
    startPage = 0;
    endPage = totalPages - 1;
  } else {
    const maxPagesBeforeCurrent = Math.floor((MAX_VISIBLE_PAGES - 1) / 2);
    const maxPagesAfterCurrent = Math.ceil((MAX_VISIBLE_PAGES - 1) / 2);

    if (currentPageNum <= maxPagesBeforeCurrent) {
      startPage = 0;
      endPage = MAX_VISIBLE_PAGES - 1;
    } else if (currentPageNum + maxPagesAfterCurrent >= totalPages) {
      startPage = totalPages - MAX_VISIBLE_PAGES;
      endPage = totalPages - 1;
    } else {
      startPage = currentPageNum - maxPagesBeforeCurrent;
      endPage = currentPageNum + maxPagesAfterCurrent;
    }
  }

  // Ellipsis and First Page Link
  if (startPage > 0) {
    paginationHtml += `<a href="#" class="pagination-link relative inline-flex items-center px-3 py-2 text-sm font-medium border-y border-l border-gray-300 bg-white text-gray-700 hover:bg-gray-50" data-page="0">1</a>`;
    if (startPage > 1) {
      paginationHtml += `<span class="relative inline-flex items-center px-3 py-2 text-sm font-medium border-y border-l border-gray-300 bg-white text-gray-500">...</span>`;
    }
  }

  // 페이지 번호 링크
  for (let i = startPage; i <= endPage; i++) {
    paginationHtml += `<a href="#" class="pagination-link relative inline-flex items-center px-3 py-2 text-sm font-medium border-y border-l border-gray-300 ${
      i === currentPageNum
        ? "bg-primary text-white z-10 border-primary"
        : "bg-white text-gray-700 hover:bg-gray-50"
    }" data-page="${i}">${i + 1}</a>`;
  }

  // Ellipsis and Last Page Link
  if (endPage < totalPages - 1) {
    if (endPage < totalPages - 2) {
      paginationHtml += `<span class="relative inline-flex items-center px-3 py-2 text-sm font-medium border-y border-l border-gray-300 bg-white text-gray-500">...</span>`;
    }
    paginationHtml += `<a href="#" class="pagination-link relative inline-flex items-center px-3 py-2 text-sm font-medium border-y border-l border-gray-300 bg-white text-gray-700 hover:bg-gray-50" data-page="${
      totalPages - 1
    }">${totalPages}</a>`;
  }

  // 다음 버튼
  paginationHtml += `
        <a href="#" class="pagination-link relative inline-flex items-center rounded-r-md px-3 py-2 text-sm font-medium border border-gray-300 bg-white ${
          last
            ? "text-gray-300 cursor-not-allowed"
            : "text-gray-700 hover:bg-gray-50"
        }" data-page="${currentPageNum + 1}" ${
    last ? 'aria-disabled="true" tabindex="-1"' : ""
  }>
        다음
        </a>`;

  paginationHtml += "</nav>";
  container.innerHTML = paginationHtml;

  // 새 페이지 링크에 이벤트 리스너 추가
  container.querySelectorAll(".pagination-link").forEach((link) => {
    if (link.getAttribute("aria-disabled") !== "true") {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const page = parseInt(event.currentTarget.dataset.page, 10);
        if (!isNaN(page)) {
          onPageClick(page);
        }
      });
    }
  });
}
