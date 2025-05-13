/**
 * 마이페이지 - 내가 작성한 댓글 더보기 페이지 구현
 * URL: /more-details.html?type=my-comments
 *
 * 사용자가 작성한 모든 댓글을 보여주는 상세 페이지입니다.
 * 세션스토리지에서 닉네임을 가져와 API를 호출합니다.
 */

document.addEventListener("DOMContentLoaded", async function () {
    // 페이지 로딩 시 URL에서 타입 파라미터 확인
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get("type");
    const currentPage = parseInt(urlParams.get("page") || "0"); // URL에서 페이지 번호 가져오기

    // 세션스토리지에서 닉네임 가져오기
    const nickname = sessionStorage.getItem("nickname");
    if (!nickname) {
        showErrorMessage("사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.");
        return;
    }

    // 페이지 타이틀 및 필터 초기화
    if (type === "my-comments") {
        initCommentsPage(nickname, currentPage);
    }
});

/**
 * 댓글 페이지 초기화
 * @param {string} nickname - 사용자 닉네임
 * @param {number} page - 현재 페이지 번호
 */
async function initCommentsPage(nickname, page = 0) {
    // 페이지 타이틀 설정
    const pageTitle = document.getElementById("page-title");
    if (pageTitle) {
        pageTitle.textContent = "작성한 댓글";
    }

    // 필터 설정
    setupFilters(["전체", "최신순"], page);

    // 검색 기능 설정
    setupSearchFunction(nickname, page);

    // 댓글 데이터 로드
    await loadComments(nickname, page);
}

/**
 * 필터 버튼 설정
 * @param {Array} filters - 필터 텍스트 배열
 * @param {number} currentPage - 현재 페이지 번호
 */
function setupFilters(filters, currentPage) {
    const filterContainer = document.querySelector("#filter-section .flex.space-x-2");
    if (!filterContainer) return;

    filterContainer.innerHTML = ""; // 기존 필터 제거

    // URL에서 현재 필터 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const currentFilter = urlParams.get("filter") || "전체";

    filters.forEach((filter) => {
        const button = document.createElement("button");
        button.textContent = filter;
        button.className = filter === currentFilter
            ? "px-4 py-2 bg-primary text-white rounded-full whitespace-nowrap"
            : "px-4 py-2 bg-gray-100 text-gray-700 rounded-full whitespace-nowrap hover:bg-gray-200";

        button.addEventListener("click", () => {
            // 모든 버튼에서 active 클래스 제거
            filterContainer.querySelectorAll("button").forEach((btn) => {
                btn.className = "px-4 py-2 bg-gray-100 text-gray-700 rounded-full whitespace-nowrap hover:bg-gray-200";
            });

            // 클릭한 버튼에 active 클래스 추가
            button.className = "px-4 py-2 bg-primary text-white rounded-full whitespace-nowrap";

            // 필터링 적용 및 페이지 리셋 (0페이지부터 시작)
            const nickname = sessionStorage.getItem("nickname");
            if (nickname) {
                const filterValue = filter === "전체" ? "" : filter;

                // URL 업데이트
                updatePageUrl(0, filterValue);

                // 댓글 로드
                loadComments(nickname, 0, filterValue);
            }
        });

        filterContainer.appendChild(button);
    });
}

/**
 * 검색 기능 설정
 * @param {string} nickname - 사용자 닉네임
 * @param {number} currentPage - 현재 페이지 번호
 */
function setupSearchFunction(nickname, currentPage) {
    const searchInput = document.getElementById("search-input");
    if (!searchInput) return;

    // URL에서 현재 검색어 가져와서 인풋에 설정
    const urlParams = new URLSearchParams(window.location.search);
    const currentSearch = urlParams.get("search") || "";
    searchInput.value = currentSearch;

    // 디바운싱 적용한 검색 기능
    let debounceTimer;
    searchInput.addEventListener("input", function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            // URL 업데이트 (검색 시 페이지는 0으로 리셋)
            updatePageUrl(0, null, this.value);

            // 댓글 로드
            loadComments(nickname, 0, null, this.value);
        }, 500); // 500ms 디바운스
    });
}

