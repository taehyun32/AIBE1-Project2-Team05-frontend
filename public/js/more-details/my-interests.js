// js/my-interests.js

/**
 * "관심 목록 (북마크/좋아요)" 페이지 초기화 함수
 * @param {string} nickname - 현재 로그인한 사용자 닉네임
 * @param {object} elements - 공통 DOM 요소 객체
 */
async function initializeMyInterestsView(nickname, elements) {
  const {
    pageTitleElement,
    filterSectionElement,
    contentListElement,
    searchSectionElement, // 관심 목록은 검색 사용 안함 (필요시 추가)
    paginationContainerElement
  } = elements;

  if (pageTitleElement) pageTitleElement.textContent = '관심 목록';
  if (searchSectionElement) searchSectionElement.style.display = 'none';
  if (filterSectionElement) filterSectionElement.classList.remove('hidden');

  const urlParams = new URLSearchParams(window.location.search);
  let currentPage = parseInt(urlParams.get('page') || '0');
  // 필터: API가 받을 값으로 정의 (예: 'all', 'bookmarked', 'liked')
  let currentFilter = urlParams.get('filter') || 'all'; // 기본값 'all'

  // 관심 목록 필터 정보 (API 명세에 따라 'value' 조정 필요)
  const interestFilters = [
    { display: '전체', value: 'all' },
    { display: '북마크', value: 'bookmarked' }, // 기존 코드에서는 'bookmarked'
    { display: '좋아요', value: 'liked' } // 기존 코드에서는 'liked'
  ];

  function mapApiFilterToDisplay(apiFilterValue) {
    const found = interestFilters.find((f) => f.value === apiFilterValue);
    return found ? found.display : '전체';
  }

  // 필터 버튼 UI 설정
  function setupFiltersUI() {
    if (!filterSectionElement) return;
    filterSectionElement.innerHTML = '';
    const filterButtonContainer = document.createElement('div');
    filterButtonContainer.className = 'flex space-x-2 overflow-x-auto';

    const currentDisplayFilterName = mapApiFilterToDisplay(currentFilter);

    interestFilters.forEach((filterInfo) => {
      const button = document.createElement('button');
      button.textContent = filterInfo.display;
      button.className = `px-4 py-2 rounded-full whitespace-nowrap text-sm ${
        filterInfo.display === currentDisplayFilterName
          ? 'bg-primary text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`;
      button.addEventListener('click', () => {
        currentFilter = filterInfo.value;
        currentPage = 0;
        updateUrlAndReloadData();
      });
      filterButtonContainer.appendChild(button);
    });
    filterSectionElement.appendChild(filterButtonContainer);
  }

  // 데이터 로드 및 화면 표시
  async function loadAndRenderData(page = 0) {
    displayMessage(contentListElement, '관심 목록을 불러오는 중...', 'loading');
    if (paginationContainerElement) paginationContainerElement.innerHTML = '';

    const itemsPerPage = 10; // 페이지당 항목 수 (기존 my-interests.js size = 10)

    try {
      // API 엔드포인트: 기존 my-interests.js 파일의 경로 사용
      let apiUrl = `/api/v1/users/${nickname}/activity/more-details/interests?page=${page}&size=${itemsPerPage}`;
      // 'filter' 파라미터: 'all'일 경우 API가 이를 인식하거나, 파라미터를 보내지 않아야 할 수 있음.
      // 여기서는 'all'도 필터 값으로 보냄 (API가 처리한다고 가정).
      apiUrl += `&filter=${encodeURIComponent(currentFilter)}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        credentials: 'include'
      });

      if (response.status === 401) {
        return window.handle401Error(() => loadAndRenderData(page));
      }

      const result = await response.json();

      if (!response.ok || result.code !== 'SUCCESS') {
        // API 응답 구조에 따라 result.status 또는 result.code 확인
        throw new Error(result.message || `API 요청 실패: ${response.status}`);
      }

      const interestsData =
        result.data && result.data.content ? result.data.content : [];

      let pageInfo;
      if (
        result.data &&
        result.data.page &&
        typeof result.data.page.number === 'number'
      ) {
        const apiPage = result.data.page;
        pageInfo = {
          number: apiPage.number,
          totalPages: apiPage.totalPages,
          isFirst: apiPage.number === 0,
          isLast: apiPage.number >= apiPage.totalPages - 1
        };
      } else {
        const itemsOnPage = interestsData.length;
        const isLastPageFallback =
          (itemsOnPage < itemsPerPage && itemsOnPage > 0) ||
          (itemsOnPage === 0 && page > 0);
        let calculatedTotalPages;
        if (itemsOnPage === 0 && page === 0) calculatedTotalPages = 1;
        else if (isLastPageFallback) calculatedTotalPages = page + 1;
        else calculatedTotalPages = page + 2;

        pageInfo = {
          number: page,
          totalPages: calculatedTotalPages,
          isFirst: page === 0,
          isLast:
            isLastPageFallback ||
            (page + 1 === calculatedTotalPages && calculatedTotalPages === 1)
        };
        if (itemsOnPage === 0 && page === 0) pageInfo.isLast = true;
      }
      currentPage = pageInfo.number;

      renderInterestsList(interestsData);

      if (pageInfo.totalPages > 1 && paginationContainerElement) {
        setupCommonPagination(
          paginationContainerElement,
          pageInfo,
          (newPage) => {
            currentPage = newPage;
            updateUrlAndReloadData();
          }
        );
      }
    } catch (error) {
      console.error('관심 목록 로드 중 오류 발생:', error);
      displayMessage(
        contentListElement,
        error.message || '관심 목록을 불러오는 중 오류가 발생했습니다.',
        'error'
      );
    }
  }

  // 관심 목록 렌더링
  function renderInterestsList(items) {
    if (!contentListElement) return;

    if (!items || items.length === 0) {
      let noDataMessage = '관심 목록이 없습니다.';
      if (currentFilter && currentFilter !== 'all') {
        noDataMessage = `선택한 필터에 해당하는 관심 항목이 없습니다. (필터: ${mapApiFilterToDisplay(
          currentFilter
        )})`;
      }
      displayMessage(contentListElement, noDataMessage, 'no-data');
      return;
    }

    contentListElement.innerHTML = '';
    const listFragment = document.createDocumentFragment();
    items.forEach((item) => {
      const itemElement = document.createElement('div');
      // API 응답에 따라 item.url 또는 item.targetType, item.targetId 등으로 링크 생성 필요
      const itemUrl = item.url || '#'; // 예시: 상세 페이지 URL이 있다면 사용
      const isClickable = itemUrl !== '#';

      itemElement.className = `bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-lg transition mb-4 ${
        isClickable ? 'cursor-pointer' : 'cursor-default'
      }`;

      if (isClickable) {
        itemElement.addEventListener('click', () => {
          window.location.href = itemUrl; // 또는 window.open(itemUrl, '_blank');
        });
      }

      // item.type을 기반으로 표시 텍스트 결정 (예: 'bookmark' -> '북마크', 'like' -> '좋아요')
      let typeDisplay = item.type;
      if (item.type === 'bookmark' || item.type === 'BOOKMARK')
        typeDisplay = '북마크';
      else if (item.type === 'like' || item.type === 'LIKE')
        typeDisplay = '좋아요';

      itemElement.innerHTML = `
        <div class="flex justify-between items-center mb-1">
            <div class="text-xs text-gray-500 dark:text-gray-400">
                ${
                  item.updatedAt
                    ? `최근 활동: ${formatDate(item.updatedAt)}`
                    : '날짜 정보 없음'
                }
            </div>
            ${
              typeDisplay
                ? `<span class="text-xs font-semibold ${
                    item.type === 'bookmark' || item.type === 'BOOKMARK'
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-pink-600 dark:text-pink-400'
                  }">${typeDisplay}</span>`
                : ''
            }
        </div>
        <h3 class="font-semibold text-gray-800 dark:text-gray-200 mb-1 truncate" title="${
          item.title || '제목 없음'
        }">
            ${item.title || '제목 없음'}
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">${
          item.content || '내용 없음'
        }</p>
        ${
          item.targetType
            ? `<p class="text-xs text-gray-400 dark:text-gray-500 mt-2">타입: ${item.targetType}</p>`
            : ''
        }
      `;
      listFragment.appendChild(itemElement);
    });
    contentListElement.appendChild(listFragment);
  }

  // URL 업데이트 및 데이터 리로드 함수
  function updateUrlAndReloadData() {
    updateUrlParameters({
      type: 'my-interests',
      page: currentPage,
      filter: currentFilter === 'all' ? null : currentFilter
    });
    setupFiltersUI(); // 필터 UI 즉시 업데이트
    loadAndRenderData(currentPage);
  }

  // 초기 설정 및 데이터 로드
  setupFiltersUI();
  loadAndRenderData(currentPage);
}

// 전역 스코프에 노출
window.initializeMyInterestsView = initializeMyInterestsView;
