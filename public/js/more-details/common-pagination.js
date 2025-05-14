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
    console.warn('Pagination container not found.'); // console.warn으로 변경
    return;
  }
  container.innerHTML = ''; // 초기화

  const currentPage = pageInfo.number;
  const totalPages = pageInfo.totalPages;

  // totalPages가 유효하지 않거나 1 이하이면 페이지네이션을 표시하지 않음
  if (typeof totalPages !== 'number' || totalPages <= 1) {
    return;
  }

  const navElement = document.createElement('nav');
  navElement.className = 'inline-flex rounded-md shadow-sm -space-x-px'; // -space-x-px for adjacent borders

  // isFirst, isLast가 명시적으로 제공되지 않으면 추론
  const isFirstPage =
    pageInfo.isFirst !== undefined ? pageInfo.isFirst : currentPage === 0;
  const isLastPage =
    pageInfo.isLast !== undefined
      ? pageInfo.isLast
      : currentPage >= totalPages - 1;

  // 이전 버튼
  const prevButton = document.createElement('a');
  prevButton.href = '#';
  prevButton.innerHTML = `<span class="sr-only">Previous</span><i class="ri-arrow-left-s-line h-5 w-5"></i>`;
  prevButton.className = `relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50`;
  if (isFirstPage) {
    prevButton.classList.add('opacity-50', 'cursor-not-allowed');
    prevButton.setAttribute('aria-disabled', 'true');
  } else {
    prevButton.addEventListener('click', (e) => {
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
  // ... (첫 페이지, 마지막 페이지, 생략 부호 '...' 추가 로직은 복잡도 증가로 일단 생략)

  for (let i = startPage; i < endPage; i++) {
    const pageButton = document.createElement('a');
    pageButton.href = '#';
    pageButton.textContent = i + 1;
    pageButton.className = `relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium`;
    if (i === currentPage) {
      pageButton.classList.add(
        'z-10',
        'bg-primary-50',
        'border-primary',
        'text-primary'
      ); // Tailwind primary color 가정
      pageButton.setAttribute('aria-current', 'page');
    } else {
      pageButton.classList.add('text-gray-700', 'hover:bg-gray-50');
      pageButton.addEventListener('click', (e) => {
        e.preventDefault();
        onPageChangeCallback(i);
      });
    }
    navElement.appendChild(pageButton);
  }

  // 다음 버튼
  const nextButton = document.createElement('a');
  nextButton.href = '#';
  nextButton.innerHTML = `<span class="sr-only">Next</span><i class="ri-arrow-right-s-line h-5 w-5"></i>`;
  nextButton.className = `relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50`;
  if (isLastPage) {
    nextButton.classList.add('opacity-50', 'cursor-not-allowed');
    nextButton.setAttribute('aria-disabled', 'true');
  } else {
    nextButton.addEventListener('click', (e) => {
      e.preventDefault();
      onPageChangeCallback(currentPage + 1);
    });
  }
  navElement.appendChild(nextButton);
  container.appendChild(navElement);
}