/**
 * URL 파라미터 업데이트
 * @param {number} page - 페이지 번호
 * @param {string} filter - 필터
 * @param {string} search - 검색어
 */
function updatePageUrl(page, filter, search) {
    const urlParams = new URLSearchParams(window.location.search);

    // 타입은 유지
    const type = urlParams.get("type");

    // 새 URL 파라미터 생성
    const newParams = new URLSearchParams();
    newParams.set("type", type);
    newParams.set("page", page.toString());

    // 필터가 존재하면 추가 (null이면 기존 값 유지)
    if (filter !== null) {
        if (filter) {
            newParams.set("filter", filter);
        } else {
            newParams.delete("filter");
        }
    } else {
        const currentFilter = urlParams.get("filter");
        if (currentFilter) {
            newParams.set("filter", currentFilter);
        }
    }

    // 검색어가 존재하면 추가 (null이면 기존 값 유지)
    if (search !== null) {
        if (search) {
            newParams.set("search", search);
        } else {
            newParams.delete("search");
        }
    } else {
        const currentSearch = urlParams.get("search");
        if (currentSearch) {
            newParams.set("search", currentSearch);
        }
    }

    // URL 업데이트 (페이지 새로고침 없이)
    const newUrl = `${window.location.pathname}?${newParams.toString()}`;
    window.history.pushState({ path: newUrl }, "", newUrl);
}

/**
 * 댓글 데이터 로드
 * @param {string} nickname - 사용자 닉네임
 * @param {number} page - 페이지 번호
 * @param {string} filter - 필터 (최신순)
 * @param {string} searchQuery - 검색어
 */
async function loadComments(nickname, page = 0, filter = null, searchQuery = null) {
    const contentList = document.getElementById("content-list");
    const paginationContainer = document.querySelector(".flex.justify-center.mt-6");

    if (!contentList) return;

    // URL에서 현재 필터 및 검색어 가져오기 (null이면 URL에서 유지)
    if (filter === null) {
        const urlParams = new URLSearchParams(window.location.search);
        filter = urlParams.get("filter") || "";
    }

    if (searchQuery === null) {
        const urlParams = new URLSearchParams(window.location.search);
        searchQuery = urlParams.get("search") || "";
    }

    // 로딩 표시
    contentList.innerHTML = `
    <div class="flex justify-center items-center py-20">
      <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
    </div>
  `;

    try {
        // 한 페이지에 5개만 보이도록 수정
        const size = 5; // 페이지당 항목 수를 5로 변경

        // 실제 API 엔드포인트 URL 구성
        let apiUrl = `/api/v1/users/${nickname}/activity/more-details?type=my-comments&page=${page}&size=${size}`;

        // 필터와 검색어 추가
        if (filter) {
            apiUrl += `&filter=${encodeURIComponent(filter)}`;
        }

        if (searchQuery) {
            apiUrl += `&search=${encodeURIComponent(searchQuery)}`;
        }

        // API 호출
        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });

        // 401 응답 처리 (인증 만료)
        if (response.status === 401) {
            // 토큰 갱신 로직
            const refreshResult = await refreshToken();
            if (refreshResult) {
                // 토큰 갱신 성공 - 다시 시도
                return await loadComments(nickname, page, filter, searchQuery);
            } else {
                // 토큰 갱신 실패 - 로그인 페이지로 이동
                window.location.href = "/login";
                return;
            }
        }

        // 기타 오류 응답 처리
        if (!response.ok) {
            throw new Error(`API 요청 실패: ${response.status}`);
        }

        // 데이터 파싱
        const result = await response.json();

        // API 응답 성공 여부 확인
        if (result.status === 200 || result.code === "SUCCESS") {
            // 실제 댓글 데이터 추출 (API 응답 구조에 맞게 조정)
            const commentsData = result.data.content || [];
            const isMe = result.data.me || false;
            const hasNextPage = result.data.hasNext || false;
            const totalPages = result.data.totalPages || 10; // API에서 제공하지 않으면 임의로 10페이지로 가정

            // 댓글 표시
            displayComments(commentsData, contentList, isMe);

            // 페이지네이션 설정 (총 페이지 수 추가)
            setupPagination(paginationContainer, page, hasNextPage, totalPages, nickname, filter, searchQuery);
        } else {
            // API 응답이 실패인 경우
            showErrorMessage(result.message || "댓글을 불러오는데 실패했습니다.");
        }
    } catch (error) {
        console.error("댓글 로드 중 오류 발생:", error);

        // 개발 중에는 모의 데이터로 테스트
        console.log("개발 중 모의 데이터로 대체합니다. 현재 페이지:", page);

        // 페이지별로 다른 모의 데이터 생성 (최대 5개 페이지)
        const mockData = getMockCommentsByPage(page);
        displayComments(mockData, contentList, true);

        // 모의 데이터용 페이지네이션 설정 (총 5페이지로 가정)
        const totalPages = 5;
        const hasNextPage = page < totalPages - 1;
        setupPagination(paginationContainer, page, hasNextPage, totalPages, nickname, filter, searchQuery);
    }
}

