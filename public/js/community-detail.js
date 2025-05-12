// 전역 변수 및 초기 설정
let currentUser = {
  isGuest: true,
  id: null,
  nickname: '게스트',
  profileImage: 'https://i.pravatar.cc/40?u=guest'
};

// 현재 사용자 정보 로드
async function loadCurrentUser() {
  try {
    console.log('사용자 정보 로드 시작');
    const response = await fetch('/api/v1/authUser/me', {
      credentials: 'include' // 쿠키 전송을 위해 필요
    });

    console.log('사용자 정보 응답 상태:', response.status);

    if (!response.ok) {
      if (response.status === 401) {
        console.log('로그인되지 않음 - 게스트 모드 설정');
        // 게스트 사용자로 설정
        currentUser = {
          isGuest: true,
          nickname: '게스트',
          profileImage: 'https://i.pravatar.cc/40?u=guest'
        };

        handleGuestUser();
        return;
      }
      throw new Error('사용자 정보를 가져오는 중 오류 발생: ' + response.status);
    }

    const userData = await response.json();
    console.log('사용자 정보 응답 데이터:', userData);

    // 로그인 성공 - 사용자 정보 설정
    if (userData && userData.data) {
      // API 응답 구조에 따라 적절히 조정
      const data = userData.data;

      currentUser = {
        isGuest: false,
        id: data.id || data.userId,
        nickname: data.nickname || data.name || '사용자',
        profileImage: data.profileImageUrl || data.profileImage || `https://i.pravatar.cc/40?u=${data.nickname || 'user'}`,
        provider: data.provider,
        providerId: data.providerId
      };

      console.log('사용자 정보 설정 완료:', currentUser);

      // 현재 사용자의 프로필 이미지를 댓글 입력 폼에 설정
      updateCurrentUserProfileUI();
    } else {
      console.warn('API에서 유효한 사용자 데이터를 받지 못함:', userData);
      // 게스트 사용자로 설정
      currentUser = {
        isGuest: true,
        nickname: '게스트',
        profileImage: 'https://i.pravatar.cc/40?u=guest'
      };

      handleGuestUser();
    }
  } catch (error) {
    console.error('사용자 정보 로드 실패:', error);
    // 오류 발생 시 게스트 사용자로 처리
    currentUser = {
      isGuest: true,
      nickname: '게스트',
      profileImage: 'https://i.pravatar.cc/40?u=guest'
    };

    handleGuestUser();
  }
}

