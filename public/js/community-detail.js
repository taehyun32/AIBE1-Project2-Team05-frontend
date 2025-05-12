// 전역 변수 - 페이지 로드 시 1회만 초기화
let currentUser = null;
let postId = null;

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function() {
  // 기본 요소 초기화
  initializeElements();

  // 사용자 정보 로드 후 이벤트 리스너 설정 및 페이지 데이터 로드
  loadCurrentUser()
      .then(() => {
        setupEventListeners();
        loadPageData();
      })
      .catch(error => {
        console.error('사용자 정보 로드 오류:', error);
        // 사용자 정보 로드 실패해도 게스트로 페이지는 로드
        setupEventListeners();
        loadPageData();
      });
});

// 사용자 정보 로드 함수
async function loadCurrentUser() {
  try {
    const response = await fetch('/api/v1/authUser/me', {
      credentials: 'include'
    });

    // 로그인되지 않은 경우 (401)
    if (response.status === 401) {
      // 게스트 사용자로 설정
      currentUser = {
        isGuest: true,
        nickname: '게스트',
        profileImage: 'https://i.pravatar.cc/40?u=guest'
      };
      return;
    }

    // API 경로가 변경되었거나 아직 구현되지 않은 경우 (404)
    // if (response.status === 404) {
    //   console.warn('사용자 정보 API를 찾을 수 없습니다. 대체 API를 시도합니다.');

    //   // 대체 API 경로 시도
    //   const alternativeResponse = await fetch('/api/v1/members/me', {
    //     credentials: 'include'
    //   });

    //   if (!alternativeResponse.ok) {
    //     throw new Error('현재 사용자 정보를 가져올 수 없습니다.');
    //   }

    //   const userData = await alternativeResponse.json();

    //   currentUser = {
    //     isGuest: false,
    //     id: userData.data.id || userData.data.userId || userData.data.memberId,
    //     nickname: userData.data.nickname || userData.data.name || '사용자',
    //     profileImage: userData.data.profileImageUrl || userData.data.profileImage || `https://i.pravatar.cc/40?u=${userData.data.id}`,
    //     email: userData.data.email || '',
    //     // 필요한 경우 추가 사용자 정보
    //   };

    //   console.log('사용자 정보 로드 성공 (대체 API):', currentUser);
    //   return;
    // }

    if (!response.ok) {
      throw new Error('사용자 정보를 가져오는 중 오류 발생: ' + response.status);
    }

    const userData = await response.json();

    currentUser = {
      isGuest: false,
      nickname: userData.data.nickname || '사용자',
      profileImage: userData.data.profileImageUrl || `https://i.pravatar.cc/40?u=${userData.data.nickname}`,
      // 필요한 경우 추가 사용자 정보
    };

    console.log('사용자 정보 로드 성공:', currentUser);

  } catch (error) {
    console.error('사용자 정보 로드 실패:', error);

    // 오류 발생 시 게스트 사용자로 설정
    currentUser = {
      isGuest: true,
      nickname: '게스트',
      profileImage: 'https://i.pravatar.cc/40?u=guest'
    };

    // 로그인 필요한 기능들 비활성화 처리
    handleGuestUser();
  }
}

// 게스트 사용자 처리
function handleGuestUser() {
  // 댓글 입력창 비활성화 및 안내 메시지 추가
  const commentInput = document.getElementById('commentInput');
  const submitComment = document.getElementById('submitComment');

  if (commentInput) {
    commentInput.placeholder = '댓글을 작성하려면 로그인이 필요합니다.';
    commentInput.disabled = true;
    commentInput.classList.add('bg-gray-100');
  }

  if (submitComment) {
    submitComment.disabled = true;
    submitComment.textContent = '로그인 필요';
    submitComment.addEventListener('click', function() {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
    });
  }
}

// 기본 요소 초기화 함수
function initializeElements() {
  // URL에서 postId 추출
  const urlParams = new URLSearchParams(window.location.search);
  postId = urlParams.get('postId');

  if (!postId) {
    alert('잘못된 접근입니다.');
    window.location.href = '/community';
    return;
  }

  // 이미지 모달 생성
  createImageModal();
}

// 이벤트 리스너 설정 함수
function setupEventListeners() {
  // 공유 버튼 이벤트
  const shareButton = document.getElementById('shareButton');
  if (shareButton) {
    shareButton.addEventListener('click', handleShare);
  }

  // 북마크 버튼 이벤트
  const bookmarkButton = document.getElementById('bookmarkButton');
  if (bookmarkButton) {
    bookmarkButton.addEventListener('click', handleBookmark);
  }

  // 좋아요 버튼 이벤트
  const likeButton = document.getElementById('likeButton');
  if (likeButton) {
    likeButton.addEventListener('click', handleLike);
  }

  // 댓글 제출 버튼 이벤트
  const submitComment = document.getElementById('submitComment');
  if (submitComment) {
    submitComment.addEventListener('click', handleCommentSubmit);
  }
}

// 페이지 데이터 로드 함수
async function loadPageData() {
  try {
    await loadPostDetail(postId);
    await loadComments(postId);
  } catch (error) {
    console.error('페이지 데이터 로드 오류:', error);
    showToast('데이터를 불러오는 중 오류가 발생했습니다', 'error');
  }
}