/**
 * 페이지별 모의 댓글 데이터 생성 (개발용)
 * @param {number} page - 페이지 번호
 * @returns {Array} 댓글 데이터 배열
 */
function getMockCommentsByPage(page) {
    // 페이지별로 다른 모의 데이터 생성
    const allMockComments = [
        // 페이지 0의 데이터
        [
            {
                postId: "post123",
                category: "QUESTION",
                categoryDisplayName: "질문/답변",
                createdAt: new Date().toISOString(),
                postTitle: "비전공자를 위한 프로그래밍 학습 로드맵",
                commentContent: "정말 유용한 정보 감사합니다! 저도 비전공자로 시작했는데, 이런 로드맵이 있었다면 좋았을 것 같아요.",
                postUrl: "/community/detail/post123"
            },
            {
                postId: "post456",
                category: "FREE",
                categoryDisplayName: "자유게시판",
                createdAt: new Date(Date.now() - 86400000).toISOString(), // 하루 전
                postTitle: "요가 초보자를 위한 추천 동작이 있을까요?",
                commentContent: "초보자라면 마운틴 포즈, 다운독, 차일드 포즈 등의 기본 동작부터 시작하는 것이 좋습니다. 유연성보다는 호흡과 균형에 집중하세요.",
                postUrl: "/community/detail/post456"
            },
            {
                postId: "post789",
                category: "INFO",
                categoryDisplayName: "정보공유",
                createdAt: new Date(Date.now() - 172800000).toISOString(), // 이틀 전
                postTitle: "프론트엔드 개발자 로드맵 2025",
                commentContent: "HTML, CSS, JavaScript 기초부터 차근차근 배우는 것이 중요합니다. 기초가 탄탄해야 프레임워크를 배울 때도 수월합니다.",
                postUrl: "/community/detail/post789"
            },
            {
                postId: "post101",
                category: "FREE",
                categoryDisplayName: "자유게시판",
                createdAt: new Date(Date.now() - 259200000).toISOString(), // 3일 전
                postTitle: "대스타를 향한 빠른 게시글",
                commentContent: "정말 좋은 내용이네요. 개발자로서 매우 유익한 글이었습니다.",
                postUrl: "/community/detail/post101"
            },
            {
                postId: "post102",
                category: "INFO",
                categoryDisplayName: "정보공유",
                createdAt: new Date(Date.now() - 345600000).toISOString(), // 4일 전
                postTitle: "이미지가 깨지지 않게!",
                commentContent: "다른 게시물 댓글 테스트. 아주 좋은 팁이었습니다. 감사합니다!",
                postUrl: "/community/detail/post102"
            }
        ],
        // 페이지 1의 데이터
        [
            {
                postId: "post201",
                category: "QUESTION",
                categoryDisplayName: "질문/답변",
                createdAt: new Date(Date.now() - 432000000).toISOString(), // 5일 전
                postTitle: "스프링 부트 입문하기",
                commentContent: "스프링 부트는 정말 좋은 프레임워크입니다. 입문자에게 추천해요.",
                postUrl: "/community/detail/post201"
            },
            {
                postId: "post202",
                category: "INFO",
                categoryDisplayName: "정보공유",
                createdAt: new Date(Date.now() - 518400000).toISOString(), // 6일 전
                postTitle: "React의 Virtual DOM 이해하기",
                commentContent: "Virtual DOM의 개념을 잘 설명해주셔서 감사합니다. 이제 이해가 됩니다.",
                postUrl: "/community/detail/post202"
            },
            {
                postId: "post203",
                category: "FREE",
                categoryDisplayName: "자유게시판",
                createdAt: new Date(Date.now() - 604800000).toISOString(), // 7일 전
                postTitle: "개발자의 건강 관리법",
                commentContent: "장시간 앉아있는 개발자에게 꼭 필요한 정보네요. 저도 실천해보겠습니다.",
                postUrl: "/community/detail/post203"
            },
            {
                postId: "post204",
                category: "QUESTION",
                categoryDisplayName: "질문/답변",
                createdAt: new Date(Date.now() - 691200000).toISOString(), // 8일 전
                postTitle: "TypeScript vs JavaScript",
                commentContent: "TypeScript를 배우면 코드 품질이 확실히 올라가는 것 같아요. 타입 체크가 정말 유용합니다.",
                postUrl: "/community/detail/post204"
            },
            {
                postId: "post205",
                category: "INFO",
                categoryDisplayName: "정보공유",
                createdAt: new Date(Date.now() - 777600000).toISOString(), // 9일 전
                postTitle: "Git 브랜치 전략",
                commentContent: "Git-flow 전략을 실무에서 사용해봤는데 정말 효과적이었습니다. 추천합니다.",
                postUrl: "/community/detail/post205"
            }
        ],
        // 페이지 2의 데이터
        [
            {
                postId: "post301",
                category: "QUESTION",
                categoryDisplayName: "질문/답변",
                createdAt: new Date(Date.now() - 864000000).toISOString(), // 10일 전
                postTitle: "Docker 컨테이너 관리 팁",
                commentContent: "Docker Compose를 활용하면 복잡한 환경도 쉽게 관리할 수 있어요. 좋은 글 감사합니다.",
                postUrl: "/community/detail/post301"
            },
            {
                postId: "post302",
                category: "INFO",
                categoryDisplayName: "정보공유",
                createdAt: new Date(Date.now() - 950400000).toISOString(), // 11일 전
                postTitle: "GraphQL 도입 이야기",
                commentContent: "저희 팀도 GraphQL로 전환 중인데, 이 글이 많은 도움이 되었습니다.",
                postUrl: "/community/detail/post302"
            },
            {
                postId: "post303",
                category: "FREE",
                categoryDisplayName: "자유게시판",
                createdAt: new Date(Date.now() - 1036800000).toISOString(), // 12일 전
                postTitle: "개발자 블로그 추천",
                commentContent: "추천해주신 블로그 모두 구독했습니다. 양질의 정보 감사합니다!",
                postUrl: "/community/detail/post303"
            },
            {
                postId: "post304",
                category: "QUESTION",
                categoryDisplayName: "질문/답변",
                createdAt: new Date(Date.now() - 1123200000).toISOString(), // 13일 전
                postTitle: "CI/CD 파이프라인 구축하기",
                commentContent: "Jenkins보다 GitHub Actions가 더 편리한 것 같아요. 설정이 간단하고 직관적입니다.",
                postUrl: "/community/detail/post304"
            },
            {
                postId: "post305",
                category: "INFO",
                categoryDisplayName: "정보공유",
                createdAt: new Date(Date.now() - 1209600000).toISOString(), // 14일 전
                postTitle: "웹 성능 최적화 기법",
                commentContent: "이미지 레이지 로딩이 정말 효과적이더라고요. 페이지 로딩 속도가 크게 개선되었습니다.",
                postUrl: "/community/detail/post305"
            }
        ],
        // 페이지 3의 데이터
        [
            {
                postId: "post401",
                category: "QUESTION",
                categoryDisplayName: "질문/답변",
                createdAt: new Date(Date.now() - 1296000000).toISOString(), // 15일 전
                postTitle: "Node.js vs Deno",
                commentContent: "Deno의 보안 기능은 정말 매력적이지만, 아직은 Node.js의 생태계가 더 풍부한 것 같습니다.",
                postUrl: "/community/detail/post401"
            },
            {
                postId: "post402",
                category: "INFO",
                categoryDisplayName: "정보공유",
                createdAt: new Date(Date.now() - 1382400000).toISOString(), // 16일 전
                postTitle: "CloudFlare Workers 활용하기",
                commentContent: "엣지 컴퓨팅의 미래를 보는 것 같습니다. 정말 혁신적인 기술이네요.",
                postUrl: "/community/detail/post402"
            },
            {
                postId: "post403",
                category: "FREE",
                categoryDisplayName: "자유게시판",
                createdAt: new Date(Date.now() - 1468800000).toISOString(), // 17일 전
                postTitle: "개발자 번아웃 극복기",
                commentContent: "저도 비슷한 경험이 있었는데, 공감되는 내용이 많네요. 좋은 글 감사합니다.",
                postUrl: "/community/detail/post403"
            },
            {
                postId: "post404",
                category: "QUESTION",
                categoryDisplayName: "질문/답변",
                createdAt: new Date(Date.now() - 1555200000).toISOString(), // 18일 전
                postTitle: "Kubernetes 입문하기",
                commentContent: "쿠버네티스 어렵지만 정말 강력한 도구인 것 같아요. 이 글 덕분에 용기가 생겼습니다.",
                postUrl: "/community/detail/post404"
            },
            {
                postId: "post405",
                category: "INFO",
                categoryDisplayName: "정보공유",
                createdAt: new Date(Date.now() - 1641600000).toISOString(), // 19일 전
                postTitle: "WebAssembly 활용 사례",
                commentContent: "웹어셈블리가 웹 성능에 혁명을 가져올 것 같습니다. 정말 흥미로운 기술이네요.",
                postUrl: "/community/detail/post405"
            }
        ],
        // 페이지 4의 데이터
        [
            {
                postId: "post501",
                category: "QUESTION",
                categoryDisplayName: "질문/답변",
                createdAt: new Date(Date.now() - 1728000000).toISOString(), // 20일 전
                postTitle: "Svelte 프레임워크 사용기",
                commentContent: "Svelte는 정말 혁신적인 접근 방식을 가진 프레임워크인 것 같아요. 배워볼 가치가 있습니다.",
                postUrl: "/community/detail/post501"
            },
            {
                postId: "post502",
                category: "INFO",
                categoryDisplayName: "정보공유",
                createdAt: new Date(Date.now() - 1814400000).toISOString(), // 21일 전
                postTitle: "Rust로 웹 백엔드 개발하기",
                commentContent: "Rust의 안전성과 성능은 정말 매력적입니다. 백엔드에 도입하면 좋을 것 같아요.",
                postUrl: "/community/detail/post502"
            },
            {
                postId: "post503",
                category: "FREE",
                categoryDisplayName: "자유게시판",
                createdAt: new Date(Date.now() - 1900800000).toISOString(), // 22일 전
                postTitle: "개발자 커리어 고민",
                commentContent: "저도 비슷한 고민을 했었는데, 이 글을 읽고 많은 도움이 되었습니다. 감사합니다.",
                postUrl: "/community/detail/post503"
            },
            {
                postId: "post504",
                category: "QUESTION",
                categoryDisplayName: "질문/답변",
                createdAt: new Date(Date.now() - 1987200000).toISOString(), // 23일 전
                postTitle: "MongoDB vs PostgreSQL",
                commentContent: "각 데이터베이스의 장단점을 잘 설명해주셔서 감사합니다. 프로젝트 특성에 맞게 선택하는 것이 중요하겠네요.",
                postUrl: "/community/detail/post504"
            },
            {
                postId: "post505",
                category: "INFO",
                categoryDisplayName: "정보공유",
                createdAt: new Date(Date.now() - 2073600000).toISOString(), // 24일 전
                postTitle: "AWS Lambda 비용 최적화 팁",
                commentContent: "서버리스 아키텍처의 비용 관리는 정말 중요한 부분인데, 실용적인 팁 감사합니다.",
                postUrl: "/community/detail/post505"
            }
        ]
    ];

    // 요청한 페이지가 데이터 범위를 벗어나면 빈 배열 반환
    if (page >= allMockComments.length) {
        return [];
    }

    return allMockComments[page];
}