// 실시간 로그인 상태 확인 함수
async function checkCurrentLoginStatus() {
  try {
    const response = await fetch('/api/v1/authUser/me', {
      credentials: 'include',
      // 캐시를 피하기 위한 설정
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (response.ok) {
      const userData = await response.json();
      if (userData && userData.data) {
        // 로그인 상태 업데이트
        const data = userData.data;
        currentUser = {
          isGuest: false,
          id: data.id || data.userId,
          nickname: data.nickname || data.name || '사용자',
          profileImage: data.profileImageUrl || data.profileImage || `https://i.pravatar.cc/40?u=${data.nickname || 'user'}`,
          provider: data.provider,
          providerId: data.providerId
        };
        updateCurrentUserProfileUI();
        return true;
      }
    }

    // 로그인 실패 시 게스트 상태 유지
    if (currentUser.isGuest) {
      return false;
    }

    // 이전에 로그인되었지만 현재 로그인이 실패한 경우
    currentUser = {
      isGuest: true,
      nickname: '게스트',
      profileImage: 'https://i.pravatar.cc/40?u=guest'
    };
    handleGuestUser();
    return false;
  } catch (error) {
    console.error('로그인 상태 확인 오류:', error);
    return currentUser.isGuest === false; // 기존 상태 유지
  }
}

// 프로필 이미지 업데이트
function updateCurrentUserProfileUI() {
  const commentFormProfileImg = document.querySelector('.comment-form .profile-img img');
  if (commentFormProfileImg) {
    commentFormProfileImg.src = currentUser.profileImage;
    commentFormProfileImg.alt = `${currentUser.nickname}의 프로필`;
  }

  // 댓글 작성 버튼 활성화
  document.querySelector('.comment-submit').disabled = false;
}

// 게스트 사용자 처리
function handleGuestUser() {
  // 댓글 작성 UI 수정
  const commentFormProfileImg = document.querySelector('.comment-form .profile-img img');
  if (commentFormProfileImg) {
    commentFormProfileImg.src = currentUser.profileImage;
    commentFormProfileImg.alt = '게스트';
  }

  // 댓글 입력 필드에 안내 메시지 추가
  const commentInput = document.getElementById('commentInput');
  if (commentInput) {
    commentInput.placeholder = '댓글을 작성하려면 로그인이 필요합니다';
    // 읽기 전용으로 설정하고 클릭 시 로그인 페이지로 안내
    commentInput.readOnly = true;
    commentInput.addEventListener('click', function() {
      if (currentUser.isGuest) {
        showToast('로그인이 필요합니다', 'info');
        setTimeout(() => {
          window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
        }, 1000);
      }
    });
  }

  // 댓글 제출 버튼 비활성화
  const commentSubmitBtn = document.querySelector('.comment-submit');
  if (commentSubmitBtn) {
    commentSubmitBtn.disabled = true;
    commentSubmitBtn.textContent = '로그인 필요';
  }
}

// URL에서 postId 가져오기
function getPostIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('postId');
}

// 게시글 상세 정보 로드 함수 (추가됨)
async function loadPostDetail(postId) {
  try {
    console.log('게시글 상세 정보 로드 시작:', postId);

    const url = `/api/v1/community/${postId}`;

    const response = await fetch(url, {
      credentials: 'include' // 쿠키 전송을 위해 필요
    });

    // 401 오류는 게스트 사용자로 간주하고 계속 진행
    if (response.status === 401) {
      console.log('게스트 사용자로 게시글 접근 시도');
      // 백엔드에서 게스트 접근을 별도로 허용하는 API가 있다면 해당 API 호출
      // 예: const guestResponse = await fetch(`/api/v1/public/community/${postId}`);

      // 혹은 특정 경우 mock 데이터로 UI 표시
      showGuestPostView(postId);
      return;
    }

    if (!response.ok) {
      throw new Error(`게시글 로드 실패: ${response.status}`);
    }

    const data = await response.json();
    console.log('게시글 데이터:', data);

    if (data.status === 200 && data.data) {
      renderPostDetail(data.data);
    } else {
      console.error('게시글 데이터 없음:', data);
      showToast('게시글을 불러올 수 없습니다', 'error');
    }
  } catch (error) {
    console.error('게시글 로드 오류:', error);
    showToast('게시글을 불러오는 중 오류가 발생했습니다', 'error');
  }
}
// 게스트 사용자를 위한 게시글 뷰 표시 (백엔드에서 공개 API가 없는 경우)
function showGuestPostView(postId) {
  const postDetail = document.getElementById('postDetail');
  if (!postDetail) return;

  postDetail.innerHTML = `
    <div class="p-6 text-center">
      <div class="mb-4">
        <i class="ri-lock-2-line text-4xl text-gray-400"></i>
      </div>
      <h2 class="text-2xl font-semibold mb-2">로그인이 필요합니다</h2>
      <p class="text-gray-600 mb-4">게시글 내용을 보려면 로그인해주세요.</p>
      <a href="/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}" 
         class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
        로그인 하기
      </a>
    </div>
  `;
}

// 게시글 정보 렌더링 함수 (추가됨)
function renderPostDetail(post) {
  const postDetail = document.getElementById('postDetail');
  // 스켈레톤 UI 제거
  postDetail.innerHTML = '';

  const createdDate = new Date(post.createdAt).toLocaleDateString();
  const categoryLabel = getCategoryLabel(post.category);

  // 이미지 HTML 생성
  let imagesHTML = '';
  if (post.imageUrls && post.imageUrls.length > 0) {
    imagesHTML = `
      <div class="post-images mt-4 mb-6">
        ${post.imageUrls.map(url => `
          <div class="mb-3">
            <img src="${url}" alt="게시글 이미지" class="rounded-md max-w-full">
          </div>
        `).join('')}
      </div>
    `;
  }

  // 태그 HTML 생성
  let tagsHTML = '';
  if (post.tags && post.tags.length > 0) {
    tagsHTML = `
      <div class="post-tags flex flex-wrap gap-2 my-3">
        ${post.tags.map(tag => `
          <span class="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
            #${tag}
          </span>
        `).join('')}
      </div>
    `;
  }

  // 게시글 HTML 생성
  const postHTML = `
    <div>
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
            <img src="${post.profileImageUrl || `https://i.pravatar.cc/40?u=${post.nickname}`}" 
                 alt="${post.nickname}의 프로필" 
                 class="w-full h-full object-cover"
                 onerror="this.src='https://i.pravatar.cc/40?u=default'">
          </div>
          <div>
            <div class="font-medium">${post.nickname}</div>
            <div class="text-xs text-gray-500">${createdDate}</div>
          </div>
        </div>
        <div class="post-category flex items-center">
          <span class="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
            ${categoryLabel}
          </span>
        </div>
      </div>
      
      <h1 class="text-2xl font-bold mb-4">${post.title}</h1>
      
      ${tagsHTML}
      
      <div class="post-content prose max-w-none mb-6">
        ${post.content}
      </div>
      
      ${imagesHTML}
      
      <div class="post-info flex items-center gap-4 text-sm text-gray-500 mt-4">
        <div class="flex items-center gap-1">
          <i class="ri-eye-line"></i>
          <span>${post.viewCount || 0}</span>
        </div>
        <div class="flex items-center gap-1">
          <i class="ri-chat-1-line"></i>
          <span>${post.commentCount || 0}</span>
        </div>
        <div class="flex items-center gap-1">
          <i class="ri-heart-line"></i>
          <span>${post.likeCount || 0}</span>
        </div>
      </div>
    </div>
  `;

  postDetail.innerHTML = postHTML;
}

// 카테고리 라벨 생성 함수 (추가됨)
function getCategoryLabel(category) {
  const categoryMap = {
    'GENERAL': '일반 게시글',
    'NOTICE': '공지사항',
    'QUESTION': '질문',
    'PROJECT': '프로젝트',
    'STUDY': '스터디',
    'FREE': '자유 게시판'
  };

  return categoryMap[category] || category;
}

// 댓글 조회 함수 (수정됨)
async function loadComments(postId) {
  try {
    console.log('댓글 조회 요청:', `/api/v1/community/${postId}/comments`);
    const response = await fetch(`/api/v1/community/${postId}/comments`, {
      credentials: 'include' // 쿠키 포함 (추가)
    });

    if (!response.ok) {
      throw new Error(`댓글 조회 실패: ${response.status}`);
    }

    const data = await response.json();
    console.log('댓글 데이터:', data);

    if (data.status === 200 && data.data) {
      renderComments(data.data.content, data.data.hasNext);
    } else {
      console.warn('댓글 데이터 없음:', data);
      // 데이터가 없어도 댓글이 없는 UI를 표시해야 함
      renderComments([], false);
    }
  } catch (error) {
    console.error('댓글 조회 오류:', error);
    showToast('댓글을 불러오는 중 오류가 발생했습니다', 'error');
    // 오류가 발생해도 댓글이 없는 UI를 표시
    renderComments([], false);
  }
}

// 댓글 렌더링 함수
function renderComments(comments, hasNext) {
  const commentsContainer = document.querySelector('.comments-list');
  const noCommentsMessage = document.querySelector('.no-comments');
  const loadMoreContainer = document.querySelector('.load-more-container');

  // DOM 요소가 없으면 일찍 반환
  if (!commentsContainer) {
    console.error('comments-list 요소를 찾을 수 없습니다.');
    return;
  }
  if (!noCommentsMessage) {
    console.error('no-comments 요소를 찾을 수 없습니다.');
    // 계속 진행할 수 있음
  }
  if (!loadMoreContainer) {
    console.error('load-more-container 요소를 찾을 수 없습니다.');
    // 계속 진행할 수 있음
  }

  // 댓글 컨테이너 비우기
  commentsContainer.innerHTML = '';

  // 댓글이 없는 경우
  if (!comments || comments.length === 0) {
    if (noCommentsMessage) {
      noCommentsMessage.style.display = 'block';
    }
    if (loadMoreContainer) {
      loadMoreContainer.style.display = 'none';
    }
    return;
  }

  // 댓글이 있는 경우
  if (noCommentsMessage) {
    noCommentsMessage.style.display = 'none';
  }

  // 댓글 렌더링
  comments.forEach(comment => {
    const commentHTML = createCommentHTML(comment);
    commentsContainer.insertAdjacentHTML('beforeend', commentHTML);
  });

  // 더 보기 버튼 표시 여부
  if (loadMoreContainer) {
    loadMoreContainer.style.display = hasNext ? 'block' : 'none';
  }
}

// 댓글 HTML 생성 함수
function createCommentHTML(comment) {
  const formattedDate = new Date(comment.createdAt).toISOString().split('T')[0];
  const isMyComment = !currentUser.isGuest && comment.userId === currentUser.id;

  // 자식 댓글(답글) HTML 생성
  let childCommentsHTML = '';
  if (comment.childComments && comment.childComments.length > 0) {
    childCommentsHTML = '<div class="replies-container mt-3 pl-10">';
    comment.childComments.forEach(reply => {
      const replyHTML = createReplyHTML(reply, false);
      childCommentsHTML += replyHTML;
    });
    childCommentsHTML += '</div>';
  }

  return `
    <div class="comment-item mb-5 border-b pb-4" data-comment-id="${comment.id}">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
          <img src="${comment.profileImageUrl || 'https://i.pravatar.cc/40?u=' + comment.nickname}" 
               alt="${comment.nickname}의 프로필" 
               class="w-full h-full object-cover" 
               onerror="this.src='https://i.pravatar.cc/40?u=default'">
        </div>
        <div class="flex-1">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="font-medium">${comment.nickname}</h3>
              <div class="text-xs text-gray-500">${formattedDate}</div>
            </div>
            ${isMyComment ? `
              <div class="comment-actions">
                <button class="text-gray-500 hover:text-primary edit-comment mx-1">
                  <i class="ri-edit-line"></i>
                </button>
                <button class="text-gray-500 hover:text-red-500 delete-comment mx-1">
                  <i class="ri-delete-bin-line"></i>
                </button>
              </div>
            ` : ''}
          </div>
          <div class="comment-content mt-2">
            <p class="text-gray-700">${comment.commentContent}</p>
          </div>
          <div class="comment-actions mt-2 flex items-center text-sm">
            <button class="reply-button text-blue-500 hover:text-blue-700">
              <i class="ri-chat-1-line mr-1"></i> 답글
            </button>
          </div>
        </div>
      </div>
      ${childCommentsHTML}
    </div>
  `;
}

// 답글 HTML 생성 함수
function createReplyHTML(reply, isTemporary) {
  const formattedDate = new Date(reply.createdAt).toISOString().split('T')[0];
  const tempClass = isTemporary ? 'opacity-70 animate-pulse' : '';
  const tempLabel = isTemporary ? '<span class="text-xs text-blue-500">(전송 중...)</span>' : '';
  const isMyReply = !currentUser.isGuest && reply.userId === currentUser.id;

  return `
    <div class="reply-item border-l-2 border-gray-300 pl-3 py-2 bg-gray-50 rounded-r-md ${tempClass}" data-comment-id="${reply.id}">
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
          <img src="${reply.profileImageUrl}" alt="${reply.nickname}의 프로필" class="w-full h-full object-cover" onerror="this.src='https://i.pravatar.cc/40?u=default'" />
        </div>
        <div class="flex-1">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="font-medium text-sm">
                <span class="inline-block bg-blue-100 text-blue-700 text-xs px-2 rounded-full mr-1">답글</span>
                ${reply.nickname} ${tempLabel}
              </h3>
              <div class="text-xs text-gray-500">${formattedDate}</div>
            </div>
            ${!isTemporary && isMyReply ? `
              <div class="reply-actions">
                <button class="text-gray-500 hover:text-primary edit-reply mx-1">
                  <i class="ri-edit-line"></i>
                </button>
                <button class="text-gray-500 hover:text-red-500 delete-reply mx-1">
                  <i class="ri-delete-bin-line"></i>
                </button>
              </div>
            ` : ''}
          </div>
          <div class="reply-content mt-1">
            <p class="text-sm text-gray-700">${reply.commentContent}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 댓글 제출 핸들러
async function handleCommentSubmit(event) {
  event.preventDefault();

  const commentInput = document.getElementById('commentInput');
  const commentText = commentInput.value.trim();
  // 댓글 제출 핸들러 (계속)
  if (!commentText) {
    showToast('댓글 내용을 입력해주세요', 'warning');
    return;
  }
  // 액션 전 로그인 상태 재확인
  const isLoggedIn = await checkCurrentLoginStatus();

  if (!isLoggedIn) {
    showToast('로그인 후 이용해주세요', 'warning');
    setTimeout(() => {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
    }, 1500);
    return;
  }

  const postId = getPostIdFromUrl();
  if (!postId) {
    showToast('게시글 정보를 찾을 수 없습니다', 'error');
    return;
  }

  const commentSubmitBtn = document.querySelector('.comment-submit');
  commentSubmitBtn.disabled = true;
  commentSubmitBtn.textContent = '작성 중...';

  // 임시 댓글 UI를 먼저 추가하여 사용자 경험 개선
  const tempCommentId = `temp-comment-${Date.now()}`;
  addTemporaryComment(tempCommentId, commentText);

  // 실제 API 호출
  console.log('댓글 작성 요청 데이터:', {
    commentContent: commentText,
    parentCommentId: null
  });

  fetch(`/api/v1/community/${postId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // 쿠키 포함
    body: JSON.stringify({
      commentContent: commentText,
      parentCommentId: null
    })
  })
      .then(response => {
        console.log('댓글 작성 응답 상태:', response.status);
        return response.json();
      })
      .then(result => {
        console.log('댓글 작성 응답 데이터:', result);

        if (result.status === 201 || result.status === 200) {
          // 성공
          showToast('댓글이 작성되었습니다', 'success');
          commentInput.value = '';

          // 임시 댓글 제거 후 실제 댓글로 교체
          removeTemporaryComment(tempCommentId);

          // 댓글 목록 새로고침
          loadComments(postId);

          // 게시글에 댓글 수 업데이트 (게시글 새로고침)
          loadPostDetail(postId);
        } else if (result.status === 401) {
          // 인증 오류
          showToast('로그인이 필요합니다', 'error');
          setTimeout(() => {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
          }, 1500);
        } else {
          // 기타 오류
          showToast(result.message || '댓글 작성 중 오류가 발생했습니다', 'error');
          // 임시 댓글 제거
          removeTemporaryComment(tempCommentId);
        }
      })
      .catch(error => {
        console.error('댓글 작성 오류:', error);
        showToast('댓글 작성 중 오류가 발생했습니다', 'error');
        // 임시 댓글 제거
        removeTemporaryComment(tempCommentId);
      })
      .finally(() => {
        commentSubmitBtn.disabled = false;
        commentSubmitBtn.textContent = '댓글 작성';
      });
}

// 임시 댓글 추가 함수
function addTemporaryComment(tempId, content) {
  const commentsContainer = document.querySelector('.comments-list');

  const formattedDate = new Date().toISOString().split('T')[0];

  const tempCommentHTML = `
   <div class="comment-item mb-5 border-b pb-4 opacity-70 animate-pulse" data-comment-id="${tempId}">
     <div class="flex items-start gap-3">
       <div class="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
         <img src="${currentUser.profileImage}" alt="${currentUser.nickname}의 프로필" 
              class="w-full h-full object-cover" 
              onerror="this.src='https://i.pravatar.cc/40?u=default'">
       </div>
       <div class="flex-1">
         <div class="flex justify-between items-start">
           <div>
             <h3 class="font-medium">${currentUser.nickname} <span class="text-xs text-blue-500">(전송 중...)</span></h3>
             <div class="text-xs text-gray-500">${formattedDate}</div>
           </div>
         </div>
         <div class="comment-content mt-2">
           <p class="text-gray-700">${content}</p>
         </div>
       </div>
     </div>
   </div>
 `;

  commentsContainer.insertAdjacentHTML('afterbegin', tempCommentHTML);

  // 댓글이 없는 경우 메시지 숨기기
  document.querySelector('.no-comments').style.display = 'none';
}

// 임시 댓글 제거 함수
function removeTemporaryComment(tempId) {
  const tempComment = document.querySelector(`.comment-item[data-comment-id="${tempId}"]`);
  if (tempComment) {
    tempComment.remove();
  }
}

// 답글 작성 폼 표시 함수
function showReplyForm(commentElement) {
  // 이미 있는 답글 폼이 있으면 제거
  document.querySelectorAll('.reply-form').forEach(form => form.remove());

  const commentId = commentElement.dataset.commentId;

  // 게스트 사용자는 로그인 안내
  if (currentUser.isGuest) {
    showToast('답글을 작성하려면 로그인이 필요합니다', 'info');
    setTimeout(() => {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
    }, 1500);
    return;
  }

  const replyFormHTML = `
   <div class="reply-form mt-3 flex items-start gap-2 px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
     <div class="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
       <img src="${currentUser.profileImage}" alt="${currentUser.nickname}의 프로필" 
            class="w-full h-full object-cover" 
            onerror="this.src='https://i.pravatar.cc/40?u=default'">
     </div>
     <div class="flex-1 flex flex-col">
       <textarea class="reply-input w-full rounded-md px-3 py-2 text-sm border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                 placeholder="답글을 입력하세요..."
                 rows="2"></textarea>
       <div class="flex justify-end gap-2 mt-2">
         <button class="cancel-reply text-sm px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700">취소</button>
         <button class="submit-reply text-sm px-3 py-1 rounded-md bg-primary hover:bg-primary-dark text-white">답글 작성</button>
       </div>
     </div>
   </div>
 `;

  // 댓글 아이템 하단에 삽입
  const actionsContainer = commentElement.querySelector('.comment-actions');
  actionsContainer.insertAdjacentHTML('afterend', replyFormHTML);

  // 이벤트 리스너 등록
  const replyForm = commentElement.querySelector('.reply-form');
  const cancelButton = replyForm.querySelector('.cancel-reply');
  const submitButton = replyForm.querySelector('.submit-reply');
  const replyInput = replyForm.querySelector('.reply-input');

  cancelButton.addEventListener('click', () => replyForm.remove());

  submitButton.addEventListener('click', () => {
    const replyText = replyInput.value.trim();
    submitReply(replyForm, commentElement, replyText);
  });

  // 엔터 키로 제출 (Shift+Enter는 줄바꿈)
  replyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const replyText = replyInput.value.trim();
      submitReply(replyForm, commentElement, replyText);
    }
  });

  // 자동 포커스
  replyInput.focus();
}

// 답글 제출 함수
function submitReply(replyForm, commentElement, replyText) {
  if (!replyText) {
    showToast('답글 내용을 입력해주세요', 'warning');
    return;
  }

  if (currentUser.isGuest) {
    showToast('답글을 작성하려면 로그인이 필요합니다', 'warning');
    setTimeout(() => {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
    }, 1500);
    return;
  }

  const parentCommentId = commentElement.dataset.commentId;
  const postId = getPostIdFromUrl();

  // 버튼 상태 변경
  const submitButton = replyForm.querySelector('.submit-reply');
  submitButton.disabled = true;
  submitButton.textContent = '작성 중...';

  // 임시 답글 추가
  const tempReplyId = `temp-reply-${Date.now()}`;
  console.log('답글 추가 시작:', commentElement, replyText, tempReplyId);

  // 임시 답글 데이터
  const tempReplyData = {
    id: tempReplyId,
    userId: currentUser.id,
    nickname: currentUser.nickname,
    profileImageUrl: currentUser.profileImage,
    commentContent: replyText,
    isParent: false,
    totalLikeCount: 0,
    createdAt: new Date().toISOString()
  };

  console.log('생성된 임시 답글 데이터:', tempReplyData);

  // 임시 답글 UI 추가
  const repliesContainer = commentElement.querySelector('.replies-container') ||
      createRepliesContainer(commentElement);

  const replyHtml = createReplyHTML(tempReplyData, true);
  repliesContainer.insertAdjacentHTML('beforeend', replyHtml);

  console.log('답글 HTML 생성 및 추가 완료:', replyHtml);

  // 실제 API 호출
  console.log('답글 API 요청 시작:', {
    commentContent: replyText,
    parentCommentId: parentCommentId
  });

  fetch(`/api/v1/community/${postId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      commentContent: replyText,
      parentCommentId: parentCommentId
    })
  })
      .then(response => {
        console.log('답글 API 응답 상태:', response.status);
        return response.json();
      })
      .then(result => {
        console.log('답글 API 응답 데이터:', result);

        if (result.status === 201 || result.status === 200) {
          // 성공
          showToast('답글이 작성되었습니다', 'success');

          // 임시 답글 제거
          const tempReply = document.querySelector(`.reply-item[data-comment-id="${tempReplyId}"]`);
          if (tempReply) {
            tempReply.remove();
          }

          // 실제 답글로 갱신
          if (result.data) {
            const replyHtml = createReplyHTML(result.data, false);
            repliesContainer.insertAdjacentHTML('beforeend', replyHtml);
          } else {
            // 응답에 데이터가 없으면 전체 목록 갱신
            loadComments(postId);
          }

          // 폼 제거
          replyForm.remove();
        } else if (result.status === 401) {
          // 인증 오류
          showToast('로그인이 필요합니다', 'error');
          setTimeout(() => {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
          }, 1500);

          // 임시 답글 제거
          const tempReply = document.querySelector(`.reply-item[data-comment-id="${tempReplyId}"]`);
          if (tempReply) {
            tempReply.remove();
          }

          // 폼 제거
          replyForm.remove();
        } else {
          // 기타 오류
          showToast(result.message || '답글 작성 중 오류가 발생했습니다', 'error');

          // 임시 답글 제거
          const tempReply = document.querySelector(`.reply-item[data-comment-id="${tempReplyId}"]`);
          if (tempReply) {
            tempReply.remove();
          }
        }
      })
      .catch(error => {
        console.error('답글 작성 오류:', error);
        showToast('답글 작성 중 오류가 발생했습니다', 'error');

        // 임시 답글 제거
        const tempReply = document.querySelector(`.reply-item[data-comment-id="${tempReplyId}"]`);
        if (tempReply) {
          tempReply.remove();
        }
      })
      .finally(() => {
        if (submitButton.parentNode) {
          submitButton.disabled = false;
          submitButton.textContent = '답글 작성';
        }
      });
}