// 게시글 상세 조회
async function loadPostDetail(postId) {
  const postLoadingSkeleton = document.getElementById('postLoadingSkeleton');
  const postContent = document.getElementById('postContent');

  try {
    const response = await fetch(`/api/v1/community/detail/${postId}`, {
      credentials: 'include'
    });

    if (response.status === 404) {
      console.warn('게시글 API를 찾을 수 없습니다. 임시 데이터를 사용합니다.');
      // 임시 게시글 데이터 사용
      const mockPost = getMockPost();
      renderPostDetail(mockPost);
      return;
    }

    if (!response.ok) {
      throw new Error('게시글 조회 실패: ' + response.status);
    }

    const result = await response.json();
    const post = result.data;

    // 게시글 데이터 렌더링
    renderPostDetail(post);

    // AI 답변 확인 (질문/답변 카테고리인 경우)
    if (post.category === 'QUESTION') {
      loadAiAnswer(postId);
    }
  } catch (error) {
    console.error('게시글 조회 오류:', error);
    showToast('게시글을 불러오는 중 오류가 발생했습니다', 'error');
  } finally {
    // 로딩 스켈레톤 숨기고 컨텐츠 표시 (오류가 있어도 UI는 표시)
    if (postLoadingSkeleton) postLoadingSkeleton.classList.add('hidden');
    if (postContent) postContent.classList.remove('hidden');
  }
}

// 게시글 상세 렌더링
function renderPostDetail(post) {
  // 제목, 카테고리, 날짜 등 기본 정보 설정
  setElementText('postTitle', post.title || '제목 없음');
  setElementText('postDate', formatDate(post.createdAt));
  setElementText('postCategory', getCategoryDisplayName(post.category));
  setElementText('authorNickname', post.nickname || '작성자 정보 없음');
  setElementText('createdAt', formatDate(post.createdAt));
  setElementText('viewCount', post.viewCount || 0);
  setElementText('likeCount', post.likeCount || 0);
  setElementText('commentCount', post.commentCount || 0);
  setElementText('totalComments', post.commentCount || 0);

  
  // 초기 좋아요 상태 설정
  const likeIcon = document.getElementById('likeIcon');
  if (likeIcon) {
    if (post.liked) {
      // API 응답에 'liked' 필드가 있고, true이면
      likeIcon.classList.remove('ri-heart-line');
      likeIcon.classList.add('ri-heart-fill');
      likeIcon.style.color = '#ef4444'; // 좋아요 활성 색상 (빨간색 계열)
    } else {
      likeIcon.classList.remove('ri-heart-fill');
      likeIcon.classList.add('ri-heart-line');
      likeIcon.style.color = ''; // 기본 아이콘 색상
    }
  }

  // 초기 북마크 상태 설정
  const bookmarkIcon = document.getElementById('bookmarkIcon');
  if (bookmarkIcon) {
    if (post.bookmarked) {
      // API 응답에 'bookmarked' 필드가 있고, true이면
      bookmarkIcon.classList.remove('ri-bookmark-line');
      bookmarkIcon.classList.add('ri-bookmark-fill');
      bookmarkIcon.style.color = '#3b82f6'; // 북마크 활성 색상
    } else {
      bookmarkIcon.classList.remove('ri-bookmark-fill');
      bookmarkIcon.classList.add('ri-bookmark-line');
      bookmarkIcon.style.color = ''; // 기본 아이콘 색상
    }
  }


  // 프로필 이미지 설정
  const defaultProfileImage = 'https://i.pravatar.cc/100?u=' + encodeURIComponent(post.userId || 'default');
  const profileImage = post.profileImageUrl || defaultProfileImage;

  setElementSrc('authorProfileImage', profileImage);
  setElementSrc('sidebarAuthorProfile', profileImage);

  // 사이드바 작성자 정보 업데이트
  setElementText('sidebarAuthorNickname', post.nickname || '작성자 정보 없음');

  // 본문 내용 렌더링
  const contentElement = document.getElementById('postContentBody');
  if (contentElement) {
    contentElement.innerHTML = post.content || '';
  }

  // 이미지 렌더링
  renderPostImages(post);

  // 태그 렌더링
  renderPostTags(post);

  // 수정/삭제 버튼 표시 여부 설정
  setupEditDeleteButtons(post);
}

