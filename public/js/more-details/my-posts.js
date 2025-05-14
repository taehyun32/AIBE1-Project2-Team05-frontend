// js/my-posts.js

/**
 * "내가 작성한 게시글" 페이지 초기화 함수
 * @param {string} nickname - 현재 로그인한 사용자 닉네임
 * @param {object} elements - 공통 DOM 요소 객체
 */
async function initializeMyPostsView(nickname, elements) {
  const {
    pageTitleElement,
    filterSectionElement,
    contentListElement,
    searchSectionElement,
    paginationContainerElement
  } = elements;

  if (pageTitleElement) pageTitleElement.textContent = '내가 작성한 게시글';
  if (searchSectionElement) searchSectionElement.style.display = 'block'; // 게시글 목록에서는 검색창 항상 표시

  // URL에서 현재 상태 읽기 (페이지, 필터, 검색어)
  const urlParams = new URLSearchParams(window.location.search);
  let currentPage = parseInt(urlParams.get('page') || '0');
  let currentDisplayFilter = urlParams.get('filter') || '전체'; // 화면 표시용 필터 이름
  let currentSearchQuery = urlParams.get('search') || '';

  // 필터 정보
  const postFilters = [
    { display: '전체', apiValue: 'ALL' },
    { display: '질문/답변', apiValue: 'QUESTION' },
    { display: '정보공유', apiValue: 'INFO' },
    { display: '후기', apiValue: 'REVIEW' }, // API 명세에 따라 실제 값 확인 필요
    { display: '자유게시판', apiValue: 'FREE' }
  ];

  function mapDisplayFilterToApiValue(displayFilter) {
    const found = postFilters.find((f) => f.display === displayFilter);
    return found ? found.apiValue : 'ALL';
  }

  // 필터 버튼 UI 설정
  function setupFiltersUI() {
    if (!filterSectionElement) return;
    filterSectionElement.innerHTML = '';
    const filterButtonContainer = document.createElement('div');
    filterButtonContainer.className = 'flex space-x-2 overflow-x-auto';

    postFilters.forEach((filterInfo) => {
      const button = document.createElement('button');
      button.textContent = filterInfo.display;
      button.className = `px-4 py-2 rounded-full whitespace-nowrap text-sm ${
        filterInfo.display === currentDisplayFilter
          ? 'bg-primary text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`;
      button.addEventListener('click', () => {
        currentDisplayFilter = filterInfo.display;
        currentPage = 0; // 필터 변경 시 0페이지부터
        updateUrlAndReloadData();
      });
      filterButtonContainer.appendChild(button);
    });
    filterSectionElement.appendChild(filterButtonContainer);
  }

  // 검색 UI 설정
  function setupSearchUI() {
    if (!searchSectionElement) return;
    const searchInput = searchSectionElement.querySelector('#search-input'); // HTML에 해당 ID가 있어야 함
    if (!searchInput) {
      console.warn(
        'Search input with id "search-input" not found in search-section for my-posts.'
      );
      // 필요시 동적으로 생성하거나, HTML 구조를 의존하도록 강제
      return;
    }
    searchInput.value = currentSearchQuery;

    let debounceTimer;
    searchInput.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentSearchQuery = this.value;
        currentPage = 0; // 검색 시 0페이지부터
        updateUrlAndReloadData();
      }, 500); // 500ms 디바운스
    });
  }

  // 데이터 로드 및 화면 표시
  async function loadAndRenderData(page = 0) {
    displayMessage(contentListElement, '게시글을 불러오는 중...', 'loading');
    paginationContainerElement.innerHTML = ''; // 이전 페이지네이션 삭제

    const apiStatusFilter = mapDisplayFilterToApiValue(currentDisplayFilter);
    const itemsPerPage = 5; // 페이지당 항목 수

    try {
      // API 엔드포인트 및 파라미터 구성
      let apiUrl = `/api/v1/users/${nickname}/activity/more-details?type=my-posts&page=${page}&size=${itemsPerPage}`;
      apiUrl += `&filter=${encodeURIComponent(apiStatusFilter)}`; // 'filter' 파라미터에 API용 status 값 사용
      if (currentSearchQuery) {
        apiUrl += `&search=${encodeURIComponent(currentSearchQuery)}`;
      }

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (response.status === 401) {
        // 공통 401 처리기 사용, 재시도 콜백 전달
        return window.handle401Error(() => loadAndRenderData(page));
      }

      const result = await response.json();

      console.log(result);
      if (!response.ok || result.code !== 'SUCCESS') {
        throw new Error(result.message || `API 요청 실패: ${response.status}`);
      }

      const postsData =
        result.data && result.data.content ? result.data.content : [];
      const isMe = result.data && result.data.me === true; // 본인 게시물 여부 (수정/삭제 버튼용)

      // 페이지 정보 처리 (my-posts.js 기존 방식 유지 및 공통 페이지네이션 함수와 호환되도록)
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
          isFirst: apiPage.first, // Spring Page 객체는 first, last 필드 제공
          isLast: apiPage.last
          // size: apiPage.size,
          // totalElements: apiPage.totalElements
        };
      } else {
        // 페이지 정보가 없는 경우 (사용자 요청: my-posts.js처럼 유연하게)
        const itemsOnPage = postsData.length;
        let calculatedTotalPages;
        if (itemsOnPage === 0 && page === 0) {
          // 첫 페이지인데 데이터 없음
          calculatedTotalPages = 1;
        } else if (itemsOnPage < itemsPerPage) {
          // 현재 페이지가 마지막 페이지일 가능성 높음
          calculatedTotalPages = page + 1;
        } else {
          // 다음 페이지가 더 있을 수 있음
          calculatedTotalPages = page + 2; // 임시로 다음 페이지가 더 있다고 가정
        }
        pageInfo = {
          number: page,
          totalPages: calculatedTotalPages,
          isFirst: page === 0,
          isLast:
            itemsOnPage < itemsPerPage || page + 1 === calculatedTotalPages
        };
      }
      currentPage = pageInfo.number; // 현재 페이지 업데이트

      renderPosts(postsData, isMe); // 게시글 목록 렌더링

      if (pageInfo.totalPages > 1) {
        setupCommonPagination(
          paginationContainerElement,
          pageInfo,
          (newPage) => {
            currentPage = newPage; // 페이지 변경 시 currentPage 업데이트
            updateUrlAndReloadData();
          }
        );
      }
    } catch (error) {
      console.error('내 게시글 로드 중 오류 발생:', error);
      displayMessage(
        contentListElement,
        error.message || '게시글을 불러오는 중 오류가 발생했습니다.',
        'error'
      );
    }
  }

  // 게시글 목록 렌더링
  function renderPosts(posts, isOwner) {
    if (!posts || posts.length === 0) {
      let noDataMessage = '작성한 게시글이 없습니다.';
      if (
        currentSearchQuery ||
        (currentDisplayFilter && currentDisplayFilter !== '전체')
      ) {
        noDataMessage = '선택한 조건에 맞는 게시글이 없습니다.';
      }
      displayMessage(contentListElement, noDataMessage, 'no-data');
      // 새 게시글 작성하기 버튼 추가
      const writeButtonHtml = `
        <div class="text-center mt-4">
          <a href="/community/write.html" class="inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-600 transition">
            <i class="ri-pencil-line mr-1"></i> 새 게시글 작성하기
          </a>
        </div>`;
      contentListElement.innerHTML += writeButtonHtml;
      return;
    }

    contentListElement.innerHTML = ''; // 기존 내용 삭제
    const listFragment = document.createDocumentFragment();
    posts.forEach((post) => {
      const postElement = document.createElement('div');
      postElement.className =
        'border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer mb-4';
      postElement.addEventListener('click', (e) => {
        if (e.target.closest('.edit-post-btn, .delete-post-btn')) return;
        window.location.href = `/community-detail.html?postId=${post.postId}`;
      });

      // 카테고리 표시 이름 찾기
      const categoryInfo = postFilters.find(
        (f) => f.apiValue === post.category
      );
      const categoryDisplayName = categoryInfo
        ? categoryInfo.display
        : post.category;

      postElement.innerHTML = `
        <div class="flex items-center text-xs text-gray-500 mb-1">
          <span>${formatDate(post.createdAt)}</span>
          <span class="mx-1">•</span>
          <span class="font-semibold text-primary mr-2">[${categoryDisplayName}]</span>
        </div>
        <h3 class="font-semibold text-lg mb-2 truncate" title="${post.title}">${
        post.title
      }</h3>
        <p class="text-sm text-gray-700 mb-3 h-10 overflow-hidden text-ellipsis--custom line-clamp-2">${
          post.content || '내용 없음'
        }</p>
        <div class="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
          <div class="flex items-center space-x-3">
            <span title="조회수"><i class="ri-eye-line mr-1"></i>${
              post.viewCount || 0
            }</span>
            <span title="좋아요"><i class="ri-heart-line mr-1"></i>${
              post.likeCount || 0
            }</span>
            <span title="댓글 수"><i class="ri-chat-1-line mr-1"></i>${
              post.commentCount || 0
            }</span>
          </div>
          ${
            isOwner
              ? `
            <div class="flex items-center gap-2">
              <button class="text-gray-500 hover:text-primary edit-post-btn" data-post-id="${post.postId}" title="게시글 수정">
                <i class="ri-edit-line text-base"></i>
              </button>
              <button class="text-gray-500 hover:text-red-500 delete-post-btn" data-post-id="${post.postId}" title="게시글 삭제">
                <i class="ri-delete-bin-line text-base"></i>
              </button>
            </div>`
              : ''
          }
        </div>
      `;
      listFragment.appendChild(postElement);
    });
    contentListElement.appendChild(listFragment);

    if (isOwner) {
      setupActionButtons(); // 수정/삭제 버튼 이벤트 리스너 등록
    }
  }

  // 수정/삭제 버튼 이벤트 설정
  function setupActionButtons() {
    contentListElement.querySelectorAll('.edit-post-btn').forEach((button) => {
      button.addEventListener('click', function (e) {
        e.stopPropagation();
        const postId = this.dataset.postId;
        window.location.href = `/community/edit.html?id=${postId}`; // 수정 페이지로 이동
      });
    });
    contentListElement
      .querySelectorAll('.delete-post-btn')
      .forEach((button) => {
        button.addEventListener('click', async function (e) {
          e.stopPropagation();
          const postId = this.dataset.postId;
          if (confirm('이 게시글을 정말 삭제하시겠습니까?')) {
            await deletePost(postId);
          }
        });
      });
  }

  // 게시글 삭제 API 호출
  async function deletePost(postId) {
    try {
      const response = await fetch(`/api/v1/community/${postId}`, {
        // API 엔드포인트 확인 필요
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (response.status === 401) {
        return window.handle401Error(() => deletePost(postId));
      }

      let result = {}; // 204 No Content의 경우 body가 없을 수 있음
      if (response.status !== 204) {
        result = await response.json();
      }

      if (
        response.ok &&
        (result.code === 'SUCCESS' ||
          response.status === 204 ||
          response.status === 200)
      ) {
        alert('게시글이 삭제되었습니다.');
        loadAndRenderData(currentPage); // 현재 페이지 데이터 다시 로드
      } else {
        throw new Error(
          result.message || `게시글 삭제 실패 (상태: ${response.status})`
        );
      }
    } catch (error) {
      console.error('게시글 삭제 중 오류:', error);
      alert(error.message || '게시글 삭제 중 오류가 발생했습니다.');
    }
  }

  // URL 업데이트 및 데이터 리로드 함수
  function updateUrlAndReloadData() {
    updateUrlParameters({
      type: 'my-posts', // 현재 type 유지
      page: currentPage,
      filter: currentDisplayFilter === '전체' ? null : currentDisplayFilter, // '전체'는 파라미터에서 제외
      search: currentSearchQuery || null
    });
    // 필터 UI는 URL 변경에 따라 popstate 핸들러가 setupPageByType을 호출하고,
    // initializeMyPostsView가 다시 실행되면서 setupFiltersUI에 의해 업데이트됨.
    // 또는 여기서 직접 setupFiltersUI(); 호출하여 즉시 반영 가능.
    setupFiltersUI(); // 즉시 반영
    loadAndRenderData(currentPage);
  }

  // 초기 설정 및 데이터 로드
  setupFiltersUI();
  setupSearchUI();
  loadAndRenderData(currentPage);
}