// 답글 컨테이너 생성 함수
function createRepliesContainer(commentElement) {
  const repliesContainerHTML = `<div class="replies-container mt-3 pl-10"></div>`;
  commentElement.insertAdjacentHTML('beforeend', repliesContainerHTML);
  return commentElement.querySelector('.replies-container');
}

// 댓글 편집
function editComment(commentElement) {
  const commentId = commentElement.dataset.commentId;
  const contentElement = commentElement.querySelector('.comment-content');
  const originalContent = contentElement.querySelector('p').textContent;

  // 이미 편집 중이면 중복 실행 방지
  if (commentElement.querySelector('.edit-form')) {
    return;
  }

  // 편집 폼 HTML
  const editFormHTML = `
   <div class="edit-form mt-2">
     <textarea class="edit-input w-full rounded-md px-3 py-2 text-sm border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
               rows="3">${originalContent}</textarea>
     <div class="flex justify-end gap-2 mt-2">
       <button class="cancel-edit text-sm px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700">취소</button>
       <button class="save-edit text-sm px-3 py-1 rounded-md bg-primary hover:bg-primary-dark text-white">저장</button>
     </div>
   </div>
 `;

  // 기존 내용 숨기고 편집 폼 표시
  contentElement.querySelector('p').style.display = 'none';
  contentElement.insertAdjacentHTML('beforeend', editFormHTML);

  // 편집 폼 이벤트 리스너
  const editForm = contentElement.querySelector('.edit-form');
  const editInput = editForm.querySelector('.edit-input');
  const cancelButton = editForm.querySelector('.cancel-edit');
  const saveButton = editForm.querySelector('.save-edit');

  // 자동 포커스 및 커서 위치 끝으로
  editInput.focus();
  editInput.setSelectionRange(editInput.value.length, editInput.value.length);

  // 취소 버튼 이벤트
  cancelButton.addEventListener('click', () => {
    contentElement.querySelector('p').style.display = 'block';
    editForm.remove();
  });

  // 저장 버튼 이벤트
  saveButton.addEventListener('click', () => {
    const newContent = editInput.value.trim();
    if (!newContent) {
      showToast('댓글 내용을 입력해주세요', 'warning');
      return;
    }

    saveButton.disabled = true;
    saveButton.textContent = '저장 중...';

    updateComment(commentId, newContent, commentElement);
  });
}