// 이미지 렌더링 함수
function renderPostImages(post) {
  const postImagesContainer = document.getElementById('postImages');
  if (!postImagesContainer) return;

  // 이미지 URL이 없거나 빈 배열이면 컨테이너를 비움
  if (!post.imageUrls || !Array.isArray(post.imageUrls) || post.imageUrls.length === 0) {
    postImagesContainer.innerHTML = '';
    return;
  }

  // 유효한 이미지 URL만 필터링
  const validImageUrls = post.imageUrls.filter(url => url && typeof url === 'string' && url.trim() !== '');

  if (validImageUrls.length === 0) {
    postImagesContainer.innerHTML = '';
    return;
  }

  console.log('유효한 이미지 URL:', validImageUrls);

  if (validImageUrls.length === 1) {
    postImagesContainer.innerHTML = `
      <div class="rounded-lg overflow-hidden mb-4">
        <img src="${validImageUrls[0]}" 
             alt="게시글 이미지" 
             class="w-full max-w-3xl mx-auto cursor-pointer" 
             onclick="openImageModal('${validImageUrls[0]}')"
             onerror="handleImageError(this)" />
      </div>
    `;
  } else {
    postImagesContainer.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        ${validImageUrls.map((url, index) => `
          <div class="rounded-lg overflow-hidden">
            <img src="${url}" 
                 alt="게시글 이미지 ${index + 1}" 
                 class="w-full h-64 object-cover cursor-pointer" 
                 onclick="openImageModal('${url}')"
                 onerror="handleImageError(this)" />
          </div>
        `).join('')}
      </div>
    `;
  }
}

// 태그 렌더링 함수
function renderPostTags(post) {
  const postTagsContainer = document.getElementById('postTags');
  if (!postTagsContainer) return;

  if (!post.tags || !Array.isArray(post.tags) || post.tags.length === 0) {
    postTagsContainer.innerHTML = '';
    return;
  }

  postTagsContainer.innerHTML = post.tags.map(tag =>
      `<span class="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">#${tag}</span>`
  ).join('');
}

// 수정/삭제 버튼 설정
function setupEditDeleteButtons(post) {
  const postActions = document.getElementById('postActions');
  if (!postActions) return;

  // 현재 사용자가 게시글 작성자인지 확인
  if (currentUser && post.nickname === currentUser.nickname) {
    postActions.classList.remove('hidden');

    // 수정 버튼 클릭 이벤트
    const editPostBtn = document.getElementById('editPostBtn');
    if (editPostBtn) {
      editPostBtn.addEventListener('click', () => {
        window.location.href = `/community-write?edit=true&postId=${post.id}`;
      });
    }

    // 삭제 버튼 클릭 이벤트
    const deletePostBtn = document.getElementById('deletePostBtn');
    if (deletePostBtn) {
      deletePostBtn.addEventListener('click', async () => {
        if (confirm('게시글을 삭제하시겠습니까?')) {
          try {
            const response = await fetch(`/api/v1/community/${post.id}`, {
              method: 'DELETE',
              credentials: 'include'
            });

            if (!response.ok) {
              if (response.status === 401) {
                showToast('로그인이 필요합니다', 'error');
                return;
              }
              if (response.status === 404) {
                // 개발 중에는 성공으로 처리
                alert('게시글이 삭제되었습니다. (개발 모드)');
                window.location.href = '/community';
                return;
              }
              throw new Error('게시글 삭제 실패');
            }

            alert('게시글이 삭제되었습니다.');
            window.location.href = '/community';
          } catch (error) {
            console.error('게시글 삭제 오류:', error);
            showToast('게시글 삭제 중 오류가 발생했습니다', 'error');
          }
        }
      });
    }
  } else {
    postActions.classList.add('hidden');
  }
}

// 댓글 목록 조회
async function loadComments(postId) {
  const commentsList = document.getElementById('commentsList');
  if (!commentsList) return;

  try {
    console.log('댓글 조회 요청:', `/api/v1/community/${postId}/comments`);

    const response = await fetch(`/api/v1/community/${postId}/comments`, {
      credentials: 'include'
    });

    // 404 에러 처리 - 개발 모드에서는 임시 데이터 사용
    if (response.status === 404) {
      console.warn('댓글 API를 찾을 수 없습니다. 임시 데이터를 사용합니다.');
      const mockComments = getMockComments();
      renderComments(mockComments);
      updateCommentCount(mockComments.length);
      return;
    }

    if (!response.ok) {
      console.error('댓글 조회 실패:', response.status, response.statusText);

      // 401 에러인 경우 (로그인 필요)
      if (response.status === 401) {
        renderNoComments('댓글을 보려면 로그인이 필요합니다.');
        return;
      }

      throw new Error('댓글 조회 실패');
    }

    const responseText = await response.text();
    if (!responseText) {
      renderNoComments('댓글이 없습니다.');
      return;
    }

    const result = JSON.parse(responseText);
    console.log('댓글 데이터:', result);

    const comments = result.data?.content || [];
    renderComments(comments);
    updateCommentCount(comments.length);
  } catch (error) {
    console.error('댓글 조회 오류:', error);
    renderNoComments('댓글을 불러오는 중 오류가 발생했습니다.');
  }
}

// 댓글 수 업데이트
function updateCommentCount(count) {
  setElementText('totalComments', count);
  setElementText('commentCount', count);
}

// 댓글 없음 렌더링
function renderNoComments(message) {
  const commentsList = document.getElementById('commentsList');
  if (commentsList) {
    commentsList.innerHTML = `<p class="text-center text-gray-500">${message}</p>`;
  }
  updateCommentCount(0);
}

// 댓글 렌더링
function renderComments(comments) {
  const commentsList = document.getElementById('commentsList');
  if (!commentsList) return;

  commentsList.innerHTML = '';

  if (!comments || comments.length === 0) {
    renderNoComments('아직 댓글이 없습니다.');
    return;
  }

  comments.forEach(comment => {
    const commentHtml = createCommentHtml(comment);
    commentsList.insertAdjacentHTML('beforeend', commentHtml);
  });

  // 댓글 이벤트 리스너 연결
  document.querySelectorAll('.comment-item').forEach(comment => {
    attachCommentEventListeners(comment);
  });
}