/**
 * 댓글 목록 화면에 표시
 * @param {Array} comments - 댓글 데이터 배열
 * @param {HTMLElement} container - 표시할 컨테이너
 * @param {boolean} isMe - 본인 작성 댓글인지 여부
 */
function displayComments(comments, container, isMe) {
    if (!container) return;

    // 데이터가 없는 경우
    if (!comments || comments.length === 0) {
        container.innerHTML = `
      <div class="text-center py-10">
        <div class="text-gray-500 mb-2">작성한 댓글이 없습니다.</div>
        <a href="/community" class="text-primary hover:underline">커뮤니티에서 활동해보세요</a>
      </div>
    `;
        return;
    }

    // 댓글 목록 생성
    container.innerHTML = "";

    comments.forEach(comment => {
        const commentElement = document.createElement("div");
        commentElement.className = "border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer";

        // 클릭 이벤트 추가 - 게시글로 이동
        commentElement.addEventListener('click', function(e) {
            // 편집/삭제 버튼 클릭 시 이벤트 전파 중단 (버튼 자체의 기능만 수행)
            if (e.target.closest('.edit-comment-btn, .delete-comment-btn')) {
                return;
            }

            // 게시글 URL로 이동
            const postUrl = comment.postUrl || `/community/detail/${comment.postId}`;
            window.location.href = postUrl;
        });

        // 날짜 포맷팅
        const date = new Date(comment.createdAt);
        const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        commentElement.innerHTML = `
      <div class="flex items-center text-xs text-gray-500 mb-1">
        <span class="font-medium text-primary mr-2">[${comment.categoryDisplayName || comment.category}]</span>
        <span>${formattedDate}</span>
        <span class="mx-1">•</span>
        <span>댓글</span>
      </div>
      <h3 class="text-sm font-medium mb-2 hover:text-primary">
        "${comment.postTitle}" 게시글에 댓글
      </h3>
      <p class="text-sm text-gray-600 mb-3">${comment.commentContent}</p>
      ${isMe ? `
        <div class="flex justify-end">
          <div class="flex items-center gap-2">
            <button class="text-gray-500 hover:text-primary edit-comment-btn" data-id="${comment.postId}" data-comment-id="${comment.id || ''}">
              <i class="ri-edit-line"></i>
            </button>
            <button class="text-gray-500 hover:text-red-500 delete-comment-btn" data-id="${comment.postId}" data-comment-id="${comment.id || ''}">
              <i class="ri-delete-bin-line"></i>
            </button>
          </div>
        </div>
      ` : ''}
    `;

        container.appendChild(commentElement);
    });

    // 본인 댓글인 경우 수정/삭제 버튼 이벤트 등록
    if (isMe) {
        setupCommentButtons();
    }
}

