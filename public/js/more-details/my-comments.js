// js/my-comments.js

/**
 * "내가 작성한 댓글" 페이지 초기화 함수
 * @param {string} nickname - 현재 로그인한 사용자 닉네임
 * @param {object} elements - 공통 DOM 요소 객체
 */
async function initializeMyCommentsView(nickname, elements) {
  const {
    pageTitleElement,
    filterSectionElement,
    contentListElement,
    searchSectionElement,
    paginationContainerElement
  } = elements;

  if (pageTitleElement) pageTitleElement.textContent = '내가 작성한 댓글';
  if (searchSectionElement) searchSectionElement.style.display = 'block'; // 댓글 목록에서도 검색창 사용
  if (filterSectionElement) filterSectionElement.classList.remove('hidden');

  // URL에서 현재 상태 읽기
  const urlParams = new URLSearchParams(window.location.search);
  let currentPage = parseInt(urlParams.get('page') || '0');
  // 필터: '전체'는 빈 문자열, '최신순'은 'latest' (API 명세에 따라 값 조정 필요)
  let currentFilter = urlParams.get('filter') || ''; // '전체'를 나타내는 기본값
  let currentSearchQuery = urlParams.get('search') || '';

  // 필터 정보 (API 명세에 따라 'value' 조정 필요)
  const commentFilters = [
    { display: '전체', value: '' }, // API에서 '전체'를 빈 값으로 처리한다고 가정
    { display: '최신순', value: 'latest' } // API에서 '최신순'을 'latest'로 처리한다고 가정
  ];

  function mapDisplayFilterToApiValue(displayFilter) {
    const found = commentFilters.find((f) => f.display === displayFilter);
    return found ? found.value : '';
  }
  function mapApiValueToDisplayFilter(apiValue) {
    const found = commentFilters.find((f) => f.value === apiValue);
    return found ? found.display : '전체';
  }

  // 필터 버튼 UI 설정
  function setupFiltersUI() {
    if (!filterSectionElement) return;
    filterSectionElement.innerHTML = '';
    const filterButtonContainer = document.createElement('div');
    filterButtonContainer.className = 'flex space-x-2 overflow-x-auto';

    const currentDisplayFilterName = mapApiValueToDisplayFilter(currentFilter);

    commentFilters.forEach((filterInfo) => {
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

  // 검색 UI 설정
  function setupSearchUI() {
    if (!searchSectionElement) return;
    const searchInput = searchSectionElement.querySelector('#search-input');
    if (!searchInput) {
      console.warn(
        'Search input with id "search-input" not found in search-section for my-comments.'
      );
      return;
    }
    searchInput.value = currentSearchQuery;

    let debounceTimer;
    searchInput.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentSearchQuery = this.value;
        currentPage = 0;
        updateUrlAndReloadData();
      }, 500);
    });
  }

  // 데이터 로드 및 화면 표시
  async function loadAndRenderData(page = 0) {
    displayMessage(contentListElement, '댓글을 불러오는 중...', 'loading');
    if (paginationContainerElement) paginationContainerElement.innerHTML = '';

    const itemsPerPage = 5; // 페이지당 항목 수 (기존 my-comments.js size = 5)

    try {
      let apiUrl = `/api/v1/users/${nickname}/activity/more-details?type=my-comments&page=${page}&size=${itemsPerPage}`;
      if (currentFilter) {
        // API가 빈 filter 값을 '전체'로 인식하지 않는다면, 빈 값이 아닐때만 추가
        apiUrl += `&filter=${encodeURIComponent(currentFilter)}`;
      }
      if (currentSearchQuery) {
        apiUrl += `&search=${encodeURIComponent(currentSearchQuery)}`;
      }

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (response.status === 401) {
        return window.handle401Error(() => loadAndRenderData(page));
      }

      const result = await response.json();

      if (!response.ok || result.code !== 'SUCCESS') {
        throw new Error(result.message || `API 요청 실패: ${response.status}`);
      }

      const commentsData =
        result.data && result.data.content ? result.data.content : [];
      const isMe = result.data && result.data.me === true; // 본인 댓글 여부 (수정/삭제 버튼용)

      // 페이지 정보 파싱 (사용자 제공 정보 기반: size, number, totalElements, totalPages)
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
          // isFirst, isLast는 제공되지 않으므로 계산
          isFirst: apiPage.number === 0,
          isLast: apiPage.number >= apiPage.totalPages - 1
          // size: apiPage.size, // 필요시 사용
          // totalElements: apiPage.totalElements // 필요시 사용
        };
      } else {
        // 페이지 정보가 없는 경우 (my-posts.js 방식)
        const itemsOnPage = commentsData.length;
        let calculatedTotalPages;
        const isLastPageFallback =
          (itemsOnPage < itemsPerPage && itemsOnPage > 0) ||
          (itemsOnPage === 0 && page > 0);
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

      renderComments(commentsData, isMe);

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
      console.error('내 댓글 로드 중 오류 발생:', error);
      displayMessage(
        contentListElement,
        error.message || '댓글을 불러오는 중 오류가 발생했습니다.',
        'error'
      );
    }
  }

  // 댓글 목록 렌더링
  function renderComments(comments, isOwner) {
    if (!contentListElement) return;

    if (!comments || comments.length === 0) {
      let noDataMessage = '작성한 댓글이 없습니다.';
      if (currentSearchQuery || currentFilter) {
        noDataMessage = '선택한 조건에 맞는 댓글이 없습니다.';
      }
      displayMessage(contentListElement, noDataMessage, 'no-data');
      // 커뮤니티 활동 유도 메시지 (기존 my-comments.js 참고)
      const communityLinkHtml = `
        <div class="text-center mt-4">
          <a href="/community" class="text-primary hover:underline">커뮤니티에서 활동해보세요</a>
        </div>`;
      contentListElement.innerHTML += communityLinkHtml;
      return;
    }

    contentListElement.innerHTML = '';
    const listFragment = document.createDocumentFragment();
    comments.forEach((comment) => {
      const commentElement = document.createElement('div');
      commentElement.className =
        'border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition cursor-pointer mb-4 bg-white dark:bg-gray-800';

      // postId, commentId 필드명 API 응답 확인 필요 (예: comment.id, comment.postId)
      const commentId = comment.commentId || comment.id; // API 응답에 따라 조정
      const postId = comment.postId;

      commentElement.addEventListener('click', function (e) {
        if (e.target.closest('.edit-comment-btn, .delete-comment-btn')) return;
        if (postId) {
          window.location.href =
            comment.postUrl || `/community-detail.html?postId=${postId}`;
        }
      });

      commentElement.innerHTML = `
        <div class="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span class="font-medium text-primary mr-2">[${
            comment.categoryDisplayName || comment.category || '미분류'
          }]</span>
          <span>${formatDate(comment.createdAt)}</span>
          <span class="mx-1">•</span>
          <span>댓글</span>
        </div>
        <h3 class="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 hover:text-primary">
          "${comment.postTitle || '원본 게시글 제목 없음'}" 게시글에 남긴 댓글
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-3">${
          comment.commentContent || '댓글 내용 없음'
        }</p>
        ${
          isOwner && postId && commentId
            ? `
          <div class="flex justify-end">
            <div class="flex items-center gap-2">
              <button class="text-gray-500 dark:text-gray-400 hover:text-primary edit-comment-btn" data-post-id="${postId}" data-comment-id="${commentId}" title="댓글 수정">
                <i class="ri-edit-line text-base"></i>
              </button>
              <button class="text-gray-500 dark:text-gray-400 hover:text-red-500 delete-comment-btn" data-post-id="${postId}" data-comment-id="${commentId}" title="댓글 삭제">
                <i class="ri-delete-bin-line text-base"></i>
              </button>
            </div>
          </div>`
            : ''
        }
      `;
      listFragment.appendChild(commentElement);
    });
    contentListElement.appendChild(listFragment);

    if (isOwner) {
      setupActionButtons();
    }
  }

  // 수정/삭제 버튼 이벤트 설정
  function setupActionButtons() {
    contentListElement
      .querySelectorAll('.edit-comment-btn')
      .forEach((button) => {
        button.addEventListener('click', function (e) {
          e.stopPropagation();
          const postId = this.dataset.postId;
          const commentId = this.dataset.commentId;
          // 실제 구현 시에는 모달 창을 열거나 수정 UI 표시
          alert(
            `댓글 수정 기능: 게시글ID=${postId}, 댓글ID=${commentId} (구현 필요)`
          );
          // editComment(postId, commentId); // 기존 함수 호출 (내부 구현 필요)
        });
      });
    contentListElement
      .querySelectorAll('.delete-comment-btn')
      .forEach((button) => {
        button.addEventListener('click', async function (e) {
          e.stopPropagation();
          const postId = this.dataset.postId;
          const commentId = this.dataset.commentId;
          if (confirm('이 댓글을 정말 삭제하시겠습니까?')) {
            await deleteCommentApiCall(postId, commentId);
          }
        });
      });
  }

  // 댓글 삭제 API 호출
  async function deleteCommentApiCall(postId, commentId) {
    try {
      // API 엔드포인트: 기존 my-comments.js 참고 (/api/v1/community/comments/${postId}/${commentId})
      // postId와 commentId가 모두 필요함.
      if (!postId || !commentId) {
        alert('삭제할 댓글 정보를 찾을 수 없습니다.');
        return;
      }
      const apiUrl = `/api/v1/community/comments/${postId}/${commentId}`; // API 경로 확인 필요

      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (response.status === 401) {
        return window.handle401Error(() =>
          deleteCommentApiCall(postId, commentId)
        );
      }

      let result = {};
      if (response.status !== 204) {
        // No Content 응답은 body가 없을 수 있음
        result = await response.json().catch(() => ({})); // JSON 파싱 실패 시 빈 객체
      }

      // 성공 조건: HTTP 200, 204 또는 result.code === 'SUCCESS'
      if (
        response.ok &&
        (result.code === 'SUCCESS' ||
          response.status === 200 ||
          response.status === 204)
      ) {
        alert('댓글이 삭제되었습니다.');
        loadAndRenderData(currentPage); // 현재 페이지 데이터 다시 로드
      } else {
        throw new Error(
          result.message || `댓글 삭제 실패 (상태: ${response.status})`
        );
      }
    } catch (error) {
      console.error('댓글 삭제 중 오류:', error);
      alert(error.message || '댓글 삭제 중 오류가 발생했습니다.');
    }
  }

  // URL 업데이트 및 데이터 리로드 함수
  function updateUrlAndReloadData() {
    updateUrlParameters({
      type: 'my-comments',
      page: currentPage,
      filter: currentFilter || null, // 빈 문자열(전체)이면 파라미터에서 제외
      search: currentSearchQuery || null
    });
    setupFiltersUI(); // 필터 UI 즉시 업데이트 (선택된 스타일 변경 등)
    loadAndRenderData(currentPage);
  }

  // 초기 설정 및 데이터 로드
  setupFiltersUI();
  setupSearchUI();
  loadAndRenderData(currentPage);
}

// 전역 스코프에 노출
window.initializeMyCommentsView = initializeMyCommentsView;