// 답글 편집
function editReply(replyElement) {
  const commentId = replyElement.dataset.commentId;
  const contentElement = replyElement.querySelector('.reply-content');
  const originalContent = contentElement.querySelector('p').textContent;

  // 이미 편집 중이면 중복 실행 방지
  if (replyElement.querySelector('.edit-form')) {
    return;
  }

  // 편집 폼 HTML
  const editFormHTML = `
   <div class="edit-form mt-2">
     <textarea class="edit-input w-full rounded-md px-3 py-2 text-xs border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
               rows="2">${originalContent}</textarea>
     <div class="flex justify-end gap-2 mt-2">
       <button class="cancel-edit text-xs px-2 py-1 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700">취소</button>
       <button class="save-edit text-xs px-2 py-1 rounded-md bg-primary hover:bg-primary-dark text-white">저장</button>
     </div>
   </div>
 `;

  // 기존 내용 숨기고 편집 폼 표시
  contentElement.querySelector('p').style.display = 'none';
  contentElement.insertAdjacentHTML('beforeend', editFormHTML);

  // 편집 폼 이벤트 리스너
  const editForm = contentElement.querySelector('.edit-form');
  const editInput = editForm.querySelector('.edit-input');
  const cancelButton = editForm.querySelector('.cancel-edit');
  const saveButton = editForm.querySelector('.save-edit');

  // 자동 포커스 및 커서 위치 끝으로
  editInput.focus();
  editInput.setSelectionRange(editInput.value.length, editInput.value.length);

  // 취소 버튼 이벤트
  cancelButton.addEventListener('click', () => {
    contentElement.querySelector('p').style.display = 'block';
    editForm.remove();
  });

  // 저장 버튼 이벤트
  saveButton.addEventListener('click', () => {
    const newContent = editInput.value.trim();
    if (!newContent) {
      showToast('답글 내용을 입력해주세요', 'warning');
      return;
    }

    saveButton.disabled = true;
    saveButton.textContent = '저장 중...';

    updateComment(commentId, newContent, replyElement);
  });
}