/**
 * 댓글 수정/삭제 버튼 이벤트 설정
 */
function setupCommentButtons() {
    // 수정 버튼
    document.querySelectorAll(".edit-comment-btn").forEach(button => {
        button.addEventListener("click", function(e) {
            e.stopPropagation(); // 이벤트 전파 중단 (부모 요소 클릭 방지)
            const postId = this.getAttribute("data-id");
            const commentId = this.getAttribute("data-comment-id");
            editComment(postId, commentId);
        });
    });

    // 삭제 버튼
    document.querySelectorAll(".delete-comment-btn").forEach(button => {
        button.addEventListener("click", function(e) {
            e.stopPropagation(); // 이벤트 전파 중단 (부모 요소 클릭 방지)
            const postId = this.getAttribute("data-id");
            const commentId = this.getAttribute("data-comment-id");
            deleteComment(postId, commentId);
        });
    });
}

/**
 * 페이지네이션 설정 - 여러 페이지 번호 표시 추가
 * @param {HTMLElement} container - 페이지네이션 컨테이너
 * @param {number} currentPage - 현재 페이지
 * @param {boolean} hasNextPage - 다음 페이지 존재 여부
 * @param {number} totalPages - 총 페이지 수
 * @param {string} nickname - 사용자 닉네임
 * @param {string} filter - 현재 적용된 필터
 * @param {string} searchQuery - 검색어
 */
