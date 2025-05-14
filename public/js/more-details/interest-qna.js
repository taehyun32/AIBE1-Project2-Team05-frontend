// js/interest-qna.js

/**
 * "추천 QnA" 페이지 초기화 함수
 * @param {string} nickname - 현재 로그인한 사용자 닉네임
 * @param {object} elements - 공통 DOM 요소 객체
 */
async function initializeInterestQnAView(nickname, elements) {
  const {
    pageTitleElement,
    filterSectionElement, // 추천 QnA는 필터 사용 안함
    contentListElement,
    searchSectionElement, // 추천 QnA는 검색 사용 안함
    paginationContainerElement
  } = elements;

  if (pageTitleElement) pageTitleElement.textContent = '추천 Q&A';
  if (filterSectionElement) filterSectionElement.innerHTML = '';
  if (searchSectionElement) searchSectionElement.style.display = 'none';

  const urlParams = new URLSearchParams(window.location.search);
  let currentPage = parseInt(urlParams.get('page') || '0');

  async function loadAndRenderInterestQnA(page = 0) {
    displayMessage(contentListElement, '추천 Q&A를 불러오는 중...', 'loading');
    if (paginationContainerElement) paginationContainerElement.innerHTML = '';

    const itemsPerPage = 10; // 페이지당 항목 수

    try {
      // API 엔드포인트: 제공된 interest-qna.js 파일의 경로를 따름.
      // 페이지네이션 파라미터 추가.
      // API 경로가 /api/v1/users/${nickname}/matching/more-details?type=interest-qna 였으나,
      // 다른 more-details API들과 일관성을 위해 /activity/more-details?type=interest-qna 로 변경될 가능성 있음.
      // 우선 제공된 경로 사용.
      const apiUrl = `/api/v1/users/${nickname}/matching/more-details?type=interest-qna&page=${page}&size=${itemsPerPage}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      });

      if (response.status === 401) {
        return window.handle401Error(() => loadAndRenderInterestQnA(page));
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // 에러 응답 파싱 시도
        throw new Error(
          errorData.message || `추천 Q&A 데이터 요청 실패: ${response.status}`
        );
      }

      const result = await response.json();

      if (result.code !== 'SUCCESS' || !result.data) {
        throw new Error(
          result.message || '추천 Q&A 데이터를 가져오는데 실패했습니다.'
        );
      }

      const posts = result.data.content || [];

      let pageInfo;
      if (result.data.page && typeof result.data.page.number === 'number') {
        const apiPage = result.data.page;
        pageInfo = {
          number: apiPage.number,
          totalPages: apiPage.totalPages,
          isFirst: apiPage.first,
          isLast: apiPage.last
        };
      } else {
        const isLastPage =
          result.data.last !== undefined
            ? result.data.last
            : (posts.length < itemsPerPage && posts.length > 0) ||
              (posts.length === 0 && page > 0);
        if (posts.length === 0 && page === 0) isLastPage = true; // 첫페이지에 데이터 없으면 마지막

        let calculatedTotalPages;
        if (posts.length === 0 && page === 0) {
          calculatedTotalPages = 1;
        } else if (isLastPage) {
          calculatedTotalPages = page + 1;
        } else {
          calculatedTotalPages = page + 2;
        }
        pageInfo = {
          number: page,
          totalPages: calculatedTotalPages,
          isFirst: page === 0,
          isLast: isLastPage
        };
      }
      currentPage = pageInfo.number;

      if (posts.length === 0 && currentPage === 0) {
        displayMessage(
          contentListElement,
          '추천된 질문/답변 게시글이 없습니다.',
          'no-data'
        );
        return;
      }

      contentListElement.innerHTML = ''; // 이전 내용 삭제
      const listFragment = document.createDocumentFragment();

      posts.forEach((post) => {
        const card = document.createElement('div');
        card.className =
          'border border-gray-200 rounded-lg p-4 hover:shadow-lg transition cursor-pointer mb-4 bg-white dark:bg-gray-800 dark:border-gray-700';

        const tagHTML = (post.tags || [])
          .map(
            (tag) =>
              `<span class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full mr-1 mb-1 inline-block">#${tag}</span>`
          )
          .join('');

        card.innerHTML = `
          <div class="flex justify-between items-start">
            <div class="flex gap-3 flex-1 min-w-0">
              <div class="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700">
                <img src="${
                  post.profileImageUrl || '../assets/images/default-profile.png'
                }" 
                     alt="${
                       post.nickname || '작성자'
                     } 프로필" class="w-full h-full object-cover"
                     onerror="handleImageError(this)">
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate" title="${
                  post.nickname || '작성자 없음'
                }">${post.nickname || '작성자 없음'}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">${formatDate(
                  post.createdAt
                )} &bull; 질문/답변</p>
                <h3 class="font-semibold text-base text-gray-900 dark:text-white mt-1 truncate" title="${
                  post.title || '제목 없음'
                }">${post.title || '제목 없음'}</h3>
                <p class="text-sm text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">${
                  post.content || post.preview || '내용 미리보기 없음'
                }</p>
                ${
                  tagHTML
                    ? `<div class="mt-2 flex flex-wrap">${tagHTML}</div>`
                    : ''
                }
              </div>
            </div>
            ${
              typeof post.commentCount === 'number'
                ? `
            <span class="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-1 rounded-full whitespace-nowrap ml-2 flex-shrink-0">
              답변 ${post.commentCount}개
            </span>`
                : ''
            }
          </div>
        `;
        // postId 필드명 확인 필요 (API 응답에 따라 post.id 또는 post.postId 등)
        const targetPostId = post.postId || post.id;
        if (targetPostId) {
          card.addEventListener(
            'click',
            () =>
              (window.location.href = `/community-detail.html?postId=${targetPostId}`)
          );
        } else {
          card.style.cursor = 'default';
        }
        listFragment.appendChild(card);
      });
      contentListElement.appendChild(listFragment);

      if (pageInfo.totalPages > 0 && paginationContainerElement) {
        // pageInfo.totalPages가 1보다 클때만 표시 (또는 데이터가 있을때)
        setupCommonPagination(
          paginationContainerElement,
          pageInfo,
          (newPage) => {
            updateUrlAndReloadData(newPage);
          }
        );
      }
    } catch (err) {
      console.error('추천 Q&A 로드 중 오류:', err);
      displayMessage(
        contentListElement,
        err.message || '데이터를 불러오지 못했습니다.',
        'error'
      );
    }
  }

  function updateUrlAndReloadData(page) {
    updateUrlParameters({
      // from common-utils.js
      type: 'interest-qna',
      page: page
    });
    loadAndRenderInterestQnA(page);
  }

  // 초기 데이터 로드
  loadAndRenderInterestQnA(currentPage);
}

// 전역 스코프에 노출 (more-details.js에서 호출 가능하도록)
window.initializeInterestQnAView = initializeInterestQnAView;