// 댓글 또는 답글 업데이트 요청
function updateComment(commentId, content, element) {
  const postId = getPostIdFromUrl();

  fetch(`/api/v1/community/comments/${postId}/${commentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      commentContent: content
    })
  })
      .then(response => {
        console.log('댓글 수정 응답 상태:', response.status);
        return response.json();
      })
      .then(result => {
        console.log('댓글 수정 응답 데이터:', result);

        if (result.status === 200) {
          // 성공
          showToast('수정되었습니다', 'success');

          // 화면 업데이트
          const contentElement = element.querySelector(element.classList.contains('reply-item') ? '.reply-content' : '.comment-content');
          const editForm = contentElement.querySelector('.edit-form');

          contentElement.querySelector('p').textContent = content;
          contentElement.querySelector('p').style.display = 'block';

          if (editForm) {
            editForm.remove();
          }
        } else if (result.status === 401) {
          // 인증 오류
          showToast('로그인이 필요합니다', 'error');
          setTimeout(() => {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
          }, 1500);
        } else {
          // 기타 오류
          showToast(result.message || '수정 중 오류가 발생했습니다', 'error');
        }
      })
      .catch(error => {
        console.error('댓글 수정 오류:', error);
        showToast('수정 중 오류가 발생했습니다', 'error');
      })
      .finally(() => {
        // 편집 폼이 남아 있는 경우
        const editForm = element.querySelector('.edit-form');
        if (editForm) {
          const saveButton = editForm.querySelector('.save-edit');
          if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = '저장';
          }
        }
      });
}

// 댓글 삭제
function deleteComment(commentElement) {
  if (!confirm('댓글을 삭제하시겠습니까?')) {
    return;
  }

  const commentId = commentElement.dataset.commentId;
  const postId = getPostIdFromUrl();

  fetch(`/api/v1/community/comments/${postId}/${commentId}`, {
    method: 'DELETE',
    credentials: 'include',
  })
      .then(response => {
        console.log('댓글 삭제 응답 상태:', response.status);
        return response.json();
      })
      .then(result => {
        console.log('댓글 삭제 응답 데이터:', result);

        if (result.status === 200) {
          // 성공
          showToast('댓글이 삭제되었습니다', 'success');

          // 댓글 목록 새로고침 또는 DOM에서 직접 제거
          commentElement.remove();

          // 댓글이 모두 없어진 경우 메시지 표시
          const commentsContainer = document.querySelector('.comments-list');
          if (commentsContainer.children.length === 0) {
            document.querySelector('.no-comments').style.display = 'block';
          }

          // 게시글에 댓글 수 업데이트 (게시글 새로고침)
          loadPostDetail(postId);
        } else if (result.status === 401) {
          // 인증 오류
          showToast('로그인이 필요합니다', 'error');
          setTimeout(() => {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
          }, 1500);
        } else {
          // 기타 오류
          showToast(result.message || '삭제 중 오류가 발생했습니다', 'error');
        }
      })
      .catch(error => {
        console.error('댓글 삭제 오류:', error);
        showToast('삭제 중 오류가 발생했습니다', 'error');
      });
}

// 답글 삭제
function deleteReply(replyElement) {
  if (!confirm('답글을 삭제하시겠습니까?')) {
    return;
  }

  const replyId = replyElement.dataset.commentId;
  const postId = getPostIdFromUrl();

  fetch(`/api/v1/community/comments/${postId}/${replyId}`, {
    method: 'DELETE',
    credentials: 'include',
  })
      .then(response => {
        console.log('답글 삭제 응답 상태:', response.status);
        return response.json();
      })
      .then(result => {
        console.log('답글 삭제 응답 데이터:', result);

        if (result.status === 200) {
          // 성공
          showToast('답글이 삭제되었습니다', 'success');

          // DOM에서 직접 제거
          replyElement.remove();

          // 답글 컨테이너에 답글이 없으면 컨테이너도 제거
          const repliesContainer = replyElement.closest('.replies-container');
          if (repliesContainer && repliesContainer.children.length === 0) {
            repliesContainer.remove();
          }
        } else if (result.status === 401) {
          // 인증 오류
          showToast('로그인이 필요합니다', 'error');
          setTimeout(() => {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
          }, 1500);
        } else {
          // 기타 오류
          showToast(result.message || '삭제 중 오류가 발생했습니다', 'error');
        }
      })
      .catch(error => {
        console.error('답글 삭제 오류:', error);
        showToast('삭제 중 오류가 발생했습니다', 'error');
      });
}

// 토스트 메시지 표시 함수
function showToast(message, type = 'info') {
  const toast = document.createElement('div');

  // 타입에 따른 스타일 설정
  let bgColor, textColor, icon;
  switch (type) {
    case 'success':
      bgColor = 'bg-green-500';
      textColor = 'text-white';
      icon = '<i class="ri-check-line mr-2"></i>';
      break;
    case 'error':
      bgColor = 'bg-red-500';
      textColor = 'text-white';
      icon = '<i class="ri-error-warning-line mr-2"></i>';
      break;
    case 'warning':
      bgColor = 'bg-yellow-500';
      textColor = 'text-white';
      icon = '<i class="ri-alert-line mr-2"></i>';
      break;
    default:
      bgColor = 'bg-blue-500';
      textColor = 'text-white';
      icon = '<i class="ri-information-line mr-2"></i>';
  }

  toast.className = `fixed top-4 right-4 z-50 ${bgColor} ${textColor} px-4 py-3 rounded-md shadow-md flex items-center transition-all duration-300 opacity-0 transform translate-y-[-20px]`;
  toast.innerHTML = `${icon}${message}`;

  document.body.appendChild(toast);

  // 애니메이션 적용
  setTimeout(() => {
    toast.classList.remove('opacity-0', 'translate-y-[-20px]');
  }, 10);

  // 일정 시간 후 제거
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-[-20px]');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// 이벤트 리스너
document.addEventListener('DOMContentLoaded', async function() {
  // 현재 사용자 정보 로드
  await loadCurrentUser();

  // 게시글 ID 가져오기
  const postId = getPostIdFromUrl();
  if (!postId) {
    showToast('게시글 정보를 찾을 수 없습니다', 'error');
    return;
  }

  // 게시글 상세 정보 로드
  loadPostDetail(postId);

  // 댓글 목록 로드
  loadComments(postId);

  // 댓글 작성 폼 이벤트 리스너
  const commentForm = document.querySelector('.comment-form form');
  if (commentForm) {
    commentForm.addEventListener('submit', handleCommentSubmit);
  }

  // 더 보기 버튼 이벤트 리스너
  const loadMoreButton = document.querySelector('.load-more-comments');
  if (loadMoreButton) {
    loadMoreButton.addEventListener('click', function() {
      // 구현해야 할 경우 페이지네이션 로직 추가
    });
  }

  // 이벤트 위임을 통한 댓글 관련 버튼 처리
  document.addEventListener('click', function(event) {
    // 답글 작성 버튼 클릭
    if (event.target.closest('.reply-button')) {
      const commentItem = event.target.closest('.comment-item');
      if (commentItem) {
        showReplyForm(commentItem);
      }
    }

    // 댓글 수정 버튼 클릭
    if (event.target.closest('.edit-comment')) {
      const commentItem = event.target.closest('.comment-item');
      if (commentItem) {
        editComment(commentItem);
      }
    }

    // 댓글 삭제 버튼 클릭
    if (event.target.closest('.delete-comment')) {
      const commentItem = event.target.closest('.comment-item');
      if (commentItem) {
        deleteComment(commentItem);
      }
    }

    // 답글 수정 버튼 클릭
    if (event.target.closest('.edit-reply')) {
      const replyItem = event.target.closest('.reply-item');
      if (replyItem) {
        editReply(replyItem);
      }
    }

    // 답글 삭제 버튼 클릭
    if (event.target.closest('.delete-reply')) {
      const replyItem = event.target.closest('.reply-item');
      if (replyItem) {
        deleteReply(replyItem);
      }
    }
  });
});