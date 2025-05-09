/**
 * js/community.js
 * 커뮤니티 페이지의 주요 스크립트
 */
import {
  fetchMainPopularPosts,
  fetchWeeklyPopularPosts,
  fetchCommunityList,
  searchCommunities,
  fetchPopularTags,
} from "./communityAPI.js";
import {
  createPostItemFromTemplate,
  createWeeklyPopularPostItemFromTemplate,
  renderPagination,
} from "./communityRenderUtils.js";

import {
  DEFAULT_SORT,
  POSTS_PER_PAGE,
  SEARCH_RESULTS_PER_PAGE,
  MAIN_POPULAR_POSTS_LIMIT,
  MAIN_POPULAR_POSTS_DAYS,
  WEEKLY_POPULAR_POSTS_LIMIT,
  WEEKLY_POPULAR_POSTS_DAYS,
  SORT_OPTIONS,
  CATEGORY_DISPLAY_NAMES,
  POPULAR_TAGS_LIMIT,
  POPULAR_TAGS_DAYS,
} from "./communityContants.js";

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
  const popularTagsContainer = document.getElementById("popularTagsContainer");
  const activeUsersContainer = document.getElementById("activeUsersContainer");

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
          if (el instanceof HTMLInputElement || el instanceof HTMLButtonElement)
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
      button.className = "w-full text-left px-3 py-2 text-sm hover:bg-gray-100";
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
    if (!weeklyPopularPostsContainer || !weeklyPopularPostItemTemplate) return;
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
    const postItem = event.target.closest(".post-item, .weekly-popular-item a");
    if (!postItem) return;

    let postId;
    if (postItem.classList.contains("post-item") && postItem.dataset.postId) {
      postId = postItem.dataset.postId;
    } else if (postItem.tagName === "A" && postItem.href.includes("postId=")) {
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
        // Close dropdown if clicked outside
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

    // Initial Data Loads (run in parallel where possible)
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
});
