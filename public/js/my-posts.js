// myposts.js

/**
 * 마이페이지 - 내가 작성한 게시글 더보기 페이지 로직
 * URL: /more-details.html?type=my-posts
 *
 * 사용자가 작성한 모든 게시글을 보여주는 상세 페이지입니다.
 * 세션스토리지에서 닉네임을 가져와 API를 호출합니다.
 * 필터링, 검색, 페이지네이션 기능을 포함합니다.
 */

/**
 * "내가 작성한 게시글" 페이지 초기화 함수
 * @param {string} [id] - URL에서 전달될 수 있는 ID (현재 사용되지 않음)
 */
async function initializeMyPostsView(id) {
    const urlParams = new URLSearchParams(window.location.search);
    const currentPage = parseInt(urlParams.get("page") || "0");
    const currentDisplayFilter = urlParams.get("filter") || "전체"; // URL 'filter' 파라미터는 화면 표시용
    const currentSearch = urlParams.get("search") || "";

    const nickname = sessionStorage.getItem("nickname");
    if (!nickname) {
        showMyPostsErrorMessage("사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.");
        return;
    }

    // more-details.js에서 페이지 타이틀은 이미 설정됨.
    // 필터 버튼 및 검색창 설정
    const postFilters = ["전체", "질문/답변", "정보공유", "후기", "자유게시판"];
    setupMyPostsFilters(postFilters, nickname, currentDisplayFilter, currentSearch);
    setupMyPostsSearch(nickname, currentDisplayFilter, currentSearch);

    const apiStatusFilter = mapDisplayFilterToApiStatus(currentDisplayFilter);
    await loadMyPostsData(nickname, currentPage, apiStatusFilter, currentSearch);
}

/**
 * 화면 표시용 필터 이름을 API 요청 시 사용할 status 값으로 변환
 * @param {string} displayFilter - 화면에 표시되는 필터 이름 (예: "정보공유")
 * @returns {string} API 요청에 사용될 status 값 (예: "INFO")
 */
function mapDisplayFilterToApiStatus(displayFilter) {
    const map = {
        "전체": "ALL",
        "질문/답변": "QUESTION",
        "정보공유": "INFO",
        "후기": "REVIEW", // API 명세에 따라 실제 값 확인 필요
        "자유게시판": "FREE"
    };
    return map[displayFilter] || "ALL";
}

/**
 * API status 값을 화면 표시용 필터 이름으로 변환
 * @param {string} apiStatus - API의 status 값 (예: "INFO")
 * @returns {string} 화면에 표시되는 필터 이름 (예: "정보공유")
 */
function mapApiStatusToDisplayFilter(apiStatus) {
    const map = {
        "ALL": "전체",
        "QUESTION": "질문/답변",
        "INFO": "정보공유",
        "REVIEW": "후기",
        "FREE": "자유게시판"
    };
    return map[apiStatus] || "전체";
}

/**
 * "내가 작성한 게시글" 페이지의 필터 버튼 설정
 * @param {string[]} filters - 필터 이름 배열
 * @param {string} nickname - 사용자 닉네임
 * @param {string} currentDisplayFilter - 현재 활성화된 화면 표시용 필터
 * @param {string} currentSearch - 현재 검색어
 */
function setupMyPostsFilters(filters, nickname, currentDisplayFilter, currentSearch) {
    const filterContainer = document.querySelector("#filter-section .flex.space-x-2");
    if (!filterContainer) {
        console.error("Filter container not found for my-posts.");
        return;
    }
    filterContainer.innerHTML = ""; // 기존 필터 버튼들 제거

    filters.forEach((filterName) => {
        const button = document.createElement("button");
        button.textContent = filterName;
        button.className = filterName === currentDisplayFilter
            ? "px-4 py-2 bg-primary text-white rounded-full whitespace-nowrap"
            : "px-4 py-2 bg-gray-100 text-gray-700 rounded-full whitespace-nowrap hover:bg-gray-200";

        button.addEventListener("click", () => {
            const apiStatusFilter = mapDisplayFilterToApiStatus(filterName);
            updateMyPostsPageUrl(0, filterName, currentSearch); // 페이지는 0으로, 새 필터, 현재 검색어
            loadMyPostsData(nickname, 0, apiStatusFilter, currentSearch);

            // 버튼 활성화 상태 업데이트
            filterContainer.querySelectorAll("button").forEach(btn => {
                btn.className = "px-4 py-2 bg-gray-100 text-gray-700 rounded-full whitespace-nowrap hover:bg-gray-200";
            });
            button.className = "px-4 py-2 bg-primary text-white rounded-full whitespace-nowrap";
        });
        filterContainer.appendChild(button);
    });
}