// 댓글 HTML 생성
function createCommentHtml(comment) {
  const isMyComment = currentUser && comment.nickname === currentUser.nickname;
  const profileImage = comment.profileImageUrl || `https://i.pravatar.cc/40?u=${comment.userId}`;

  return `
    <div class="comment-item" data-comment-id="${comment.id}">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
          <img src="${profileImage}" alt="프로필" class="w-full h-full object-cover" />
        </div>
        <div class="flex-1">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="font-medium">${comment.nickname}</h3>
              <div class="text-xs text-gray-500">${formatDate(comment.createdAt)}</div>
            </div>
            ${isMyComment ? `
              <div class="comment-actions">
                <button class="text-gray-500 hover:text-primary edit-comment">
                  <i class="ri-edit-line"></i>
                </button>
                <button class="text-gray-500 hover:text-red-500 delete-comment">
                  <i class="ri-delete-bin-line"></i>
                </button>
              </div>
            ` : ''}
          </div>
          <div class="comment-content mt-1">
            <p class="text-gray-700">${comment.commentContent}</p>
          </div>
          <div class="comment-edit-form hidden mt-2">
            <textarea class="w-full px-4 py-2 border border-gray-300 rounded resize-none" rows="3">${comment.commentContent}</textarea>
            <div class="flex justify-end mt-2 space-x-2">
              <button class="bg-gray-200 text-gray-700 px-3 py-1 rounded-button hover:bg-gray-300 cancel-edit">취소</button>
              <button class="bg-primary text-white px-3 py-1 rounded-button hover:bg-indigo-600 save-edit">저장</button>
            </div>
          </div>
          <div class="flex items-center gap-4 mt-2">
            <button class="text-xs text-gray-500 hover:text-primary reply-button">답글 달기</button>
          </div>
        </div>
      </div>
      ${comment.childComments && comment.childComments.length > 0 ?
      `<div class="ml-12 mt-4 space-y-4">
          ${comment.childComments.map(child => createChildCommentHtml(child)).join('')}
        </div>` : ''}
    </div>
  `;
}

