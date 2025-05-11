document.addEventListener('DOMContentLoaded', async function() {
  // 로딩 스켈레톤 요소
  const postLoadingSkeleton = document.getElementById('postLoadingSkeleton');
  const postContent = document.getElementById('postContent');
  const aiAnswerSection = document.getElementById('aiAnswerSection');

  // 댓글 관련 요소
  const commentInput = document.getElementById('commentInput');
  const submitComment = document.getElementById('submitComment');
  const commentsList = document.getElementById('commentsList');
  const totalComments = document.getElementById('totalComments');
  const commentCount = document.getElementById('commentCount');

  // 좋아요 관련 요소
  const likeButton = document.getElementById('likeButton');
  const likeIcon = document.getElementById('likeIcon');
  const likeCount = document.getElementById('likeCount');

  // URL에서 postId 추출
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('postId');

  if (!postId) {
    alert('잘못된 접근입니다.');
    window.location.href = '/community';
    return;
  }

  // 현재 사용자 정보 (임시)
  let currentUser = null;
  try {
    currentUser = {
      id: 'currentUserId',
      nickname: '현재 사용자',
      profileImage: 'https://i.pravatar.cc/40?u=currentUser'
    };
  } catch (error) {
    console.log('사용자 정보를 가져올 수 없습니다.');
  }

  // 페이지 초기화
  await loadPostDetail(postId);
  await loadComments(postId);

  // 게시글 상세 조회
  async function loadPostDetail(postId) {
    try {
      const response = await fetch(`/api/v1/community/detail/${postId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('게시글 조회 실패');
      }

      const result = await response.json();
      const post = result.data;

      // 로딩 스켈레톤 숨기고 컨텐츠 표시
      postLoadingSkeleton.classList.add('hidden');
      postContent.classList.remove('hidden');

      // 게시글 데이터 렌더링
      renderPostDetail(post);

      // AI 답변 확인 (질문/답변 카테고리인 경우)
      if (post.category === 'QUESTION') {
        loadAiAnswer(postId);
      }
    } catch (error) {
      console.error('Error:', error);
      postLoadingSkeleton.classList.add('hidden');
      alert('게시글을 불러오는 중 오류가 발생했습니다.');
    }
  }

  // 게시글 상세 렌더링
  function renderPostDetail(post) {
    // 기본 정보 렌더링
    document.getElementById('postTitle').textContent = post.title;
    document.getElementById('postDate').textContent = formatDate(post.createdAt);
    document.getElementById('postCategory').textContent = getCategoryDisplayName(post.category);
    document.getElementById('authorNickname').textContent = post.nickname;
    document.getElementById('createdAt').textContent = formatDate(post.createdAt);
    document.getElementById('viewCount').textContent = post.viewCount;
    document.getElementById('likeCount').textContent = post.likeCount;
    document.getElementById('commentCount').textContent = post.commentCount;
    document.getElementById('totalComments').textContent = post.commentCount;

    // 프로필 이미지 설정
    const defaultProfileImage = 'https://i.pravatar.cc/100?u=' + encodeURIComponent(post.userId || 'default');
    const profileImage = post.profileImageUrl || defaultProfileImage;

    const authorProfileImage = document.getElementById('authorProfileImage');
    const sidebarAuthorProfile = document.getElementById('sidebarAuthorProfile');

    if (authorProfileImage) authorProfileImage.src = profileImage;
    if (sidebarAuthorProfile) sidebarAuthorProfile.src = profileImage;

    // 사이드바 작성자 정보 업데이트
    document.getElementById('sidebarAuthorNickname').textContent = post.nickname;

    // 본문 내용 렌더링
    document.getElementById('postContentBody').innerHTML = post.content;

    // 이미지 렌더링 - 디버깅을 위한 로그 추가
    console.log('Post images:', post.imageUrls);
    // 이미지 렌더링
    if (post.imageUrls && post.imageUrls.length > 0) {
      const validImageUrls = post.imageUrls.filter(url => url && url.trim() !== '');

      if (validImageUrls.length === 0) {
        console.log('No valid image URLs found');
        return;
      }

      console.log('Valid image URLs:', validImageUrls); // 디버깅용

      const postImagesContainer = document.getElementById('postImages');
      postImagesContainer.innerHTML = '';

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

    // 태그 렌더링
    if (post.tags && post.tags.length > 0) {
      const postTagsContainer = document.getElementById('postTags');
      postTagsContainer.innerHTML = post.tags.map(tag =>
          `<span class="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">#${tag}</span>`
      ).join('');
    }
  }

  // 댓글 목록 조회
  async function loadComments(postId) {
    try {
      const response = await fetch(`/api/v1/community/${postId}/comments`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('댓글 조회 실패');
      }

      const result = await response.json();
      const comments = result.data.content;

      renderComments(comments);

      // 댓글 총 개수 업데이트
      const totalCount = comments.length;
      document.getElementById('totalComments').textContent = totalCount;
      document.getElementById('commentCount').textContent = totalCount;
    } catch (error) {
      console.error('Error:', error);
    }
  }

  // 댓글 렌더링
  function renderComments(comments) {
    commentsList.innerHTML = '';

    if (comments.length === 0) {
      commentsList.innerHTML = '<p class="text-center text-gray-500">아직 댓글이 없습니다.</p>';
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
    const isMyComment = currentUser && comment.userId === currentUser.id;
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
    const isMyComment = currentUser && comment.userId === currentUser.id;
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

  // AI 답변 조회
  async function loadAiAnswer(postId) {
    try {
      const response = await fetch(`/api/v1/community/ai/${postId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        console.log('AI 답변이 없습니다.');
        return;
      }

      const result = await response.json();
      const aiAnswer = result.data.Content;

      if (aiAnswer) {
        renderAiAnswer(aiAnswer);
      }
    } catch (error) {
      console.error('AI 답변 조회 오류:', error);
    }
  }

  // AI 답변 렌더링
  function renderAiAnswer(content) {
    const aiAnswerSection = document.getElementById('aiAnswerSection');
    const aiAnswerContent = document.getElementById('aiAnswerContent');

    aiAnswerContent.innerHTML = content;
    aiAnswerSection.classList.remove('hidden');
  }

  // 댓글 작성
  submitComment.addEventListener('click', async function() {
    const commentText = commentInput.value.trim();
    if (!commentText) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    // 버튼 비활성화 (중복 클릭 방지)
    submitComment.disabled = true;
    submitComment.textContent = '작성 중...';

    try {
      const response = await fetch(`/api/v1/community/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          commentContent: commentText
        })
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          alert('로그인이 필요합니다.');
          window.location.href = '/login';
          return;
        }
        throw new Error(responseData.message || '댓글 작성 실패');
      }

      // 댓글 입력창 초기화
      commentInput.value = '';

      // 댓글 목록 다시 불러오기
      await loadComments(postId);
    } catch (error) {
      console.error('Error:', error);
      alert('댓글 작성 중 오류가 발생했습니다.\n' + error.message);
    } finally {
      // 버튼 다시 활성화
      submitComment.disabled = false;
      submitComment.textContent = '댓글 작성';
    }
  });

  // 좋아요 기능
  likeButton.addEventListener('click', async function() {
    try {
      const response = await fetch(`/api/v1/community/details/${postId}/like`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          alert('로그인이 필요합니다.');
          window.location.href = '/login';
          return;
        }
        throw new Error('좋아요 처리 실패');
      }

      const result = await response.json();
      const isLiked = result.data.liked;

      if (isLiked) {
        likeIcon.classList.remove('ri-heart-line');
        likeIcon.classList.add('ri-heart-fill');
        likeIcon.style.color = '#ef4444';
        likeCount.textContent = parseInt(likeCount.textContent) + 1;
      } else {
        likeIcon.classList.remove('ri-heart-fill');
        likeIcon.classList.add('ri-heart-line');
        likeIcon.style.color = '';
        likeCount.textContent = parseInt(likeCount.textContent) - 1;
      }
    } catch (error) {
      console.error('Error:', error);
      alert('좋아요 처리 중 오류가 발생했습니다.');
    }
  });

  // 댓글 이벤트 리스너 함수
  function attachCommentEventListeners(commentElement) {
    // 여기에 댓글 수정, 삭제, 답글 이벤트 리스너 코드 추가
    // (기존 코드와 동일)
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
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
});

// 이미지 에러 핸들러 (전역 함수)
function handleImageError(img) {
  img.onerror = null;
  console.error('Failed to load image:', img.src);

  // SVG 대신 간단한 placeholder 이미지 사용
  img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="50%" y="50%" font-family="Arial" font-size="20" fill="%239ca3af" text-anchor="middle" dy=".3em"%3EImage Not Found%3C/text%3E%3C/svg%3E';
}

// 이미지 모달 기능 (전역 함수)
function openImageModal(imageUrl) {
  let modal = document.getElementById('imageModal');
  if (!modal) {
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

    modal = document.getElementById('imageModal');
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

  const modalImage = document.getElementById('modalImage');
  modalImage.src = imageUrl;
  modal.classList.remove('hidden');
}