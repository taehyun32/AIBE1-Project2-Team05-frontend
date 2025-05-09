/**
 * js/community.js
 * 커뮤니티 페이지의 주요 스크립트
 */

(function () {
  "use strict";
  /**
   * community 사용되는 상수 값을 정의
   */

  // API Configuration
  // const API_BASE_URL = "http://localhost:8080/v1/community";
  const API_BASE_URL = "/api/v1/community";

  // Community Page Specifics
  const POSTS_PER_PAGE = 5;
  const SEARCH_RESULTS_PER_PAGE = 10;
  const DEFAULT_SORT = "createdAt,desc";

  // 인기글 API 호출의 매개변수
  const MAIN_POPULAR_POSTS_LIMIT = 2;
  const MAIN_POPULAR_POSTS_DAYS = 2;

  const WEEKLY_POPULAR_POSTS_LIMIT = 5;
  const WEEKLY_POPULAR_POSTS_DAYS = 7;

  const POPULAR_TAGS_LIMIT = 10;
  const POPULAR_TAGS_DAYS = 30;

  // Category enum(백엔드)을 디스플레이 이름(프론트엔드)으로 매핑
  const CATEGORY_DISPLAY_NAMES = {
    ALL: "전체",
    QUESTION: "질문/답변",
    INFO: "정보공유",
    REVIEW: "후기",
    FREE: "자유게시판",
    TALENT: "재능 나눔",
  };

  // 정렬 옵션: [텍스트 표시, 매개변수 값 정렬]
  const SORT_OPTIONS = [
    { text: "최신순", value: "createdAt,desc" },
    { text: "인기순", value: "likeCount,desc" },
    { text: "조회순", value: "viewCount,desc" },
    { text: "댓글순", value: "commentCount,desc" },
  ];

  // 주간 인기 게시물의 순위 배지 색상
  const WEEKLY_RANK_BADGE_CLASSES = [
    "bg-red-100 text-red-600", // Rank 1
    "bg-orange-100 text-orange-600", // Rank 2
    "bg-yellow-100 text-yellow-600", // Rank 3
    "bg-gray-100 text-gray-600", // Default for ranks > 3
  ];

  /**
   * UI 구성 요소를 렌더링하고 데이터를 형식화하는 유틸리티 기능을 포함
   */

  /**
   * ISO 날짜 문자열(예: ZonedDateTime)을 YYYY-MM-DD 형식으로 포맷
   * @param {string} dateString - ISO 날짜 문자열
   * @returns {string} 형식화된 날짜 문자열 또는 'N/A'를 반환
   */
  function formatDate(dateString) {
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
  function getCategoryDisplayName(categoryEnum) {
    return CATEGORY_DISPLAY_NAMES[categoryEnum?.toUpperCase()] || "기타"; // 기타?
  }

  /**
   * 템플릿과 데이터를 사용하여 post item DOM 요소 생성
   * @param {HTMLTemplateElement} templateElement - post item의 template element
   * @param {object} post - CommunitySummaryResponse DTO 데이터.
   * @param {boolean} [isPopular=false] - 게시물을 인기 있는 것으로 표시할지 여부(예: HOT 배지 표시)
   * @returns {Node|null} 템플릿/데이터가 유효하지 않은 경우 채워진 게시 항목 요소(DocumentFragment) 또는 null을 반환
   */
  function createPostItemFromTemplate(templateElement, post, isPopular) {
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
  function createWeeklyPopularPostItemFromTemplate(
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
  function renderPagination(container, pageInfo, onPageClick) {
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

  /**
   * 백엔드 API와의 통신을 처리
   */

  // --- Core Fetch 기능 ---
  /**
   * 백엔드 API와 상호 작용하는 일반적인 fetch 기능
   * @param {string} endpoint - The API endpoint (e.g., '/list')
   * @param {object} [params={}] - URL query parameters
   * @returns {Promise<any>} - ApiResponse의 '데이터' 필드에서 얻은 실제 데이터
   * @throws {Error} -  가져오기가 실패하거나 API가 오류를 반환하는 경우
   */
  async function fetchApi(endpoint, params = {}) {
    const url = new URL(API_BASE_URL + endpoint);
    Object.keys(params).forEach((key) => {
      if (params[key] !== null && params[key] !== undefined) {
        url.searchParams.append(key, params[key]);
      }
    });

    try {
      const response = await fetch(url.toString(), { credentials: "include" });
      const responseBody = await response.json(); // 상태에 관계없이 JSON 구문 분석 시도

      // HTTP 상태 또는 APIResponse 구조를 기반으로 오류 확인
      if (!response.ok || (responseBody && responseBody.status >= 400)) {
        const errorMessage =
          responseBody?.message ||
          `Request failed with status ${response.status}`;
        console.error(`API Error (${endpoint}): ${errorMessage}`, responseBody);
        throw new Error(errorMessage);
      }

      // 성공: ApiResponse에서 데이터 필드 반환
      // '데이터'가 명시적으로 무효일 수 있는 경우 처리(예: 콘텐츠 없이 성공적으로 삭제)
      return responseBody.data !== undefined ? responseBody.data : null; // Return null if data is undefined
    } catch (error) {
      // 네트워크 오류 또는 JSON 구문 분석 오류 처리
      console.error(`Network or Parsing Error (${endpoint}):`, error);
      // 사용자 친화적이거나 표준화된 오류 Re-throw
      if (error instanceof SyntaxError) {
        throw new Error("Failed to parse server response.");
      }
      // 잡힌 오류를 다시 thorw ('if (!response.ok)' 블록에서 나온 오류일 수도 있고 네트워크 오류일 수도)
      throw error;
    }
  }

  // --- 커뮤니티 API 함수 ---

  /**
   * 주요 인기 커뮤니티 게시물 fetch (전체 요약)
   * endpoint: /popular
   * @param {number} limit - 최대 게시물 수
   * @param {number} day - 되돌아볼 일수
   * @returns {Promise<Array<object>>} - CommunitySummaryResponseDTO 배열
   */
  async function fetchMainPopularPosts(limit = 2, day = 2) {
    const popularPosts = await fetchApi("/popular", { limit, day });
    return popularPosts || [];
  }

  /**
   * 주간 인기 커뮤니티 게시물(ID, 제목, 카테고리) fetch
   * endpoint: /weekly-popular
   * @param {number} limit - 최대 게시물 수
   * @param {number} day - 되돌아볼 일수
   * @returns {Promise<Array<object>>} - CommunityWeeklyPopularDTOs 배열
   */
  async function fetchWeeklyPopularPosts(limit = 5, day = 7) {
    const weeklyPopularPosts = await fetchApi("/weekly-popular", {
      limit,
      day,
    });
    return weeklyPopularPosts || [];
  }

  /**
   * 커뮤니티 게시물 페이지 fetch
   * @param {number} [page=0] - 페이지 번호
   * @param {number} [size=5] - 페이지당 항목 수
   * @param {string|null} [category=null] - 필터링할 카테고리
   * @param {string} [sort="createdAt,desc"] - 정렬 매개변수
   * @param {string|null} [tag=null] - ⭐ 필터링할 태그 이름
   * @returns {Promise<object>} - 페이지 객체({content: [], 페이지: {totalPages, ...} })
   */
  async function fetchCommunityList(
    page = 0,
    size = 5,
    category = null,
    sort = "createdAt,desc",
    tag = null
  ) {
    const params = { page, size, sort };
    if (category) {
      params.category = category;
    }
    if (tag) {
      params.tag = tag;
    }
    const responseData = await fetchApi("/list", params);
    return (
      responseData || {
        content: [],
        page: {
          size,
          number: 0,
          totalElements: 0,
          totalPages: 0,
        },
      }
    );
  }

  /**
   * 커뮤니티 게시물을 키워드별로 검색
   * @param {string} keyword - 검색어
   * @param {number} [page=0] - 페이지 번호
   * @param {number} [size=10] - 페이지당 항목 수
   * @param {string} [sort="createdAt,desc"] - 정렬 매개변수
   * @returns {Promise<object>} - 페이지 객체
   */
  async function searchCommunities(
    keyword,
    page = 0,
    size = 10,
    sort = "createdAt,desc"
  ) {
    const params = { keyword, page, size, sort };
    const responseData = await fetchApi("/search", params);
    return (
      responseData || {
        content: [],
        page: {
          size,
          number: 0,
          totalElements: 0,
          totalPages: 0,
        },
      }
    );
  }

  /** 인기 태그 목록을 가져옵니다.
   * @param {number} limit - 가져올 태그의 최대 개수
   * @param {number} days - 최근 N일 기준
   * @returns {Promise<Array<object>>} - 태그 객체 배열 ({ name: string, count: number })
   */
  async function fetchPopularTags(limit = 10, days = 30) {
    const popularTags = await fetchApi("/popular-tags", { limit, days });
    return popularTags || [];
  }

  document.addEventListener("DOMContentLoaded", function () {
    // ---------------- State --------------------
    const state = {
      currentPage: 0,
      currentCategory: null, // null -> 'ALL'
      currentSort: DEFAULT_SORT,
      currentKeyword: "",
      currentTag: null,
      isSearching: false,
      isLoading: {
        mainList: false,
        mainPopular: false,
        weeklyPopular: false,
        popularTags: false,
      },
      totalPages: 0,
    };

    // ------------ DOM Elements -----------------

    const includeElements = document.querySelectorAll("[data-include-path]");

    includeElements.forEach(async function (el) {
      const path = el.getAttribute("data-include-path");
      const response = await fetch(path);
      const html = await response.text();
      el.innerHTML = html;
    });

    const mainPopularPostsContainer = document.getElementById(
      "mainPopularPostsContainer"
    );
    const weeklyPopularPostsContainer = document.getElementById(
      "weeklyPopularPostsContainer"
    );
    const communityListContainer = document.getElementById(
      "communityListContainer"
    );
    const paginationContainer = document.getElementById("paginationContainer");
    const categoryButtonsContainer = document.getElementById(
      "categoryButtonsContainer"
    );
    const sortButton = document.getElementById("sortButton");
    const sortDropdown = document.getElementById("sortDropdown");
    const sortButtonText = sortButton?.querySelector("span");
    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");
    const globalErrorMessageDiv = document.getElementById("errorMessage");
    const popularTagsContainer = document.getElementById(
      "popularTagsContainer"
    );
    const activeUsersContainer = document.getElementById(
      "activeUsersContainer"
    );

    // -------- Placeholders-------------
    const mainListLoadingIndicator = communityListContainer?.querySelector(
      '[data-placeholder="loading"]'
    );
    const mainListEmptyIndicator = communityListContainer?.querySelector(
      '[data-placeholder="empty"]'
    );
    const mainPopularLoadingIndicator = document.querySelector(
      '[data-placeholder="loading-popular"]'
    );
    const mainPopularEmptyIndicator = document.querySelector(
      '[data-placeholder="empty-popular"]'
    );
    const weeklyPopularLoadingIndicator = document.querySelector(
      '[data-placeholder="loading-weekly-popular"]'
    );
    const weeklyPopularEmptyIndicator = document.querySelector(
      '[data-placeholder="empty-weekly-popular"]'
    );

    const popularTagsLoadingIndicator = document.querySelector(
      '[data-placeholder="loading-popular-tags"]'
    );
    const popularTagsEmptyIndicator = document.querySelector(
      '[data-placeholder="empty-popular-tags"]'
    );

    const loadingActiveUsersIndicator = document.querySelector(
      '[data-placeholder="loading-active-users"]'
    );
    const emptyActiveUsersIndicator = document.querySelector(
      '[data-placeholder="empty-active-users"]'
    );

    // ------------------Templates---------------------
    const postItemTemplate = document.getElementById("postItemTemplate");
    const weeklyPopularPostItemTemplate = document.getElementById(
      "weeklyPopularPostItemTemplate"
    );
    // const activeUserItemTemplate = document.getElementById(
    //   "activeUserItemTemplate"
    // );

    // -------------- Helper & State Update --------------
    function updateLoadingState(section, isLoading) {
      state.isLoading[section] = isLoading;
      let indicator, emptyIndicatorAssociated;

      if (section === "mainList") {
        indicator = mainListLoadingIndicator;
        emptyIndicatorAssociated = mainListEmptyIndicator;
        [
          searchInput,
          searchButton,
          sortButton,
          categoryButtonsContainer,
          paginationContainer,
        ].forEach((el) => {
          if (el) {
            if (
              el instanceof HTMLInputElement ||
              el instanceof HTMLButtonElement
            )
              el.disabled = isLoading;
            else el.style.pointerEvents = isLoading ? "none" : "";
          }
        });
      } else if (section === "mainPopular") {
        indicator = mainPopularLoadingIndicator;
        emptyIndicatorAssociated = mainPopularEmptyIndicator;
      } else if (section === "weeklyPopular") {
        indicator = weeklyPopularLoadingIndicator;
        emptyIndicatorAssociated = weeklyPopularEmptyIndicator;
      } else if (section === "popularTags") {
        indicator = popularTagsLoadingIndicator;
        emptyIndicatorAssociated = popularTagsEmptyIndicator;
      }

      if (indicator) indicator.classList.toggle("hidden", !isLoading);
      if (isLoading && emptyIndicatorAssociated)
        emptyIndicatorAssociated.classList.add("hidden");
    }

    function showEmptyMessage(section, show) {
      let emptyIndicator;
      if (section === "mainList") emptyIndicator = mainListEmptyIndicator;
      else if (section === "mainPopular")
        emptyIndicator = mainPopularEmptyIndicator;
      else if (section === "weeklyPopular")
        emptyIndicator = weeklyPopularEmptyIndicator;
      else if (section === "popularTags")
        emptyIndicator = popularTagsEmptyIndicator;

      if (emptyIndicator) emptyIndicator.classList.toggle("hidden", !show);
    }

    function displayError(message, isGlobal = true) {
      const targetDiv = isGlobal ? globalErrorMessageDiv : null;
      if (targetDiv) {
        targetDiv.textContent = `오류: ${message}`;
        targetDiv.classList.remove("hidden");
      }
      console.error(message);
    }

    function clearError(isGlobal = true) {
      const targetDiv = isGlobal ? globalErrorMessageDiv : null;
      if (targetDiv) {
        targetDiv.textContent = "";
        targetDiv.classList.add("hidden");
      }
    }

    function updateState(newState) {
      Object.assign(state, newState);
      // console.log("State updated:", state); // debugging
    }

    // -------------- UI Update Functions ------------------------
    function updateCategoryButtonsUI() {
      if (!categoryButtonsContainer) return;
      categoryButtonsContainer.querySelectorAll("button").forEach((button) => {
        const category =
          button.dataset.category === "ALL" ? null : button.dataset.category;
        const isActive = category === state.currentCategory;
        button.classList.toggle("category-button-active", isActive);
        button.classList.toggle("category-button-inactive", !isActive);
      });
    }

    function updateSortButtonTextUI() {
      const currentSortOption = SORT_OPTIONS.find(
        (opt) => opt.value === state.currentSort
      );
      if (sortButtonText) {
        sortButtonText.textContent = currentSortOption
          ? currentSortOption.text
          : "정렬";
      }
    }

    function populateSortDropdown() {
      if (!sortDropdown) return;
      sortDropdown.innerHTML = "";
      SORT_OPTIONS.forEach((option) => {
        const button = document.createElement("button");
        button.className =
          "w-full text-left px-3 py-2 text-sm hover:bg-gray-100";
        button.textContent = option.text;
        button.dataset.sortValue = option.value;
        sortDropdown.appendChild(button);
      });
    }

    function populateCategoryButtons() {
      if (!categoryButtonsContainer) return;
      categoryButtonsContainer.innerHTML = ""; // Clear existing static buttons

      Object.entries(CATEGORY_DISPLAY_NAMES).forEach(([key, displayName]) => {
        const button = document.createElement("button");
        button.className = "category-button";
        button.textContent = displayName;
        button.dataset.category = key; // 'ALL', 'INFO', 'REVIEW', etc.
        categoryButtonsContainer.appendChild(button);
      });
      updateCategoryButtonsUI(); // Set initial active state
    }
    function updatePopularTagsUI() {
      if (!popularTagsContainer) return;
      popularTagsContainer.querySelectorAll(".tag-button").forEach((button) => {
        const isActive = button.dataset.tag === state.currentTag;
        button.classList.toggle("tag-button-active", isActive); // 활성/비활성 클래스 (CSS에 정의 필요)
        button.classList.toggle("tag-button-inactive", !isActive);
      });
    }

    // ------------------------- Rendering -------------------------------------
    function renderMainPopularPosts(posts) {
      if (!mainPopularPostsContainer || !postItemTemplate) return;
      mainPopularPostsContainer.innerHTML = "";

      if (posts.length === 0) {
        showEmptyMessage("mainPopular", true);
        return;
      }
      showEmptyMessage("mainPopular", false);

      const fragment = document.createDocumentFragment();
      posts.forEach((post) => {
        const postElement = createPostItemFromTemplate(
          postItemTemplate,
          post,
          true
        );
        if (postElement) fragment.appendChild(postElement);
      });
      mainPopularPostsContainer.appendChild(fragment);
    }

    function renderWeeklyPopularPosts(posts) {
      if (!weeklyPopularPostsContainer || !weeklyPopularPostItemTemplate)
        return;
      weeklyPopularPostsContainer.innerHTML = ""; // Clear previous

      if (posts.length === 0) {
        showEmptyMessage("weeklyPopular", true);
        return;
      }
      showEmptyMessage("weeklyPopular", false);

      const fragment = document.createDocumentFragment();
      posts.forEach((post, index) => {
        const postElement = createWeeklyPopularPostItemFromTemplate(
          weeklyPopularPostItemTemplate,
          post,
          index + 1
        );
        if (postElement) fragment.appendChild(postElement);
      });
      weeklyPopularPostsContainer.appendChild(fragment);
    }

    function renderCommunityList(posts) {
      if (!communityListContainer || !postItemTemplate) return;
      // Clear previous posts, but not placeholders
      communityListContainer
        .querySelectorAll(".post-item")
        .forEach((el) => el.remove());

      if (posts.length === 0) {
        showEmptyMessage("mainList", true);
        return;
      }
      showEmptyMessage("mainList", false);

      const fragment = document.createDocumentFragment();
      posts.forEach((post) => {
        const postElement = createPostItemFromTemplate(postItemTemplate, post);
        if (postElement) fragment.appendChild(postElement);
      });
      // Insert after placeholders if they exist, otherwise append
      if (mainListEmptyIndicator) mainListEmptyIndicator.before(fragment);
      else if (mainListLoadingIndicator)
        mainListLoadingIndicator.before(fragment);
      else communityListContainer.appendChild(fragment);
    }
    function renderPopularTags(tags) {
      if (!popularTagsContainer) return;
      popularTagsContainer.innerHTML = ""; // Clear previous

      if (tags.length === 0) {
        showEmptyMessage("popularTags", true);
        return;
      }
      showEmptyMessage("popularTags", false);

      const fragment = document.createDocumentFragment();
      tags.forEach((tag) => {
        const button = document.createElement("button");
        // 스타일은 CSS에서 .tag-button, .tag-button-active, .tag-button-inactive 등으로 정의
        // 여기서는 카테고리 버튼과 유사한 스타일을 사용한다고 가정
        button.className =
          "px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 tag-button tag-button-inactive"; // 기본 비활성 스타일
        button.textContent = `#${tag.name}`;
        button.dataset.tag = tag.name; // 태그 이름 저장
        button.addEventListener("click", () => handleTagClick(tag.name)); // 이벤트 리스너 직접 연결
        fragment.appendChild(button);
      });
      popularTagsContainer.appendChild(fragment);
      updatePopularTagsUI(); // 초기 활성 상태 반영
    }

    // ------------------------ Core Logic -----------------------------------
    async function loadMainPopular() {
      updateLoadingState("mainPopular", true);
      try {
        const posts = await fetchMainPopularPosts(
          MAIN_POPULAR_POSTS_LIMIT,
          MAIN_POPULAR_POSTS_DAYS
        );
        renderMainPopularPosts(posts);
      } catch (error) {
        displayError(`인기 게시글 로딩 실패: ${error.message}`, false); // Section specific error potentially
        showEmptyMessage("mainPopular", true); // Show empty on error too
      } finally {
        updateLoadingState("mainPopular", false);
      }
    }

    async function loadWeeklyPopular() {
      updateLoadingState("weeklyPopular", true);
      try {
        const posts = await fetchWeeklyPopularPosts(
          WEEKLY_POPULAR_POSTS_LIMIT,
          WEEKLY_POPULAR_POSTS_DAYS
        );
        renderWeeklyPopularPosts(posts);
      } catch (error) {
        displayError(`주간 인기 게시글 로딩 실패: ${error.message}`, false);
        showEmptyMessage("weeklyPopular", true);
      } finally {
        updateLoadingState("weeklyPopular", false);
      }
    }
    async function loadPopularTags() {
      updateLoadingState("popularTags", true);
      try {
        const tags = await fetchPopularTags(
          POPULAR_TAGS_LIMIT,
          POPULAR_TAGS_DAYS
        );
        renderPopularTags(tags);
      } catch (error) {
        displayError(`인기 태그 로딩 실패: ${error.message}`, false);
        showEmptyMessage("popularTags", true);
      } finally {
        updateLoadingState("popularTags", false);
      }
    }

    async function loadCommunityList() {
      updateLoadingState("mainList", true);
      clearError();
      communityListContainer
        .querySelectorAll(".post-item")
        .forEach((el) => el.remove()); // Clear old items
      showEmptyMessage("mainList", false);
      if (paginationContainer) paginationContainer.innerHTML = "";

      let pageData;
      try {
        const pageSize = state.isSearching
          ? SEARCH_RESULTS_PER_PAGE
          : POSTS_PER_PAGE;
        const categoryToFetch =
          state.currentCategory === "ALL" ? null : state.currentCategory;

        if (state.isSearching && state.currentKeyword) {
          pageData = await searchCommunities(
            state.currentKeyword,
            state.currentPage,
            pageSize,
            state.currentSort
          );
        } else {
          pageData = await fetchCommunityList(
            state.currentPage,
            pageSize,
            categoryToFetch,
            state.currentSort,
            state.currentTag
          );
        }
        updateState({ totalPages: pageData.page.totalPages });
        renderCommunityList(pageData.content);
        if (paginationContainer) {
          renderPagination(
            paginationContainer,
            pageData.page,
            handlePaginationLinkClick
          );
        }
      } catch (error) {
        displayError(error.message);
        showEmptyMessage("mainList", true); // Show empty on error
      } finally {
        updateLoadingState("mainList", false);
      }
    }

    // ---------------------------- Event Handlers ----------------------------
    function handlePaginationLinkClick(page) {
      if (page === state.currentPage) return;
      updateState({ currentPage: page });
      loadCommunityList();
      window.scrollTo(0, communityListContainer.offsetTop - 100); // Scroll to top of list
    }

    function handleCategoryClick(event) {
      const button = event.target.closest("button[data-category]");
      if (!button || !categoryButtonsContainer.contains(button)) return;

      const selectedCategoryValue = button.dataset.category;
      const categoryToSet =
        selectedCategoryValue === "ALL" ? null : selectedCategoryValue;

      if (categoryToSet === state.currentCategory) return;

      updateState({
        currentCategory: categoryToSet,
        currentPage: 0,
        isSearching: false,
        currentKeyword: "",
        currentTag: state.currentTag,
      });
      if (searchInput) searchInput.value = "";

      updateCategoryButtonsUI();
      loadCommunityList();
    }

    function handleTagClick(tagName) {
      if (state.isLoading.mainList) return; // 목록 로딩 중이면 처리 안함

      const newTag = state.currentTag === tagName ? null : tagName; // 다시 클릭하면 선택 해제

      updateState({
        currentTag: newTag,
        currentPage: 0,
        isSearching: false, // 태그 검색은 일반 목록 조회로 간주
        currentKeyword: "",
      });
      if (searchInput) searchInput.value = "";

      updatePopularTagsUI();
      // updateCategoryButtonsUI(); // 카테고리 상태는 변경되지 않음
      loadCommunityList();
    }

    function handleSortDropdownClick(event) {
      const button = event.target.closest("button[data-sort-value]");
      if (!button || !sortDropdown.contains(button)) return;

      const sortValue = button.dataset.sortValue;
      if (sortValue && sortValue !== state.currentSort) {
        updateState({ currentSort: sortValue, currentPage: 0 });
        updateSortButtonTextUI();
        loadCommunityList();
      }
      sortDropdown.classList.add("hidden");
    }

    function handleSearch() {
      const keyword = searchInput.value.trim();
      // If keyword is empty and was searching, reset to non-search mode
      if (!keyword && state.isSearching) {
        updateState({
          isSearching: false,
          currentKeyword: "",
          currentPage: 0,
          currentCategory: null, // Reset to "ALL" category
          currentTag: null,
        });
        updateCategoryButtonsUI(); // Reflect category change
        loadCommunityList();
        return;
      }
      // If new keyword, trigger search
      if (keyword && (keyword !== state.currentKeyword || !state.isSearching)) {
        updateState({
          isSearching: true,
          currentKeyword: keyword,
          currentPage: 0,
          currentCategory: null, // Searches usually ignore category filters
          currentTag: null,
        });
        updateCategoryButtonsUI(); // Deselect category
        updatePopularTagsUI();
        loadCommunityList();
      }
    }

    function handlePostItemClick(event) {
      const postItem = event.target.closest(
        ".post-item, .weekly-popular-item a"
      );
      if (!postItem) return;

      let postId;
      if (postItem.classList.contains("post-item") && postItem.dataset.postId) {
        postId = postItem.dataset.postId;
      } else if (
        postItem.tagName === "A" &&
        postItem.href.includes("postId=")
      ) {
        // For weekly popular items, which are wrapped in <a>
        try {
          const url = new URL(postItem.href);
          postId = url.searchParams.get("postId");
        } catch (e) {
          console.error(
            "Could not parse postId from weekly popular item link",
            e
          );
          return;
        }
      }

      if (postId) {
        // Check if postId is already a full URL or just an ID
        if (postId.startsWith("http")) {
          window.location.href = postId; // If it's a full URL somehow
        } else {
          window.location.href = `/community-detail.html?postId=${postId}`;
        }
      }
    }

    // ---------------------- Initial Setup ----------------------------------
    async function initializePage() {
      populateCategoryButtons();
      populateSortDropdown();
      updateSortButtonTextUI();

      // Event Listeners
      if (categoryButtonsContainer)
        categoryButtonsContainer.addEventListener("click", handleCategoryClick);
      if (sortButton && sortDropdown) {
        sortButton.addEventListener("click", (e) => {
          e.stopPropagation();
          sortDropdown.classList.toggle("hidden");
        });
        sortDropdown.addEventListener("click", handleSortDropdownClick);
        document.addEventListener("click", (event) => {
          // 드롭다운 외부 클릭하면 닫힘
          if (
            !sortButton.contains(event.target) &&
            !sortDropdown.contains(event.target)
          ) {
            sortDropdown.classList.add("hidden");
          }
        });
      }
      if (searchButton) searchButton.addEventListener("click", handleSearch);
      if (searchInput)
        searchInput.addEventListener("keypress", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSearch();
          }
        });

      // 메인 목록 및 인기 섹션에 대한 위임된 post click listener
      const mainContentArea = document.querySelector("main"); // Or a more specific container
      if (mainContentArea)
        mainContentArea.addEventListener("click", handlePostItemClick);

      // 초기 데이터 로드(가능한 경우 병렬로 실행)
      clearError();
      Promise.allSettled([
        loadMainPopular(),
        loadWeeklyPopular(),
        loadPopularTags(),
        loadCommunityList(), // Main list depends on initial state, so fine here
      ]).then((results) => {
        results.forEach((result) => {
          if (result.status === "rejected") {
            console.error("Initialization load error:", result.reason);
            // displayError might have been called by individual load functions
          }
        });
      });
    }

    // ---------------------------- Run ---------------------------
    initializePage();
  }); // End of DOMContentLoaded
})(); // End of IIFE