/**
 * "내가 작성한 게시글" 페이지의 검색 기능 설정
 * @param {string} nickname - 사용자 닉네임
 * @param {string} initialDisplayFilter - 초기 화면 표시용 필터
 * @param {string} initialSearchQuery - 초기 검색어
 */
function setupMyPostsSearch(nickname, initialDisplayFilter, initialSearchQuery) {
    const searchInput = document.getElementById("search-input");
    const searchSection = document.getElementById("search-section");

    if (!searchInput || !searchSection) {
        console.warn("Search input or section not found for my-posts.");
        if(searchSection) searchSection.style.display = 'block'; // Ensure it's visible if it exists
        return;
    }
    searchSection.style.display = 'block'; // 게시글 목록에서는 검색창 항상 표시
    searchInput.value = initialSearchQuery;

    let debounceTimer;
    searchInput.addEventListener("input", function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            // 현재 활성화된 필터 가져오기 (URL 또는 버튼 상태에서)
            const urlParams = new URLSearchParams(window.location.search);
            const currentDisplayFilterFromUrl = urlParams.get("filter") || "전체";
            const apiStatusFilter = mapDisplayFilterToApiStatus(currentDisplayFilterFromUrl);

            updateMyPostsPageUrl(0, currentDisplayFilterFromUrl, this.value); // 페이지 0, 현재 필터, 새 검색어
            loadMyPostsData(nickname, 0, apiStatusFilter, this.value);
        }, 500); // 500ms 디바운스
    });
}

/**
 * 페이지 URL 파라미터 업데이트 (페이지 새로고침 없이)
 * @param {number} page - 새 페이지 번호
 * @param {string | null} displayFilter - 새 화면 표시용 필터. null이면 기존 값 유지.
 * @param {string | null} search - 새 검색어. null이면 기존 값 유지.
 */
function updateMyPostsPageUrl(page, displayFilter, search) {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get("type"); // "my-posts"

    const newParams = new URLSearchParams();
    newParams.set("type", type);
    newParams.set("page", page.toString());

    if (displayFilter !== null) { // displayFilter가 명시적으로 전달된 경우
        if (displayFilter && displayFilter !== "전체") {
            newParams.set("filter", displayFilter);
        } else {
            newParams.delete("filter"); // "전체"는 filter 파라미터 없음
        }
    } else { // 기존 filter 값 유지
        const currentUrlFilter = urlParams.get("filter");
        if (currentUrlFilter) newParams.set("filter", currentUrlFilter);
    }

    if (search !== null) { // search가 명시적으로 전달된 경우
        if (search) {
            newParams.set("search", search);
        } else {
            newParams.delete("search");
        }
    } else { // 기존 search 값 유지
        const currentUrlSearch = urlParams.get("search");
        if (currentUrlSearch) newParams.set("search", currentUrlSearch);
    }

    const newUrl = `${window.location.pathname}?${newParams.toString()}`;
    window.history.pushState({ path: newUrl }, "", newUrl);
}

/**
 * "내가 작성한 게시글" 데이터 로드 및 화면 표시
 * @param {string} nickname - 사용자 닉네임
 * @param {number} page - 요청할 페이지 번호
 * @param {string} apiStatusFilter - API 요청에 사용할 status 필터 값
 * @param {string} searchQuery - 검색어
 */