// 자식 댓글 HTML 생성
function createChildCommentHtml(comment) {
  const isMyComment = currentUser && comment.nickname === currentUser.nickname;
  const profileImage = comment.profileImageUrl || `https://i.pravatar.cc/40?u=${comment.userId}`;

  return `
    <div class="reply-item" data-comment-id="${comment.id}">
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
          <img src="${profileImage}" alt="프로필" class="w-full h-full object-cover" />
        </div>
        <div class="flex-1">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="font-medium text-sm">${comment.nickname}</h3>
              <div class="text-xs text-gray-500">${formatDate(comment.createdAt)}</div>
            </div>
            ${isMyComment ? `
              <div class="reply-actions">
                <button class="text-gray-500 hover:text-primary edit-reply">
                  <i class="ri-edit-line"></i>
                </button>
                <button class="text-gray-500 hover:text-red-500 delete-reply">
                  <i class="ri-delete-bin-line"></i>
                </button>
              </div>
            ` : ''}
          </div>
          <div class="reply-content mt-1">
            <p class="text-sm text-gray-700">${comment.commentContent}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 댓글 이벤트 리스너 연결
function attachCommentEventListeners(commentElement) {
  // 답글 달기 버튼
  const replyButton = commentElement.querySelector('.reply-button');
  if (replyButton) {
    replyButton.addEventListener('click', function() {
      // 이미 답글 폼이 있으면 제거
      const existingForm = commentElement.querySelector('.reply-form');
      if (existingForm) {
        existingForm.remove();
        return;
      }

      // 답글 폼 추가
      const commentId = commentElement.dataset.commentId;
      const replyForm = document.createElement('div');
      replyForm.className = 'reply-form ml-12 mt-4';
      replyForm.innerHTML = `
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
            <img src="${currentUser?.profileImage || 'https://i.pravatar.cc/40?u=default'}" alt="프로필" class="w-full h-full object-cover" />
          </div>
          <div class="flex-1">
            <textarea class="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none text-sm" rows="2" placeholder="답글을 입력하세요..."></textarea>
            <div class="flex justify-end mt-2 space-x-2">
              <button class="cancel-reply bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm">취소</button>
              <button class="submit-reply bg-primary text-white px-3 py-1 rounded text-sm">답글 작성</button>
            </div>
          </div>
        </div>
      `;

      // 댓글 아이템에 폼 추가
      const commentContent = commentElement.querySelector('.comment-content');
      commentContent.insertAdjacentElement('afterend', replyForm);

      // 취소 버튼 이벤트
      replyForm.querySelector('.cancel-reply').addEventListener('click', function() {
        replyForm.remove();
      });

      // 제출 버튼 이벤트
      replyForm.querySelector('.submit-reply').addEventListener('click', function() {
        const replyText = replyForm.querySelector('textarea').value.trim();
        if (!replyText) {
          showToast('답글 내용을 입력해주세요', 'warning');
          return;
        }

        // 임시 답글 추가 (개발 모드)
        addTempReply(commentElement, replyText);
        replyForm.remove();
        showToast('답글이 작성되었습니다 (개발 모드)', 'success');
      });

      // 포커스 설정
      replyForm.querySelector('textarea').focus();
    });
  }

  // 댓글 수정 버튼
  const editButton = commentElement.querySelector('.edit-comment');
  if (editButton) {
    editButton.addEventListener('click', function() {
      const commentContent = commentElement.querySelector('.comment-content');
      const commentEditForm = commentElement.querySelector('.comment-edit-form');

      commentContent.classList.add('hidden');
      commentEditForm.classList.remove('hidden');

      // 취소 버튼
      commentEditForm.querySelector('.cancel-edit').addEventListener('click', function() {
        commentContent.classList.remove('hidden');
        commentEditForm.classList.add('hidden');
      });

      // 저장 버튼
      commentEditForm.querySelector('.save-edit').addEventListener('click', function() {
        const newText = commentEditForm.querySelector('textarea').value.trim();
        if (!newText) {
          showToast('댓글 내용을 입력해주세요', 'warning');
          return;
        }

        // UI 수정 (개발 모드)
        commentContent.querySelector('p').textContent = newText;
        commentContent.classList.remove('hidden');
        commentEditForm.classList.add('hidden');

        showToast('댓글이 수정되었습니다 (개발 모드)', 'success');
      });
    });
  }

  // 댓글 삭제 버튼
  const deleteButton = commentElement.querySelector('.delete-comment');
  if (deleteButton) {
    deleteButton.addEventListener('click', function() {
      if (confirm('댓글을 삭제하시겠습니까?')) {
        // UI에서 댓글 제거 (개발 모드)
        commentElement.remove();

        // 댓글 카운트 업데이트
        const totalCount = document.querySelectorAll('.comment-item').length;
        updateCommentCount(totalCount);

        showToast('댓글이 삭제되었습니다 (개발 모드)', 'success');
      }
    });
  }
}

// 임시 답글 추가 함수
function addTempReply(commentElement, replyText) {
  const commentId = commentElement.dataset.commentId;

  // 임시 답글 데이터 생성
  const tempReply = {
    id: 'temp-reply-' + Date.now(),
    nickname: currentUser.nickname,
    profileImageUrl: currentUser.profileImage,
    commentContent: replyText,
    createdAt: new Date().toISOString()
  };

  // 답글 컨테이너 찾기 또는 생성
  let repliesContainer = commentElement.querySelector('.ml-12');
  if (!repliesContainer) {
    repliesContainer = document.createElement('div');
    repliesContainer.className = 'ml-12 mt-4 space-y-4';
    commentElement.appendChild(repliesContainer);
  }

  // 답글 HTML 생성 및 추가
  const replyHtml = createChildCommentHtml(tempReply);
  repliesContainer.insertAdjacentHTML('beforeend', replyHtml);
}

// 댓글 작성 처리 핸들러
function handleCommentSubmit() {
  const commentInput = document.getElementById('commentInput');
  const submitComment = document.getElementById('submitComment');

  const commentText = commentInput.value.trim();
  if (!commentText) {
    showToast('댓글 내용을 입력해주세요', 'warning');
    return;
  }

  // 로그인 체크
  if (currentUser.isGuest) {
    showToast('댓글을 작성하려면 로그인이 필요합니다', 'warning');
    setTimeout(() => {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
    }, 1500);
    return;
  }

  // 버튼 비활성화 (중복 클릭 방지)
  submitComment.disabled = true;
  submitComment.textContent = '작성 중...';

  // 실제 API 호출
  fetch(`/api/v1/community/${postId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      commentContent: commentText
    })
  })
      .then(response => {
        // 로그인 필요 (401)
        if (response.status === 401) {
          showToast('로그인이 필요합니다', 'error');
          setTimeout(() => {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
          }, 1500);
          throw new Error('로그인 필요');
        }

        // API 없음 (404) - 개발 모드
        if (response.status === 404) {
          console.warn('댓글 작성 API가 존재하지 않습니다. 개발 모드로 진행합니다.');
          // 개발 모드로 임시 댓글 추가
          return { mockMode: true };
        }

        if (!response.ok) {
          throw new Error('댓글 작성 실패: ' + response.status);
        }

        return response.json();
      })
      .then(result => {
        // 개발 모드인 경우
        if (result.mockMode) {
          // 새 댓글 생성
          const tempComment = {
            id: 'temp-comment-' + Date.now(),
            nickname: currentUser.nickname,
            profileImageUrl: currentUser.profileImage,
            commentContent: commentText,
            createdAt: new Date().toISOString(),
            childComments: []
          };

          // 임시 댓글 UI에 추가
          addTempCommentToUI(tempComment);
          showToast('댓글이 작성되었습니다 (개발 모드)', 'success');
          return;
        }

        // API 응답이 있는 경우
        showToast('댓글이 작성되었습니다', 'success');
        loadComments(postId); // 댓글 목록 새로고침
      })
      .catch(error => {
        console.error('댓글 작성 오류:', error);
        if (error.message !== '로그인 필요') {
          showToast('댓글 작성 중 오류가 발생했습니다', 'error');
        }
      })
      .finally(() => {
        // 입력 필드 초기화
        commentInput.value = '';

        // 버튼 상태 복원
        submitComment.disabled = false;
        submitComment.textContent = '댓글 작성';
      });
}