function setupPagination(container, currentPage, hasNextPage, totalPages, nickname, filter, searchQuery) {
    if (!container) return;

    // 페이지네이션 HTML 생성
    let paginationHTML = '<nav class="inline-flex rounded-md shadow-sm">';

    // 이전 페이지 버튼
    paginationHTML += `
    <a href="#" class="px-3 py-2 border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 rounded-l-md ${currentPage === 0 ? 'opacity-50 cursor-not-allowed' : ''}" id="prev-page">이전</a>
  `;

    // 페이지 번호 버튼 (최대 5개)
    const startPage = Math.max(0, Math.min(currentPage - 2, totalPages - 5));
    const endPage = Math.min(startPage + 5, totalPages);

    for (let i = startPage; i < endPage; i++) {
        paginationHTML += `
      <a href="#" class="px-3 py-2 border-t border-b border-gray-300 ${i === currentPage ? 'bg-primary text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}" data-page="${i}">${i + 1}</a>
    `;
    }

    // 다음 페이지 버튼
    paginationHTML += `
    <a href="#" class="px-3 py-2 border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 rounded-r-md ${!hasNextPage ? 'opacity-50 cursor-not-allowed' : ''}" id="next-page">다음</a>
  `;

    paginationHTML += '</nav>';

    container.innerHTML = paginationHTML;

    // 이전 페이지 버튼 이벤트
    const prevButton = document.getElementById("prev-page");
    if (prevButton) {
        if (currentPage > 0) {
            prevButton.addEventListener("click", function(e) {
                e.preventDefault();
                const prevPage = currentPage - 1;

                // URL 업데이트
                updatePageUrl(prevPage, filter, searchQuery);

                // 댓글 로드
                loadComments(nickname, prevPage, filter, searchQuery);
            });
        } else {
            prevButton.addEventListener("click", function(e) {
                e.preventDefault();
            });
        }
    }

    // 페이지 번호 버튼 이벤트
    document.querySelectorAll("[data-page]").forEach(button => {
        button.addEventListener("click", function(e) {
            e.preventDefault();
            const pageNumber = parseInt(this.getAttribute("data-page"));

            // 현재 페이지와 같으면 아무 동작 안함
            if (pageNumber === currentPage) return;

            // URL 업데이트
            updatePageUrl(pageNumber, filter, searchQuery);

            // 댓글 로드
            loadComments(nickname, pageNumber, filter, searchQuery);
        });
    });

    // 다음 페이지 버튼 이벤트
    const nextButton = document.getElementById("next-page");
    if (nextButton) {
        if (hasNextPage) {
            nextButton.addEventListener("click", function(e) {
                e.preventDefault();
                const nextPage = currentPage + 1;

                // URL 업데이트
                updatePageUrl(nextPage, filter, searchQuery);

                // 댓글 로드
                loadComments(nickname, nextPage, filter, searchQuery);
            });
        } else {
            nextButton.addEventListener("click", function(e) {
                e.preventDefault();
            });
        }
    }
}

