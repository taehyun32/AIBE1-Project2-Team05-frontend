// js/common-pagination.js

/**
 * 공통 페이지네이션 UI를 생성하고 이벤트를 설정합니다.
 * @param {HTMLElement} container - 페이지네이션을 표시할 HTML 요소
 * @param {object} pageInfo - 페이지 정보 객체
 * @param {number} pageInfo.number - 현재 페이지 번호 (0부터 시작)
 * @param {number} pageInfo.totalPages - 전체 페이지 수
 * @param {boolean} [pageInfo.isFirst] - 첫 페이지 여부 (옵션, number와 totalPages로 추론 가능)
 * @param {boolean} [pageInfo.isLast] - 마지막 페이지 여부 (옵션, number와 totalPages로 추론 가능)
 * @param {function(number)} onPageChangeCallback - 페이지 변경 시 호출될 콜백 함수 (새 페이지 번호를 인자로 받음)
 */
function setupCommonPagination(container, pageInfo, onPageChangeCallback) {
  if (!container) {
    console.warn("Pagination container not found.");
    return;
  }

  // 페이지네이션 컨테이너 초기화
  container.innerHTML = '<nav class="inline-flex rounded-md shadow-sm"></nav>';

  const navElement = container.querySelector("nav");

  const currentPage = pageInfo.number;
  const totalPages = pageInfo.totalPages;

  // totalPages가 유효하지 않거나 1 이하이면 페이지네이션을 표시하지 않음
  if (typeof totalPages !== "number" || totalPages <= 1) {
    return;
  }

  // isFirst, isLast가 명시적으로 제공되지 않으면 추론
  const isFirstPage = pageInfo.isFirst !== undefined ? pageInfo.isFirst : currentPage === 0;
  const isLastPage = pageInfo.isLast !== undefined ? pageInfo.isLast : currentPage >= totalPages - 1;

  // 이전 버튼
  const prevButton = document.createElement("a");
  prevButton.href = "#";
  prevButton.className = "px-3 py-2 border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 rounded-l-md";
  prevButton.textContent = "이전";

  if (isFirstPage) {
    prevButton.classList.add("opacity-50", "cursor-not-allowed");
    prevButton.setAttribute("aria-disabled", "true");
  } else {
    prevButton.addEventListener("click", function (e) {
      e.preventDefault();
      onPageChangeCallback(currentPage - 1);
    });
  }

  navElement.appendChild(prevButton);

  // 페이지 번호 버튼 (최대 5개 표시, 현재 페이지 중앙 정렬 시도)
  const MAX_VISIBLE_PAGES = 5;
  let startPage, endPage;

  if (totalPages <= MAX_VISIBLE_PAGES) {
    startPage = 0;
    endPage = totalPages;
  } else {
    const halfMax = Math.floor(MAX_VISIBLE_PAGES / 2);

    if (currentPage <= halfMax) {
      startPage = 0;
      endPage = MAX_VISIBLE_PAGES;
    } else if (currentPage + halfMax >= totalPages) {
      startPage = totalPages - MAX_VISIBLE_PAGES;
      endPage = totalPages;
    } else {
      startPage = currentPage - halfMax;
      endPage = currentPage + halfMax + 1;
    }
  }

  for (let i = startPage; i < endPage; i++) {
    const pageButton = document.createElement("a");
    pageButton.href = "#";
    pageButton.textContent = i + 1;

    if (i === currentPage) {
      pageButton.className = "px-3 py-2 border-t border-b border-gray-300 bg-primary text-white";
      pageButton.setAttribute("aria-current", "page");
    } else {
      pageButton.className = "px-3 py-2 border-t border-b border-gray-300 bg-white text-gray-500 hover:bg-gray-50";
      pageButton.addEventListener("click", function (e) {
        e.preventDefault();
        onPageChangeCallback(i);
      });
    }

    navElement.appendChild(pageButton);
  }

  // 다음 버튼
  const nextButton = document.createElement("a");
  nextButton.href = "#";
  nextButton.className = "px-3 py-2 border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 rounded-r-md";
  nextButton.textContent = "다음";

  if (isLastPage) {
    nextButton.classList.add("opacity-50", "cursor-not-allowed");
    nextButton.setAttribute("aria-disabled", "true");
  } else {
    nextButton.addEventListener("click", function (e) {
      e.preventDefault();
      onPageChangeCallback(currentPage + 1);
    });
  }

  navElement.appendChild(nextButton);
}