// 임시 댓글을 UI에 추가하는 함수
function addTempCommentToUI(comment) {
  // 댓글 목록 가져오기
  const commentsList = document.getElementById('commentsList');
  const noCommentsMessage = commentsList.querySelector('p.text-center');

  // 댓글이 없다는 메시지가 있으면 제거
  if (noCommentsMessage) {
    commentsList.innerHTML = '';
  }

  // 새 댓글 추가
  const commentHtml = createCommentHtml(comment);
  commentsList.insertAdjacentHTML('afterbegin', commentHtml);

  // 댓글 이벤트 연결
  const newCommentElement = commentsList.querySelector(`.comment-item[data-comment-id="${comment.id}"]`);
  if (newCommentElement) {
    attachCommentEventListeners(newCommentElement);
  }

  // 댓글 수 업데이트
  const commentsCount = document.querySelectorAll('.comment-item').length;
  updateCommentCount(commentsCount);
}

// 공유 기능 처리 핸들러
async function handleShare() {
  const shareButton = document.getElementById('shareButton');

  try {
    // 현재 페이지 URL 가져오기
    const pageUrl = window.location.href;

    // 클립보드에 복사
    await navigator.clipboard.writeText(pageUrl);

    // 버튼 상태 변경
    const originalContent = shareButton.innerHTML;
    shareButton.innerHTML = '<i class="ri-check-line text-xl"></i><span>복사됨</span>';
    shareButton.classList.add('text-green-500');

    // 성공 토스트 메시지 표시
    showToast('URL이 클립보드에 복사되었습니다', 'success');

    // 3초 후 원래 상태로 복원
    setTimeout(() => {
      shareButton.innerHTML = originalContent;
      shareButton.classList.remove('text-green-500');
    }, 3000);
  } catch (error) {
    console.error('URL 복사 오류:', error);
    showToast('URL 복사에 실패했습니다', 'error');
  }
}

// 북마크 처리 핸들러
async function handleBookmark() {
  const bookmarkIcon = document.getElementById('bookmarkIcon');
  if (!bookmarkIcon) return;

  // (실제 서비스용) 로그인 상태 확인
  // if (currentUser && currentUser.isGuest) {
  //   showToast("북마크하려면 로그인이 필요합니다.", "warning");
  //   return;
  // }

  const isCurrentlyBookmarked =
    bookmarkIcon.classList.contains('ri-bookmark-fill');
  const newBookmarkedState = !isCurrentlyBookmarked;

  // --- (실제 서비스용) API 호출 로직 (현재는 개발 모드로 주석 처리) ---
  try {
    const response = await fetch(
      `/api/v1/community/details/${postId}/bookmark`,
      {
        method: 'POST', // 북마크 상태에 따라 추가 또는 삭제
        credentials: 'include'
      }
    );
    if (response.status === 401) {
      showToast('로그인이 필요합니다.', 'error');
      return;
    }
    if (!response.ok) {
      throw new Error(`북마크 ${newBookmarkedState ? '추가' : '해제'} 실패`);
    }
    // API 성공 시 아래 UI 업데이트 로직 실행
  } catch (error) {
    console.error('북마크 처리 API 오류:', error);
    showToast('북마크 처리 중 오류가 발생했습니다', 'error');
    return; // 오류 발생 시 UI 변경하지 않음
  }
  // --- API 호출 로직 끝 ---

  // UI 업데이트 (개발 모드 및 API 성공 시)
  if (newBookmarkedState) {
    // 북마크 추가
    bookmarkIcon.classList.remove('ri-bookmark-line');
    bookmarkIcon.classList.add('ri-bookmark-fill');
    bookmarkIcon.style.color = '#3b82f6'; // 지정된 파란색 (활성 상태)
    showToast(
      currentUser.isGuest || !postId
        ? '북마크에 추가되었습니다 (개발 모드)'
        : '북마크에 추가되었습니다.',
      'success'
    );
  } else {
    // 북마크 해제
    bookmarkIcon.classList.remove('ri-bookmark-fill');
    bookmarkIcon.classList.add('ri-bookmark-line');
    bookmarkIcon.style.color = ''; // 기본 아이콘 색상
    showToast(
      currentUser.isGuest || !postId
        ? '북마크가 해제되었습니다 (개발 모드)'
        : '북마크가 해제되었습니다.',
      'info'
    );
  }
}

