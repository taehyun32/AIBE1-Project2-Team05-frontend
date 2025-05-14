// js/my-talents.js

/**
 * "내가 등록한 재능" 페이지 초기화 함수
 * @param {string} nickname - 현재 로그인한 사용자 닉네임
 * @param {object} elements - 공통 DOM 요소 객체
 */
async function initializeMyTalentsView(nickname, elements) {
  const {
    pageTitleElement,
    filterSectionElement, // 등록한 재능은 필터 사용 안함 (필요시 추가)
    contentListElement,
    searchSectionElement, // 등록한 재능은 검색 사용 안함 (필요시 추가)
    paginationContainerElement
  } = elements;

  if (pageTitleElement) pageTitleElement.textContent = '내가 등록한 재능';
  if (filterSectionElement) filterSectionElement.innerHTML = ''; // 필터 섹션 비우기
  if (searchSectionElement) searchSectionElement.style.display = 'none'; // 검색 섹션 숨기기

  const urlParams = new URLSearchParams(window.location.search);
  let currentPage = parseInt(urlParams.get('page') || '0');

  // 데이터 로드 및 화면 표시
  async function loadAndRenderData(page = 0) {
    displayMessage(
      contentListElement,
      '등록한 재능 목록을 불러오는 중...',
      'loading'
    );
    if (paginationContainerElement) paginationContainerElement.innerHTML = '';

    const itemsPerPage = 10; // 페이지당 항목 수

    try {
      const apiUrl = `/api/v1/users/${nickname}/activity/more-details?type=my-talents&page=${page}&size=${itemsPerPage}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      });

      if (response.status === 401) {
        return window.handle401Error(() => loadAndRenderData(page));
      }

      const result = await response.json();

      if (!response.ok || (result.code && result.code !== 'SUCCESS')) {
        const errorMsg = result.message || `API 요청 실패: ${response.status}`;
        throw new Error(errorMsg);
      }

      const talentsData =
        result.data && result.data.content ? result.data.content : [];
      // const isMe = result.data && result.data.me; // 필요시 사용 (내가 등록한 재능이므로 항상 true)

      // 페이지 정보 처리 (API 응답에 페이지 정보가 없으므로 추론)
      let pageInfo;
      const itemsOnPage = talentsData.length;
      // 요청한 수보다 적게 왔거나, 현재 페이지가 0보다 큰데 아이템이 없으면 마지막 페이지로 간주
      const isLastPage =
        itemsOnPage < itemsPerPage || (itemsOnPage === 0 && page > 0);

      let calculatedTotalPages;
      if (itemsOnPage === 0 && page === 0) {
        // 첫 페이지인데 데이터 없음
        calculatedTotalPages = 1; // 최소 1페이지
      } else if (isLastPage) {
        calculatedTotalPages = page + 1;
      } else {
        calculatedTotalPages = page + 2; // 다음 페이지가 더 있다고 가정
      }

      pageInfo = {
        number: page,
        totalPages: calculatedTotalPages,
        isFirst: page === 0,
        isLast:
          isLastPage ||
          (page + 1 === calculatedTotalPages && calculatedTotalPages === 1)
      };
      // 첫 페이지에 데이터가 전혀 없으면, isLast는 true여야 함
      if (itemsOnPage === 0 && page === 0) pageInfo.isLast = true;

      currentPage = pageInfo.number;

      renderTalentsList(talentsData);

      if (pageInfo.totalPages > 1 && paginationContainerElement) {
        setupCommonPagination(
          paginationContainerElement,
          pageInfo,
          (newPage) => {
            updateUrlAndReloadData(newPage);
          }
        );
      }
    } catch (error) {
      console.error('등록한 재능 로드 중 오류 발생:', error);
      displayMessage(
        contentListElement,
        error.message || '등록한 재능 목록을 불러오는 중 오류가 발생했습니다.',
        'error'
      );
    }
  }

  // 등록한 재능 목록 렌더링
  function renderTalentsList(talents) {
    if (!contentListElement) return;

    if (!talents || talents.length === 0) {
      displayMessage(contentListElement, '등록한 재능이 없습니다.', 'no-data');
      const addTalentButtonHtml = `
        <div class="text-center mt-6">
          <a href="/talent/registration" class="inline-block px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium">
            <i class="ri-add-circle-line mr-1.5"></i> 새로운 재능 등록하기
          </a>
        </div>`;
      // 기존 메시지 위에 버튼 추가 시 += 사용, 아니면 기존 메시지 지우고 innerHTML
      if (
        contentListElement.querySelector('.flex.items-center.justify-center')
      ) {
        // displayMessage로 내용이 있다면
        contentListElement.innerHTML += addTalentButtonHtml;
      } else {
        contentListElement.innerHTML = addTalentButtonHtml; // 기존 내용이 없다면 바로 버튼 추가
      }
      return;
    }

    contentListElement.innerHTML = ''; // 이전 목록 비우기
    const listFragment = document.createDocumentFragment();
    talents.forEach((talent) => {
      // API 응답 구조: {postId, createdAt, title, tags(List), content}
      // postId가 실제로는 talentId일 수 있음.
      const talentId = talent.postId || talent.id || talent.talentId; // 가능한 ID 필드명 사용

      const talentCard = document.createElement('div');
      talentCard.className =
        'border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition mb-4 bg-white dark:bg-gray-800';

      // 각 재능 카드 클릭 시 상세 페이지로 이동하거나 수정/삭제 모달을 띄울 수 있음.
      // 예: if (talentId) talentCard.addEventListener('click', () => window.location.href = `/talents/${talentId}`);

      const tagsHtml = (talent.tags || [])
        .map(
          (tag) =>
            `<span class="inline-block bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full mr-1.5 mb-1.5">${tag}</span>`
        )
        .join('');

      talentCard.innerHTML = `
        <div class="flex flex-col sm:flex-row justify-between items-start mb-2">
          <h3 class="font-semibold text-lg text-gray-900 dark:text-white mb-1 sm:mb-0 truncate w-full sm:w-auto" title="${
            talent.title || '제목 없음'
          }">
            ${talent.title || '제목 없음'}
          </h3>
          <span class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">${
            talent.createdAt ? formatDate(talent.createdAt) : '날짜 미상'
          }</span>
        </div>
        ${
          tagsHtml
            ? `<div class="mb-3 flex flex-wrap">${tagsHtml}</div>`
            : '<div class="mb-3"><span class="text-xs text-gray-400 dark:text-gray-500">태그 없음</span></div>'
        }
        <p class="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 leading-relaxed">${
          talent.content || '내용 없음'
        }</p>
        
        <div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            <button class="text-sm text-blue-600 dark:text-blue-400 hover:underline edit-talent-btn" data-talent-id="${talentId}">
                <i class="ri-edit-2-line mr-1"></i>수정
            </button>
            <button class="text-sm text-red-600 dark:text-red-400 hover:underline delete-talent-btn" data-talent-id="${talentId}">
                <i class="ri-delete-bin-6-line mr-1"></i>삭제
            </button>
        </div>
      `;
      listFragment.appendChild(talentCard);
    });
    contentListElement.appendChild(listFragment);

    // 수정/삭제 버튼 이벤트 리스너 설정
    setupActionButtons(contentListElement, nickname, currentPage);
  }

  // 수정/삭제 버튼 이벤트 리스너 설정 함수
  function setupActionButtons(container, userNickname, pageToReload) {
    container.querySelectorAll('.edit-talent-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const talentId = e.target.closest('button').dataset.talentId;
        // TODO: 수정 페이지로 이동 또는 수정 모달 표시
        alert(`재능 수정 기능 (ID: ${talentId}) - 구현 필요`);
        // 예: window.location.href = `/talent/edit/${talentId}`;
      });
    });
    container.querySelectorAll('.delete-talent-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const talentId = e.target.closest('button').dataset.talentId;
        if (confirm('이 재능을 정말 삭제하시겠습니까?')) {
          await deleteTalentApiCall(userNickname, talentId, pageToReload);
        }
      });
    });
  }

  // 재능 삭제 API 호출 함수
  async function deleteTalentApiCall(userNickname, talentId, pageToReload) {
    try {
      // TODO: 실제 재능 삭제 API 엔드포인트로 수정 필요
      // 예시: /api/v1/users/${userNickname}/talents/${talentId} 또는 /api/v1/talents/${talentId}
      const apiUrl = `/api/v1/talents/${talentId}`; // 실제 API 경로로 수정
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.status === 401) {
        return window.handle401Error(() =>
          deleteTalentApiCall(userNickname, talentId, pageToReload)
        );
      }
      if (!response.ok && response.status !== 204) {
        // 204 No Content도 성공으로 간주
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `재능 삭제 실패: ${response.status}`
        );
      }
      alert('재능이 삭제되었습니다.');
      loadAndRenderData(pageToReload); // 현재 페이지 또는 0페이지로 리로드
    } catch (error) {
      console.error('재능 삭제 중 오류:', error);
      alert(error.message || '재능 삭제 중 오류가 발생했습니다.');
    }
  }

  // URL 업데이트 및 데이터 리로드 함수
  function updateUrlAndReloadData(page) {
    updateUrlParameters({
      // from common-utils.js
      type: 'my-talents',
      page: page
    });
    loadAndRenderData(page);
  }

  // 초기 데이터 로드
  loadAndRenderData(currentPage);
}

// 전역 스코프에 노출
window.initializeMyTalentsView = initializeMyTalentsView;