async function loadMyPostsData(nickname, page = 0, apiStatusFilter = "ALL", searchQuery = "") {
    const contentList = document.getElementById("content-list");
    const paginationContainer = document.querySelector(".flex.justify-center.mt-6");

    if (!contentList || !paginationContainer) {
        console.error("Essential page elements (content-list or paginationContainer) not found.");
        return;
    }

    contentList.innerHTML = `<div class="flex justify-center items-center py-20"><div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div><p class="ml-2 text-gray-500">게시글을 불러오는 중...</p></div>`;
    paginationContainer.innerHTML = ""; // 페이지네이션 초기화

    const size = 5; // 페이지당 게시글 수
    let apiUrl = `/api/v1/users/${nickname}/activity/more-details?type=my-posts&page=${page}&size=${size}`;

    // API URL에 status 필터 추가 (참고 1의 API URL 형식 준수)
    apiUrl += `&status=${encodeURIComponent(apiStatusFilter)}`;

    if (searchQuery) {
        apiUrl += `&search=${encodeURIComponent(searchQuery)}`; // API가 search 파라미터를 지원한다고 가정
    }

    try {
        const response = await fetch(apiUrl, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // 쿠키 전송을 위해
        });

        if (response.status === 401) {
            // include-and-authHandler.js의 전역 핸들러 사용 가정
            const refreshed = await window.handle401Error();
            if (refreshed) {
                return await loadMyPostsData(nickname, page, apiStatusFilter, searchQuery); // 재시도
            } else {
                window.location.href = "/login"; // 로그인 페이지로 이동
                return;
            }
        }
        
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `API 요청 실패: ${response.status}`);
        }


        if (result.status === 200 || result.code === "SUCCESS") {
            const postsData = result.data.content || [];
            const isMe = result.data.me === true; // "my-posts"이므로 항상 true여야 함

            // 페이지네이션 정보 (참고 1 API 응답 구조 기반)
            const pageInfo = result.data.page || {
                number: page,
                totalPages: result.data.totalPages !== undefined ? result.data.totalPages : 1,
                hasNext: result.data.hasNext !== undefined ? result.data.hasNext : false,
                last: result.data.last !== undefined ? result.data.last : true
            };
             if(pageInfo.number === undefined) pageInfo.number = page; // API가 number 안 줄 경우 대비
             if(pageInfo.totalPages === undefined && result.data.content) { // totalPages 안정적으로 계산
                pageInfo.totalPages = pageInfo.last ? page + 1 : page + 2; // 임시 계산법
             }


            displayMyPosts(postsData, contentList, isMe);
            if (pageInfo.totalPages > 1) {
                 setupMyPostsPagination(paginationContainer, pageInfo, nickname, apiStatusFilter, searchQuery);
            }
        } else {
            showMyPostsErrorMessage(result.message || "게시글을 불러오는데 실패했습니다.");
        }
    } catch (error) {
        console.error("내 게시글 로드 중 오류 발생:", error);
        showMyPostsErrorMessage(`오류 발생: ${error.message}`);
    }
}

/**
 * 불러온 게시글 목록을 화면에 표시
 * @param {Array} posts - 게시글 데이터 배열
 * @param {HTMLElement} container - 게시글을 표시할 HTML 요소
 * @param {boolean} isMe - 현재 사용자의 게시글인지 여부
 */
function displayMyPosts(posts, container, isMe) {
    if (!container) return;
    container.innerHTML = ""; // 기존 내용 삭제

    if (!posts || posts.length === 0) {
        const urlParams = new URLSearchParams(window.location.search);
        const currentSearch = urlParams.get("search");
        const currentFilter = urlParams.get("filter");
        let message = "작성한 게시글이 없습니다.";
        if (currentSearch || (currentFilter && currentFilter !== "전체")) {
            message = "선택한 조건에 맞는 게시글이 없습니다.";
        }
        container.innerHTML = `
        <div class="text-center py-10">
          <div class="w-16 h-16 mx-auto mb-3 text-gray-400"><i class="ri-file-list-3-line text-5xl"></i></div>
          <p class="text-gray-600 mb-4">${message}</p>
          <a href="/community/write.html" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 transition">
            <i class="ri-pencil-line mr-1"></i> 새 게시글 작성하기
          </a>
        </div>`;
        return;
    }

    posts.forEach(post => {
        const postElement = document.createElement("div");
        // 게시글 클릭 시 상세 페이지로 이동 (수정/삭제 버튼 제외)
        postElement.addEventListener('click', (e) => {
            if (e.target.closest('.edit-post-btn, .delete-post-btn')) {
                return; // 수정 또는 삭제 버튼 클릭 시에는 이동 방지
            }
            window.location.href = `/community-detail.html?postId=${post.id}`;
        });
        postElement.className = "border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer";


        const date = new Date(post.createdAt);
        // 'sv-SE' 로케일은 YYYY-MM-DD 형식을 제공
        const formattedDate = date.toLocaleDateString('sv-SE');

        // 참고 1 (API 응답) 및 more-details.js의 mockPost 구조 참고하여 HTML 생성
        postElement.innerHTML = `
          <div class="flex items-center text-xs text-gray-500 mb-1">
            <span>${formattedDate}</span>
            <span class="mx-1">•</span>
            <span class="font-semibold text-primary mr-2">[${post.categoryDisplayName || post.category}]</span>
          </div>
          <h3 class="font-semibold text-lg mb-2 truncate" title="${post.title}">${post.title}</h3>
          <p class="text-sm text-gray-700 mb-3 h-10 overflow-hidden text-ellipsis--custom line-clamp-2">${post.content}</p>
          <div class="flex items-center justify-between text-sm text-gray-500 mt-3 pt-3 border-t border-gray-100">
            <div class="flex items-center space-x-4">
              <div class="flex items-center" title="조회수">
                <i class="ri-eye-line mr-1"></i>
                <span>${post.viewCount}</span>
              </div>
              <div class="flex items-center" title="좋아요">
                <i class="ri-heart-line mr-1"></i>
                <span>${post.likeCount}</span>
              </div>
              <div class="flex items-center" title="댓글 수">
                <i class="ri-chat-1-line mr-1"></i>
                <span>${post.commentCount}</span>
              </div>
            </div>
            ${isMe ? `
            <div class="flex items-center gap-2">
              <button class="text-gray-500 hover:text-primary edit-post-btn" data-post-id="${post.postId}" title="게시글 수정">
                <i class="ri-edit-line text-lg"></i>
              </button>
              <button class="text-gray-500 hover:text-red-500 delete-post-btn" data-post-id="${post.postId}" title="게시글 삭제">
                <i class="ri-delete-bin-line text-lg"></i>
              </button>
            </div>
            ` : ''}
          </div>
        `;
        container.appendChild(postElement);
    });

    if (isMe) {
        setupMyPostActionButtons(); // 수정/삭제 버튼 이벤트 리스너 등록
    }
}