// 좋아요 처리 핸들러
async function handleLike() {
  const likeIcon = document.getElementById('likeIcon');
  const likeCountElement = document.getElementById('likeCount'); // Element로 가져오기
  if (!likeIcon || !likeCountElement) return;

  // // (실제 서비스용) 로그인 상태 확인
  // if (currentUser && currentUser.isGuest) {
  //   showToast("좋아요를 누르려면 로그인이 필요합니다.", "warning");
  //   return;
  // }

  // --- API 호출 ---
  try {
    const response = await fetch(`/api/v1/community/details/${postId}/like`, {
      method: 'POST',
      credentials: 'include'
    });

    if (response.status === 401) {
      showToast('로그인이 필요합니다.', 'error');
      return;
    }

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('좋아요 API 오류 응답:', errorBody);
      throw new Error(`좋아요 처리 실패 (Status: ${response.status})`);
    }

    // API 호출 성공: 서버로부터 받은 최신 정보로 UI 업데이트
    const result = await response.json();
    const data = result.data; // 응답 형식이 { data: { likeCount: N, liked: B } } 라고 가정

    // 서버 응답 데이터 유효성 검증 (간단하게)
    if (
      !data ||
      typeof data.likeCount !== 'number' ||
      typeof data.liked !== 'boolean'
    ) {
      console.error('좋아요 API 응답 데이터 형식이 예상과 다릅니다:', result);
      showToast('좋아요 상태 업데이트 중 오류가 발생했습니다.', 'error');
      return;
    }

    // 1. 좋아요 수 업데이트 (서버에서 받은 값 사용)
    likeCountElement.textContent = data.likeCount;

    // 2. 아이콘 상태 및 토스트 메시지 업데이트 (서버에서 받은 'data.liked' 상태 기준)
    if (data.liked === true) {
      // 서버가 '좋아요' 상태라고 응답
      likeIcon.classList.remove('ri-heart-line');
      likeIcon.classList.add('ri-heart-fill');
      likeIcon.style.color = '#ef4444'; // 좋아요 활성 색상
      showToast('좋아요를 눌렀습니다.', 'success');
    } else {
      // 서버가 '좋아요 취소' 상태라고 응답
      likeIcon.classList.remove('ri-heart-fill');
      likeIcon.classList.add('ri-heart-line');
      likeIcon.style.color = ''; // 기본 아이콘 색상
      showToast('좋아요가 취소되었습니다.', 'info');
    }
  } catch (error) {
    console.error('좋아요 처리 중 오류:', error);
    showToast(error.message || '좋아요 처리 중 오류가 발생했습니다', 'error');
  }
}

// AI 답변 조회
async function loadAiAnswer(postId) {
  try {
    const aiAnswerSection = document.getElementById('aiAnswerSection');
    const aiAnswerContent = document.getElementById('aiAnswerContent');

    if (!aiAnswerSection || !aiAnswerContent) return;

    const response = await fetch(`/api/v1/community/ai/${postId}`, {
      credentials: 'include'
    });

    // 404, 401 등의 오류는 AI 답변이 없는 것으로 처리
    if (!response.ok) return;

    const result = await response.json();
    const aiAnswer = result.data?.Content || result.data?.content;

    if (aiAnswer) {
      aiAnswerContent.innerHTML = aiAnswer;
      aiAnswerSection.classList.remove('hidden');
    }
  } catch (error) {
    console.error('AI 답변 조회 오류:', error);
    // 오류 발생 시 AI 답변 섹션 숨김 상태 유지
  }
}