/**
 * 댓글 수정 함수
 * @param {string} postId - 게시글 ID
 * @param {string} commentId - 댓글 ID
 */
function editComment(postId, commentId) {
    console.log(`댓글 수정: postId=${postId}, commentId=${commentId}`);

    // 실제 구현 시에는 모달 창을 열거나 수정 페이지로 이동
    alert("해당 댓글 수정 기능은 아직 구현 중입니다.");
}

/**
 * 댓글 삭제 함수
 * @param {string} postId - 게시글 ID
 * @param {string} commentId - 댓글 ID
 */
async function deleteComment(postId, commentId) {
    console.log(`댓글 삭제: postId=${postId}, commentId=${commentId}`);

    if (confirm("이 댓글을 정말 삭제하시겠습니까?")) {
        try {
            // API 호출
            const response = await fetch(`/api/v1/community/comments/${postId}/${commentId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            });

            // 401 응답 처리 (인증 만료)
            if (response.status === 401) {
                // 토큰 갱신 로직
                const refreshResult = await refreshToken();
                if (refreshResult) {
                    // 토큰 갱신 성공 - 다시 시도
                    return await deleteComment(postId, commentId);
                } else {
                    // 토큰 갱신 실패 - 로그인 페이지로 이동
                    window.location.href = "/login";
                    return;
                }
            }

            // 기타 오류 응답 처리
            if (!response.ok) {
                throw new Error(`API 요청 실패: ${response.status}`);
            }

            // 응답 파싱
            const result = await response.json();

            // 삭제 성공
            if (result.status === 200 || result.status === 204 || result.code === "SUCCESS") {
                alert("댓글이 삭제되었습니다.");

                // 현재 페이지 다시 로드
                const urlParams = new URLSearchParams(window.location.search);
                const currentPage = parseInt(urlParams.get("page") || "0");
                const currentFilter = urlParams.get("filter") || "";
                const currentSearch = urlParams.get("search") || "";

                const nickname = sessionStorage.getItem("nickname");
                if (nickname) {
                    loadComments(nickname, currentPage, currentFilter, currentSearch);
                }
            } else {
                // 삭제 실패
                alert(result.message || "댓글 삭제에 실패했습니다.");
            }
        } catch (error) {
            console.error("댓글 삭제 중 오류 발생:", error);
            alert("댓글 삭제 중 오류가 발생했습니다.");
        }
    }
}

/**
 * 토큰 갱신 함수
 * @returns {Promise<boolean>} 갱신 성공 여부
 */
async function refreshToken() {
    try {
        const response = await fetch("/api/v1/auth/refresh", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });

        if (!response.ok) {
            return false;
        }

        return true;
    } catch (error) {
        console.error("토큰 갱신 중 오류 발생:", error);
        return false;
    }
}

/**
 * 오류 메시지 표시
 * @param {string} message - 표시할 메시지
 */
function showErrorMessage(message) {
    const contentList = document.getElementById("content-list");
    if (!contentList) return;

    contentList.innerHTML = `
    <div class="text-center py-10">
      <div class="w-16 h-16 mx-auto mb-4 text-red-500">
        <i class="ri-error-warning-line text-4xl"></i>
      </div>
      <p class="text-lg font-medium text-gray-800">${message}</p>
      <p class="text-gray-600 mt-2">페이지를 새로고침하거나 다시 로그인해보세요.</p>
      <button onclick="window.location.reload()" class="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-600">
        새로고침
      </button>
    </div>
  `;
}