/**
 * 게시글 수정/삭제 버튼에 이벤트 리스너 설정
 */
function setupMyPostActionButtons() {
    document.querySelectorAll(".edit-post-btn").forEach(button => {
        button.addEventListener("click", function(e) {
            e.stopPropagation(); // 부모 요소의 클릭 이벤트(상세페이지 이동) 방지
            const postId = this.getAttribute("data-post-id");
            window.location.href = `/community/edit.html?id=${postId}`; // 게시글 수정 페이지로 이동
        });
    });

    document.querySelectorAll(".delete-post-btn").forEach(button => {
        button.addEventListener("click", async function(e) {
            e.stopPropagation(); // 부모 요소의 클릭 이벤트 방지
            const postId = this.getAttribute("data-post-id");
            if (confirm("이 게시글을 정말 삭제하시겠습니까?")) {
                await deleteMyPostApiCall(postId);
            }
        });
    });
}

/**
 * 게시글 삭제 API 호출
 * @param {string} postId - 삭제할 게시글 ID
 */
async function deleteMyPostApiCall(postId) {
    try {
        // 실제 API 엔드포인트 확인 필요
        const response = await fetch(`/api/v1/community/posts/${postId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });

        if (response.status === 401) {
            const refreshed = await window.handle401Error();
            if (refreshed) return await deleteMyPostApiCall(postId); // 재시도
            else window.location.href = "/login";
            return;
        }
        
        // 204 No Content 응답은 body가 없을 수 있음
        let result = {};
        if (response.status !== 204) {
            result = await response.json();
        }


        if (response.ok && (result.code === "SUCCESS" || response.status === 204 || response.status === 200)) {
            alert("게시글이 삭제되었습니다.");
            // 현재 페이지 정보로 게시글 목록 새로고침
            const urlParams = new URLSearchParams(window.location.search);
            const currentPage = parseInt(urlParams.get("page") || "0");
            const currentDisplayFilter = urlParams.get("filter") || "전체";
            const currentSearch = urlParams.get("search") || "";
            const nickname = sessionStorage.getItem("nickname");
            if (nickname) {
                loadMyPostsData(nickname, currentPage, mapDisplayFilterToApiStatus(currentDisplayFilter), currentSearch);
            }
        } else {
            alert(result.message || `게시글 삭제에 실패했습니다. (상태: ${response.status})`);
        }
    } catch (error) {
        console.error("게시글 삭제 API 호출 중 오류 발생:", error);
        alert("게시글 삭제 처리 중 오류가 발생했습니다.");
    }
}

/**
 * 페이지네이션 UI 생성 및 이벤트 설정
 * @param {HTMLElement} container - 페이지네이션을 표시할 HTML 요소
 * @param {object} pageInfo - 페이지 정보 객체 (number, totalPages, hasNext 등 포함)
 * @param {string} nickname - 사용자 닉네임
 * @param {string} apiStatusFilter - 현재 적용된 API status 필터 값
 * @param {string} searchQuery - 현재 검색어
 */
function setupMyPostsPagination(container, pageInfo, nickname, apiStatusFilter, searchQuery) {
    if (!container) return;
    container.innerHTML = ""; // 초기화

    const currentPage = pageInfo.number; // API 응답의 현재 페이지 (0부터 시작)
    const totalPages = pageInfo.totalPages;
    const hasNextPage = pageInfo.hasNext !== undefined ? pageInfo.hasNext : (pageInfo.last !== undefined ? !pageInfo.last : currentPage < totalPages - 1);

    if (!totalPages || totalPages <= 1) {
        return; // 페이지가 하나거나 없으면 페이지네이션 표시 안 함
    }

    let paginationHTML = '<nav class="inline-flex rounded-md shadow-sm">';

    // 이전 버튼
    paginationHTML += `<a href="#" class="px-3 py-2 border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 rounded-l-md ${currentPage === 0 ? 'opacity-50 cursor-not-allowed' : ''}" id="prev-myposts-page" aria-disabled="${currentPage === 0}">이전</a>`;

    // 페이지 번호 버튼 (최대 5개)
    const maxPageButtons = 5;
    let startPage = Math.max(0, currentPage - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxPageButtons);

    // 페이지 버튼 수가 maxPageButtons보다 적고, 전체 페이지 수가 더 많으면 startPage 조정
    if (endPage - startPage < maxPageButtons && totalPages > maxPageButtons) {
        startPage = Math.max(0, endPage - maxPageButtons);
    }
    if (totalPages < maxPageButtons) { // 전체 페이지 수가 최대 버튼 수보다 적으면 모든 페이지 표시
       startPage = 0;
       endPage = totalPages;
   }


    for (let i = startPage; i < endPage; i++) {
        paginationHTML += `<a href="#" class="px-3 py-2 border-t border-b border-gray-300 ${i === currentPage ? 'bg-primary text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}" data-page="${i}">${i + 1}</a>`;
    }

    // 다음 버튼
    paginationHTML += `<a href="#" class="px-3 py-2 border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 rounded-r-md ${!hasNextPage ? 'opacity-50 cursor-not-allowed' : ''}" id="next-myposts-page" aria-disabled="${!hasNextPage}">다음</a>`;
    paginationHTML += '</nav>';
    container.innerHTML = paginationHTML;

    // 이벤트 리스너 등록
    document.getElementById("prev-myposts-page")?.addEventListener("click", function(e) {
        e.preventDefault();
        if (currentPage > 0) {
            updateMyPostsPageUrl(currentPage - 1, mapApiStatusToDisplayFilter(apiStatusFilter), searchQuery);
            loadMyPostsData(nickname, currentPage - 1, apiStatusFilter, searchQuery);
        }
    });

    document.getElementById("next-myposts-page")?.addEventListener("click", function(e) {
        e.preventDefault();
        if (hasNextPage) {
            updateMyPostsPageUrl(currentPage + 1, mapApiStatusToDisplayFilter(apiStatusFilter), searchQuery);
            loadMyPostsData(nickname, currentPage + 1, apiStatusFilter, searchQuery);
        }
    });

    container.querySelectorAll("a[data-page]").forEach(button => {
        button.addEventListener("click", function(e) {
            e.preventDefault();
            const pageNumber = parseInt(this.getAttribute("data-page"));
            if (pageNumber !== currentPage) {
                updateMyPostsPageUrl(pageNumber, mapApiStatusToDisplayFilter(apiStatusFilter), searchQuery);
                loadMyPostsData(nickname, pageNumber, apiStatusFilter, searchQuery);
            }
        });
    });
}

/**
 * "내가 작성한 게시글" 페이지 전용 오류 메시지 표시 함수
 * @param {string} message - 표시할 오류 메시지
 * @param {string} [containerId="content-list"] - 메시지를 표시할 HTML 요소의 ID
 */
function showMyPostsErrorMessage(message, containerId = "content-list") {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Error container '${containerId}' not found for message: ${message}`);
        return;
    }
    container.innerHTML = `
    <div class="text-center py-10">
      <div class="w-16 h-16 mx-auto mb-4 text-red-500">
        <i class="ri-error-warning-line text-5xl"></i>
      </div>
      <p class="text-lg font-medium text-gray-700 mb-2">${message}</p>
      <p class="text-gray-500 text-sm">문제가 지속되면 관리자에게 문의해주세요.</p>
      <button onclick="window.location.reload()" class="mt-6 px-5 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 transition">
        페이지 새로고침
      </button>
    </div>`;
}