// 토스트 메시지 표시 함수
function showToast(message, type = 'info') {
  // 기존 토스트가 있으면 제거
  const existingToast = document.getElementById('toast');
  if (existingToast) {
    existingToast.remove();
  }

  // 새 토스트 생성
  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.className = 'fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg z-50 flex items-center transition-all duration-300 transform translate-y-20 opacity-0';

  // 타입에 따른 스타일 및 아이콘 설정
  let icon = '';
  switch (type) {
    case 'success':
      toast.classList.add('bg-green-600', 'text-white');
      icon = '<i class="ri-check-line mr-2"></i>';
      break;
    case 'error':
      toast.classList.add('bg-red-600', 'text-white');
      icon = '<i class="ri-error-warning-line mr-2"></i>';
      break;
    case 'warning':
      toast.classList.add('bg-amber-500', 'text-white');
      icon = '<i class="ri-alert-line mr-2"></i>';
      break;
    default: // info
      toast.classList.add('bg-gray-800', 'text-white');
      icon = '<i class="ri-information-line mr-2"></i>';
  }

  toast.innerHTML = `${icon}<span>${message}</span>`;
  document.body.appendChild(toast);

  // 애니메이션으로 표시
  setTimeout(() => {
    toast.classList.remove('translate-y-20', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  }, 10);

  // 3초 후 사라지는 애니메이션
  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-20', 'opacity-0');

    // 애니메이션 완료 후 요소 제거
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// 이미지 모달 생성
function createImageModal() {
  if (!document.getElementById('imageModal')) {
    const modalHtml = `
      <div id="imageModal" class="fixed inset-0 bg-black bg-opacity-75 hidden z-50 flex items-center justify-center">
        <div class="relative max-w-screen-xl max-h-screen p-4">
          <button id="closeModal" class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300">
            <i class="ri-close-line"></i>
          </button>
          <img id="modalImage" src="" alt="확대 이미지" class="max-w-full max-h-[90vh] object-contain" />
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById('imageModal');
    const closeButton = document.getElementById('closeModal');

    closeButton.addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  }
}

// 이미지 모달 열기 (전역 함수)
function openImageModal(imageUrl) {
  const modal = document.getElementById('imageModal');
  const modalImage = document.getElementById('modalImage');

  if (!modal || !modalImage) {
    console.error('이미지 모달 요소를 찾을 수 없습니다.');
    return;
  }

  modalImage.src = imageUrl;
  modal.classList.remove('hidden');
}

// 이미지 에러 핸들러 (전역 함수)
function handleImageError(img) {
  img.onerror = null;
  console.error('이미지 로드 실패:', img.src);

  // 플레이스홀더 이미지로 대체
  img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="50%" y="50%" font-family="Arial" font-size="20" fill="%239ca3af" text-anchor="middle" dy=".3em"%3EImage Not Found%3C/text%3E%3C/svg%3E';
}

// 유틸리티 함수들
function getCategoryDisplayName(category) {
  const categoryMap = {
    'QUESTION': '질문/답변',
    'INFO': '정보공유',
    'REVIEW': '후기',
    'FREE': '자유게시판',
    'TALENT': '재능나눔'
  };
  return categoryMap[category] || category;
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);

    // 유효한 날짜인지 확인
    if (isNaN(date.getTime())) {
      return 'N/A';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('날짜 형식 변환 오류:', error);
    return 'N/A';
  }
}

// HTML 요소 텍스트 설정 헬퍼 함수
function setElementText(elementId, text) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = text;
  }
}

// HTML 요소 src 설정 헬퍼 함수
function setElementSrc(elementId, src) {
  const element = document.getElementById(elementId);
  if (element) {
    element.src = src;
  }
}

// 임시 게시글 데이터 (API 오류 시 사용)
function getMockPost() {
  return {
    id: 'mock-post-1',
    userId: 'happydev123',
    nickname: '행복한개발자',
    profileImageUrl: 'https://i.pravatar.cc/100?u=happydev123',
    title: '자바 개발자를 위한 필수 팁 10가지',
    content: `
      <h2>자바 개발자를 위한 필수 팁</h2>
      <p>안녕하세요! 오늘은 제가 자바 개발을 하면서 알게 된 유용한 팁들을 공유하고자 합니다.</p>
      <h3>1. 최신 Java 버전 활용하기</h3>
      <p>Java 8 이상의 버전에서는 람다식, 스트림 API 등 굉장히 유용한 기능들이 많이 추가되었습니다. 가능하면 최신 버전을 활용하는 것이 생산성 향상에 도움이 됩니다.</p>
      <h3>2. 효율적인 예외 처리</h3>
      <p>예외는 정말 예외적인 상황에서만 사용하고, 일반적인 흐름 제어에는 사용하지 않는 것이 좋습니다. 예외 처리는 성능에 영향을 줄 수 있기 때문입니다.</p>
      <h3>3. 코드 가독성 높이기</h3>
      <p>복잡한 코드보다는 읽기 쉬운 코드가 유지보수에 더 유리합니다. 적절한 변수명과 함수명을 사용하고, 주석을 충분히 달아주세요.</p>
    `,
    category: 'INFO',
    createdAt: '2025-05-10T08:30:00',
    viewCount: 125,
    likeCount: 42,
    commentCount: 3,
    tags: ['Java', '개발팁', '프로그래밍', '백엔드'],
    imageUrls: ['https://umboxxymir.is/fmqj/du.supabase.co/storage/v1?id=b1e8-5a0ee635024-chaigpI_java.png']
  };
}

// 임시 댓글 데이터 (API 오류 시 사용)
function getMockComments() {
  return [
    {
      id: 'mock-comment-1',
      userId: 'user1',
      nickname: '개발자A',
      profileImageUrl: 'https://i.pravatar.cc/40?u=user1',
      commentContent: '정말 유익한 게시글이네요! 자바 개발에 큰 도움이 될 것 같습니다.',
      createdAt: '2025-05-10T12:30:00',
      childComments: [
        {
          id: 'mock-reply-1',
          userId: 'currentUserId', // 현재 사용자가 작성한 답글
          nickname: '현재 사용자',
          profileImageUrl: 'https://i.pravatar.cc/40?u=currentUser',
          commentContent: '감사합니다! 도움이 되셨다니 기쁩니다.',
          createdAt: '2025-05-10T14:25:00'
        },
        {
          id: 'mock-reply-2',
          userId: 'user3',
          nickname: '디자이너C',
          profileImageUrl: 'https://i.pravatar.cc/40?u=user3',
          commentContent: '저도 많은 도움이 되었어요!',
          createdAt: '2025-05-11T09:15:00'
        }
      ]
    },
    {
      id: 'mock-comment-2',
      userId: 'user2',
      nickname: '프론트엔드B',
      profileImageUrl: 'https://i.pravatar.cc/40?u=user2',
      commentContent: '자바와 자바스크립트의 차이점에 대해서도 다뤄주시면 좋을 것 같아요.',
      createdAt: '2025-05-11T15:45:00',
      childComments: []
    },
    {
      id: 'mock-comment-3',
      userId: 'currentUserId', // 현재 사용자가 작성한 댓글
      nickname: '현재 사용자',
      profileImageUrl: 'https://i.pravatar.cc/40?u=currentUser',
      commentContent: '다음에는 스프링 프레임워크에 대해서도 포스팅해주세요!',
      createdAt: '2025-05-12T10:20:00',
      childComments: []
    }
  ];
}