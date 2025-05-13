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
      credentials: 'include'
    });

    console.log('사용자 정보 응답 상태:', response.status);

    if (!response.ok) {
      if (response.status === 401) {
        console.log('로그인되지 않음 - 게스트 모드 설정');
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
      const data = userData.data;

      // 원본 응답 데이터 로깅
      console.log('원본 사용자 데이터:', data);

      // ID 필드 확인 및 매핑
      // userId 또는 id 필드 중 하나를 사용
      const userId = data.id || data.userId;

      if (!userId) {
        console.warn('사용자 ID를 찾을 수 없습니다. 응답 데이터:', data);
      }

      currentUser = {
        isGuest: false,
        id: userId,
        nickname: data.nickname || data.name || '사용자',
        profileImage: data.profileImageUrl || data.profile_image_url || `https://i.pravatar.cc/40?u=${data.nickname || 'user'}`,
        provider: data.provider,
        providerId: data.providerId || data.provider_id,
        role: data.role
      };

      console.log('사용자 정보 설정 완료:', currentUser);
      updateCurrentUserProfileUI();
    } else {
      console.warn('API에서 유효한 사용자 데이터를 받지 못함:', userData);
      currentUser = {
        isGuest: true,
        nickname: '게스트',
        profileImage: 'https://i.pravatar.cc/40?u=guest'
      };
      handleGuestUser();
    }
  } catch (error) {
    console.error('사용자 정보 로드 실패:', error);
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

      console.log('로그인 확인 응답 데이터:', userData);

      if (userData && userData.data) {
        const data = userData.data;

        // ID 필드 확인
        const userId = data.id || data.userId;

        currentUser = {
          isGuest: false,
          id: userId,
          nickname: data.nickname || data.name || '사용자',
          profileImage: data.profileImageUrl || data.profileImage || `https://i.pravatar.cc/40?u=${data.nickname || 'user'}`,
          provider: data.provider,
          providerId: data.providerId
        };

        console.log("로그인 확인 완료:", currentUser);
        return true;
      }
    }

    // 로그인 실패 시 게스트 상태로 설정
    currentUser = {
      isGuest: true,
      nickname: '게스트',
      profileImage: 'https://i.pravatar.cc/40?u=guest'
    };
    console.log("비로그인 상태 확인:", currentUser);
    return false;
  } catch (error) {
    console.error('로그인 상태 확인 오류:', error);
    // 오류 발생 시 게스트로 간주
    currentUser = {
      isGuest: true,
      nickname: '게스트',
      profileImage: 'https://i.pravatar.cc/40?u=guest'
    };
    return false;
  }
}

// Interest enum 값을 표시 이름으로 변환
function getInterestDisplayName(interestValue) {
  const interestMap = {
    'WEB_DEV': '프로그래밍/웹개발',
    'APP_DEV': '프로그래밍/앱개발',
    'DESIGN_UX_UI': '디자인/UX/UI',
    'DESIGN_GRAPHIC': '디자인/그래픽',
    'EDUCATION_MATH': '교육/수학',
    'EDUCATION_ENGLISH': '교육/영어',
    'MUSIC_PIANO': '음악/피아노',
    'FITNESS_YOGA': '운동/요가'
  };

  return interestMap[interestValue] || interestValue || '분야 미지정';
}

// 직업 타이틀 생성 함수
function getJobTitle(interest, role) {
  if (interest) {
    // 특정 분야에 따른 직함 매핑
    switch(interest) {
      case 'WEB_DEV':
        return '웹 개발자';
      case 'APP_DEV':
        return '앱 개발자';
      case 'DESIGN_UX_UI':
        return 'UI/UX 디자이너';
      case 'DESIGN_GRAPHIC':
        return '그래픽 디자이너';
      case 'EDUCATION_MATH':
      case 'EDUCATION_ENGLISH':
        return '교육자';
      case 'MUSIC_PIANO':
        return '음악가';
      case 'FITNESS_YOGA':
        return '요가 강사';
      default:
        // 알 수 없는 관심사는 표시 이름으로 전환
        return getInterestDisplayName(interest);
    }
  }

  // interest가 없을 경우 role 기반 기본값
  if (role) {
    switch(role) {
      case 'ROLE_MENTOR':
        return '멘토';
      case 'ROLE_MENTEE':
        return '멘티';
      case 'ROLE_TEMP':
        return '임시 사용자';
      default:
        return '사용자';
    }
  }

  return '사용자';
}

// 프로필 이미지 업데이트
function updateCurrentUserProfileUI() {
  // 댓글 작성 버튼
  const commentSubmitBtn = document.getElementById('submitComment');
  if (commentSubmitBtn) {
    commentSubmitBtn.disabled = false;
    commentSubmitBtn.textContent = '댓글 작성';
  }
  // 댓글 입력 필드
  const commentInput = document.getElementById('commentInput');
  if (commentInput) {
    commentInput.placeholder = '댓글을 작성해주세요';
    commentInput.readOnly = false;
  }
}

// 게스트 사용자 처리
function handleGuestUser() {

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
  const commentSubmitBtn = document.getElementById('submitComment');
  if (commentSubmitBtn) {
    commentSubmitBtn.disabled = true;
    commentSubmitBtn.textContent = '로그인 필요';
  }
}

// URL에서 postId 가져오기
function getPostIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('postId');

  // URL 쿼리 파라미터에 없는 경우 URL 경로에서 추출 시도
  if (!postId) {
    const pathMatch = window.location.pathname.match(/\/community-detail\/([^\/]+)/);
    if (pathMatch && pathMatch[1]) {
      return pathMatch[1];
    }

    // html?postId= 형식 확인
    const htmlMatch = window.location.pathname.match(/\.html\?postId=([^&]+)/);
    if (htmlMatch && htmlMatch[1]) {
      return htmlMatch[1];
    }
  }

  return postId;
}

// 오류 화면 표시 함수
function showErrorView(message) {
  const postLoadingSkeleton = document.getElementById('postLoadingSkeleton');
  if (postLoadingSkeleton) {
    postLoadingSkeleton.style.display = 'none';
  }

  const postContent = document.getElementById('postContent');
  if (postContent) {
    postContent.classList.remove('hidden');
    postContent.innerHTML = `
      <div class="p-6 text-center">
        <div class="mb-4">
          <i class="ri-error-warning-line text-4xl text-gray-400"></i>
        </div>
        <h2 class="text-xl font-semibold mb-2">${message}</h2>
        <p class="text-gray-600 mb-4">잠시 후 다시 시도해주세요.</p>
        <button onclick="window.location.reload()" 
           class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
          새로고침
        </button>
      </div>
    `;
  }
}


// 게시글 렌더링 함수
function renderPostDetail(post) {
  console.log('게시글 렌더링 시작:', post);

  // 스켈레톤 UI 숨기기
  const postLoadingSkeleton = document.getElementById('postLoadingSkeleton');
  if (postLoadingSkeleton) {
    postLoadingSkeleton.style.display = 'none';
  }

  // 게시글 컨테이너 찾기
  const postContent = document.getElementById('postContent');
  if (!postContent) {
    console.error('postContent 요소를 찾을 수 없습니다.');
    return;
  }

  // 컨테이너 표시
  postContent.classList.remove('hidden');

  // DOM 요소 찾기 (null 체크 후 값 업데이트)
  const elements = {
    postDate: document.getElementById('postDate'),
    postCategory: document.getElementById('postCategory'),
    postTitle: document.getElementById('postTitle'),
    authorProfileImage: document.getElementById('authorProfileImage'),
    authorNickname: document.getElementById('authorNickname'),
    createdAt: document.getElementById('createdAt'),
    viewCount: document.getElementById('viewCount'),
    postContentBody: document.getElementById('postContentBody'),
    postImages: document.getElementById('postImages'),
    postTags: document.getElementById('postTags'),
    likeCount: document.getElementById('likeCount'),
    commentCount: document.getElementById('commentCount')
  };

  // 안전하게 요소 업데이트 (있을 경우만)
  if (elements.postDate) elements.postDate.textContent = new Date(post.createdAt).toLocaleDateString();
  if (elements.postCategory) elements.postCategory.textContent = getCategoryLabel(post.category);
  if (elements.postTitle) elements.postTitle.textContent = post.title;
  if (elements.authorProfileImage) elements.authorProfileImage.src = post.profileImageUrl || `https://i.pravatar.cc/40?u=${post.nickname}`;
  if (elements.authorNickname) elements.authorNickname.textContent = post.nickname;
  if (elements.createdAt) elements.createdAt.textContent = new Date(post.createdAt).toLocaleDateString();
  if (elements.viewCount) elements.viewCount.textContent = post.viewCount || 0;
  if (elements.postContentBody) elements.postContentBody.innerHTML = post.content;
  if (elements.likeCount) elements.likeCount.textContent = post.likeCount || 0;
  if (elements.commentCount) elements.commentCount.textContent = post.commentCount || 0;

  // 이미지 표시
  if (elements.postImages && post.imageUrls && post.imageUrls.length > 0) {
    elements.postImages.innerHTML = post.imageUrls.map(url => `
      <div class="mb-3">
        <img src="${url}" alt="게시글 이미지" class="rounded-md max-w-full">
      </div>
    `).join('');
  } else if (elements.postImages) {
    elements.postImages.style.display = 'none';
  }

  // 태그 표시
  if (elements.postTags && post.tags && post.tags.length > 0) {
    elements.postTags.innerHTML = post.tags.map(tag => `
      <span class="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
        #${tag}
      </span>
    `).join('');
  } else if (elements.postTags) {
    elements.postTags.style.display = 'none';
  }

  // 좋아요 상태 표시
  if (post.liked) {
    const likeIcon = document.getElementById('likeIcon');
    if (likeIcon) {
      likeIcon.classList.remove('ri-heart-line');
      likeIcon.classList.add('ri-heart-fill', 'text-red-500');
    }
  }

  // 북마크 상태 표시
  if (post.bookmarked) {
    const bookmarkIcon = document.getElementById('bookmarkIcon');
    if (bookmarkIcon) {
      bookmarkIcon.classList.remove('ri-bookmark-line');
      bookmarkIcon.classList.add('ri-bookmark-fill', 'text-primary');
    }
  }

  // 작성자가 현재 사용자인 경우 수정/삭제 버튼 표시
  const postActions = document.getElementById('postActions');
  if (postActions && !currentUser.isGuest && currentUser.id === post.userId) {
    postActions.classList.remove('hidden');
  }

  // 작성자 정보 업데이트 - 게시글 정보에서 필요한 데이터 추출하여 사용
  const authorInfo = {
    id: post.userId,
    nickname: post.nickname || '익명 사용자',
    profileImageUrl: post.profileImageUrl,
    role: post.role || 'ROLE_MENTEE',
    interest: post.interest || 'DESIGN_UX_UI', // 기본값 설정
    introduction: post.introduction || "자기소개가 등록되어 있지 않습니다."
  };

  console.log('작성자 정보 추출:', authorInfo);
  updateAuthorInfo(authorInfo);

  console.log('게시글 렌더링 완료');
}


// 카테고리 라벨 생성 함수 (추가됨)
function getCategoryLabel(category) {
  const categoryMap = {
    'QUESTION': '질문/답변',
    'INFO': '정보공유',
    'REVIEW': '후기',
    'FREE': '자유 게시판',
    'TALENT': '재능나눔'
  };

  return categoryMap[category] || category;
}

// 댓글 조회 함수
async function loadComments(postId) {
  try {
    console.log('댓글 조회 요청:', `/api/v1/community/${postId}/comments`);

    // 먼저 일반 API 시도
    let response = await fetch(`/api/v1/community/${postId}/comments`, {
      credentials: 'include'
    });

    // 401 오류 시 공개 API로 재시도 (만약 백엔드에서 제공한다면)
    if (response.status === 401) {
      console.log('댓글 조회에 인증이 필요합니다. 공개 조회로 전환합니다.');

      // 백엔드에 비로그인용 댓글 조회 API가 있는 경우
      response = await fetch(`/api/v1/community/public/${postId}/comments`);

      // 공개 API가 없거나 실패한 경우
      if (!response.ok) {
        // 비로그인 상태에서는 빈 댓글 목록 표시
        renderComments([], false, true);
        return;
      }
    } else if (!response.ok) {
      throw new Error(`댓글 조회 실패: ${response.status}`);
    }

    const data = await response.json();
    console.log('댓글 데이터:', data);

    if (data.status === 200 && data.data) {
      renderComments(data.data.content, data.data.hasNext, currentUser.isGuest);
    } else {
      console.warn('댓글 데이터 없음:', data);
      // 데이터가 없어도 댓글이 없는 UI를 표시해야 함
      renderComments([], false, currentUser.isGuest);
    }
  } catch (error) {
    console.error('댓글 조회 오류:', error);
    showToast('댓글을 불러오는 중 오류가 발생했습니다', 'error');
    // 오류가 발생해도 댓글이 없는 UI를 표시
    renderComments([], false, currentUser.isGuest);
  }
}

// 댓글 렌더링 함수에 비로그인 파라미터 추가
function renderComments(comments, hasNext, isGuest = false) {
  const commentsContainer = document.getElementById('commentsList');
  const totalComments = document.getElementById('totalComments');
  const loadMoreComments = document.getElementById('loadMoreComments');
  const commentInput = document.getElementById('commentInput');
  const submitComment = document.getElementById('submitComment');

  // DOM 요소가 없으면 일찍 반환
  if (!commentsContainer) {
    console.error('commentsList 요소를 찾을 수 없습니다.');
    return;
  }

  // 댓글 수 표시
  if (totalComments) {
    totalComments.textContent = comments ? comments.length : 0;
  }

  // 댓글 컨테이너 비우기
  commentsContainer.innerHTML = '';

  // 댓글이 없는 경우
  if (!comments || comments.length === 0) {
    commentsContainer.innerHTML = '<p class="text-center text-gray-500 py-4">아직 댓글이 없습니다. 첫 댓글을 작성해 보세요!</p>';
    if (loadMoreComments) {
      loadMoreComments.classList.add('hidden');
    }
  } else {
    // 댓글 렌더링
    comments.forEach(comment => {
      const commentHTML = createCommentHTML(comment);
      commentsContainer.insertAdjacentHTML('beforeend', commentHTML);
    });

    // 더 보기 버튼 표시 여부
    if (loadMoreComments) {
      if (hasNext) {
        loadMoreComments.classList.remove('hidden');
      } else {
        loadMoreComments.classList.add('hidden');
      }
    }
  }

  // 비로그인 상태일 때 댓글 작성 UI 수정
  if (isGuest) {
    if (commentInput) {
      commentInput.placeholder = '댓글을 작성하려면 로그인이 필요합니다';
      commentInput.readOnly = true;
      commentInput.addEventListener('click', function() {
        showToast('로그인이 필요합니다', 'info');
        setTimeout(() => {
          window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
        }, 1000);
      });
    }

    if (submitComment) {
      submitComment.disabled = true;
      submitComment.textContent = '로그인 필요';
    }
  } else {
    // 로그인 상태일 때는 정상 작성 가능
    if (commentInput) {
      commentInput.placeholder = '댓글을 작성해주세요';
      commentInput.readOnly = false;
    }

    if (submitComment) {
      submitComment.disabled = false;
      submitComment.textContent = '댓글 작성';
    }
  }
}

// AI 답변 조회
async function loadAiAnswer(postId) {
  try {
    const aiAnswerSection = document.getElementById('aiAnswerSection'); 
    const aiAnswerContent = document.getElementById('aiAnswerContent');  

    if (!aiAnswerSection || !aiAnswerContent) {
      console.warn('AI 답변 섹션 또는 컨텐츠 요소를 찾을 수 없습니다.');
      return;
    }

    // 기존 토글 버튼 제거 (재로드 시 중복 방지)
    const existingToggleButton = aiAnswerSection.querySelector('.ai-toggle-button');
    if (existingToggleButton) {
      existingToggleButton.remove();
    }

    const response = await fetch(`/api/v1/community/ai/${postId}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      // AI 답변이 없는 경우 또는 오류 시 섹션 숨김 처리 (기본 상태)
      aiAnswerSection.classList.add('hidden');
      console.log('AI 답변을 가져오지 못했거나 없습니다. 상태:', response.status);
      return;
    }
const result = await response.json();
    const aiAnswer = result.data?.Content || result.data?.content;

    if (aiAnswer && aiAnswer.trim() !== "") {
      aiAnswerContent.innerHTML = aiAnswer; // 서버에서 이미 안전하게 처리되었다고 가정합니다.
      aiAnswerSection.classList.remove('hidden');

      // 내용 길이에 따라 토글 기능 적용 여부 결정 
      const initialMaxHeight = 50; 
      const isContentOverflowing = aiAnswerContent.scrollHeight > initialMaxHeight;

      if (isContentOverflowing) {
        aiAnswerContent.classList.add('collapsed');
        aiAnswerContent.style.maxHeight = `${initialMaxHeight}px`;

        const toggleButton = document.createElement('button');
        toggleButton.textContent = '더 보기';
        toggleButton.className = 'ai-toggle-button text-sm text-primary hover:underline mt-2 focus:outline-none'; 

        toggleButton.addEventListener('click', () => {
          if (aiAnswerContent.classList.contains('collapsed')) {
            aiAnswerContent.classList.remove('collapsed');
            aiAnswerContent.classList.add('expanded');
            aiAnswerContent.style.maxHeight = `${aiAnswerContent.scrollHeight}px`;
            toggleButton.textContent = '간단히 보기';
          } else {
            aiAnswerContent.classList.remove('expanded');
            aiAnswerContent.classList.add('collapsed');
            aiAnswerContent.style.maxHeight = `${initialMaxHeight}px`;
            toggleButton.textContent = '더 보기';
            aiAnswerSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        });

        // 버튼을 aiAnswerContent 다음에 추가하거나, aiAnswerSection의 적절한 위치에 추가
        aiAnswerContent.parentNode.insertBefore(toggleButton, aiAnswerContent.nextSibling);
      } else {
        // 내용이 짧으면 토글 버튼을 만들지 않고, maxHeight 제한도 해제
        aiAnswerContent.style.maxHeight = 'none';
        aiAnswerContent.classList.remove('collapsed', 'expanded');
      }
    } else {
      // AI 답변 내용이 없는 경우 섹션 숨김
      aiAnswerSection.classList.add('hidden');
      console.log('AI 답변 내용이 비어있습니다.');
    }
  } catch (error) {
    console.error('AI 답변 조회 오류:', error);
    const aiAnswerSection = document.getElementById('aiAnswerSection');
    if (aiAnswerSection) {
      aiAnswerSection.classList.add('hidden'); // 오류 발생 시 AI 답변 섹션 숨김 상태 유지
    }
  }
}

// 댓글 HTML 생성 함수
function createCommentHTML(comment) {

  // 날짜 처리 - null이거나 유효하지 않은 경우 현재 날짜 사용
  let commentDate;
  try {
    commentDate = comment.createdAt ? new Date(comment.createdAt) : new Date();
    // 유효한 날짜인지 확인
    if (isNaN(commentDate.getTime())) {
      commentDate = new Date();
    }
  } catch (e) {
    commentDate = new Date();
  }

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
  let replyDate;
  try {
    replyDate = reply.createdAt ? new Date(reply.createdAt) : new Date();
    // 유효한 날짜인지 확인 (Invalid Date 체크)
    if (isNaN(replyDate.getTime())) {
      replyDate = new Date();
    }
  } catch (e) {
    replyDate = new Date();
  }

  const formattedDate = replyDate.toISOString().split('T')[0];
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
  if (event) event.preventDefault();

// 로깅을 통한 디버깅 강화
  console.log('댓글 제출 함수 시작');

  const commentInput = document.getElementById('commentInput');
  if (!commentInput) {
    console.error('댓글 입력 요소를 찾을 수 없습니다.');
    return;
  }
  const commentText = commentInput.value.trim();
  // 댓글 제출 핸들러 (계속)
  if (!commentText) {
    showToast('댓글 내용을 입력해주세요', 'warning');
    return;
  }
  console.log('댓글 내용 확인:', commentText);

  // 액션 전 로그인 상태 재확인
  const isLoggedIn = await checkCurrentLoginStatus();
  console.log('현재 로그인 상태:', isLoggedIn);

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

  console.log('게시글 ID 확인:', postId);

  const commentSubmitBtn = document.getElementById('submitComment');
  if (commentSubmitBtn) {
    commentSubmitBtn.disabled = true;
    commentSubmitBtn.textContent = '작성 중...';
  }

  // 임시 댓글 UI를 먼저 추가하여 사용자 경험 개선
  const tempCommentId = `temp-comment-${Date.now()}`;
  addTemporaryComment(tempCommentId, commentText);

  try {
    console.log('API 요청 준비:');
    console.log({
      commentContent: commentText,
      parentCommentId: null
    });


    const response = await fetch(`/api/v1/community/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // 쿠키 포함
      body: JSON.stringify({
        commentContent: commentText,
        parentCommentId: null
      })
    });

    // 401 오류 특별 처리
    if (response.status === 401) {
      // 현재 사용자 정보를 게스트로 재설정
      currentUser.isGuest = true;
      showToast('로그인 세션이 만료되었습니다. 다시 로그인해주세요.', 'info');
      setTimeout(() => {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
      }, 1500);
      return;
    }

    if (!response.ok) {
      throw new Error(`댓글 작성 실패: ${response.status}`);
    }

    const result = await response.json();
    console.log('댓글 작성 응답 데이터:', result);

    if (result.status === 201 || result.status === 200) {
      // 성공
      showToast('댓글이 작성되었습니다', 'success');
      commentInput.value = '';

      // 임시 댓글 제거 후 실제 댓글로 교체
      removeTemporaryComment(tempCommentId);

      // 댓글 목록 새로고침
      await loadComments(postId);

      // 게시글 댓글 수 업데이트 (선택적)
      try {
        const commentCount = document.getElementById('commentCount');
        if (commentCount) {
          commentCount.textContent = parseInt(commentCount.textContent || '0') + 1;
        }
      } catch (countError) {
        console.warn('댓글 수 업데이트 실패:', countError);
      }
    } else {
      showToast(result.message || '댓글 작성 중 오류가 발생했습니다', 'error');
    }
  } catch (error) {
    console.error('댓글 작성 오류:', error);
    showToast('댓글 작성 중 오류가 발생했습니다', 'error');
  } finally {
    // 버튼 상태 복원
    if (commentSubmitBtn) {
      commentSubmitBtn.disabled = false;
      commentSubmitBtn.textContent = '댓글 작성';
      console.log('댓글 제출 버튼 활성화');
    }
  }
}

// 임시 댓글 추가 함수
function addTemporaryComment(tempId, content) {
  const commentsContainer = document.getElementById('commentsList');

  if (!commentsContainer) {
    console.error('commentsList 요소를 찾을 수 없습니다!');
    return; // 일찍 반환해서 오류 방지
  }

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
  const noComments = document.querySelector('.no-comments');
  if (noComments) {
    noComments.style.display = 'none';
  }
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

  toast.className =
      `fixed top-4 left-1/2 -translate-x-1/2 z-50
     ${bgColor} ${textColor}
     px-4 py-3 rounded-md shadow-md flex items-center
     transition-all duration-300
     opacity-0 -translate-y-5`;

  toast.innerHTML = `${icon}${message}`;
  document.body.prepend(toast);

  // 등장 애니메이션
  requestAnimationFrame(() => {
    toast.classList.remove('opacity-0', '-translate-y-5');
  });

  // 3초 뒤 사라지기
  setTimeout(() => {
    toast.classList.add('opacity-0', '-translate-y-5');
    setTimeout(() => toast.remove(), 300);   // transition 끝난 뒤 제거
  }, 3000);
}
// 좋아요 토글 함수
async function handleLikeToggle(postId) {
  try {
    // 로그인 상태 확인
    if (currentUser.isGuest) {
      showToast('로그인이 필요한 기능입니다', 'info');
      setTimeout(() => {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
      }, 1500);
      return;
    }

    const likeIcon = document.getElementById('likeIcon');
    const likeCount = document.getElementById('likeCount');

    if (!likeIcon || !likeCount) {
      console.error('좋아요 버튼 또는 카운트 요소를 찾을 수 없습니다.');
      return;
    }

    // 현재 좋아요 상태 확인
    const isLiked = likeIcon.classList.contains('ri-heart-fill');

    // API URL 설정
    const apiUrl = `/api/v1/community/details/${postId}/like`;
    const method = 'POST';

    console.log(`좋아요 ${isLiked ? '취소' : '등록'} 요청 시작:`, {
      url: apiUrl,
      method: method
    });

    // API 요청 데이터 (필요한 경우)
    const requestBody = isLiked ? {} : {
      userId: currentUser.id,
      communityId: postId
    };

    // 헤더에 Content-Type 추가 및 credentials 포함
    const response = await fetch(apiUrl, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: method === 'POST' ? JSON.stringify(requestBody) : undefined
    });

    console.log('좋아요 응답 상태:', response.status);

    // 401 오류 특별 처리
    if (response.status === 401) {
      console.error('인증 오류 발생 - 자세한 응답:', response);

      showToast('로그인이 필요합니다. 다시 로그인해주세요.', 'info');
      setTimeout(() => {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
      }, 1500);
      return;
    }

    if (!response.ok) {
      throw new Error(`좋아요 처리 실패: ${response.status}`);
    }

    let data;
    try {
      data = await response.json();
      console.log('좋아요 응답 데이터:', data);
    } catch (e) {
      console.warn('응답을 JSON으로 파싱할 수 없습니다:', e);
      // 일부 API는 빈 응답을 반환할 수 있음 - 무시하고 진행
    }

    // UI 업데이트
    if (isLiked) {
      // 좋아요 취소
      likeIcon.classList.remove('ri-heart-fill', 'text-red-500');
      likeIcon.classList.add('ri-heart-line');
      likeCount.textContent = Math.max(0, parseInt(likeCount.textContent) - 1);
      showToast('좋아요를 취소했습니다', 'success');
    } else {
      // 좋아요 추가
      likeIcon.classList.remove('ri-heart-line');
      likeIcon.classList.add('ri-heart-fill', 'text-red-500');
      likeCount.textContent = parseInt(likeCount.textContent) + 1;
      showToast('좋아요를 눌렀습니다', 'success');
    }
  } catch (error) {
    console.error('좋아요 처리 오류:', error);
    showToast('좋아요 처리 중 오류가 발생했습니다', 'error');
  }
}

// 북마크 토글 함수
async function handleBookmarkToggle(postId) {
  try {
    // 로그인 상태 확인
    if (currentUser.isGuest) {
      showToast('로그인이 필요한 기능입니다', 'info');
      setTimeout(() => {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
      }, 1500);
      return;
    }

    const bookmarkIcon = document.getElementById('bookmarkIcon');

    if (!bookmarkIcon) {
      console.error('북마크 버튼 요소를 찾을 수 없습니다.');
      return;
    }

    // 현재 북마크 상태 확인
    const isBookmarked = bookmarkIcon.classList.contains('ri-bookmark-fill');

    // API URL 설정
    const apiUrl = `/api/v1/community/details/${postId}/bookmark`;
    const method = 'POST';

    console.log(`북마크 ${isBookmarked ? '취소' : '등록'} 요청 시작:`, {
      url: apiUrl,
      method: method
    });

    // API 요청 데이터 (필요한 경우)
    const requestBody = isBookmarked ? {} : {
      userId: currentUser.id,
      communityId: postId
    };

    // 헤더에 Content-Type 추가 및 credentials 포함
    const response = await fetch(apiUrl, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: method === 'POST' ? JSON.stringify(requestBody) : undefined
    });

    console.log('북마크 응답 상태:', response.status);

    // 401 오류 특별 처리
    if (response.status === 401) {
      console.error('인증 오류 발생 - 자세한 응답:', response);

      showToast('로그인이 필요합니다. 다시 로그인해주세요.', 'info');
      setTimeout(() => {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
      }, 1500);
      return;
    }

    if (!response.ok) {
      throw new Error(`북마크 처리 실패: ${response.status}`);
    }

    let data;
    try {
      data = await response.json();
      console.log('북마크 응답 데이터:', data);
    } catch (e) {
      console.warn('응답을 JSON으로 파싱할 수 없습니다:', e);
      // 일부 API는 빈 응답을 반환할 수 있음 - 무시하고 진행
    }

    // UI 업데이트
    if (isBookmarked) {
      // 북마크 취소
      bookmarkIcon.classList.remove('ri-bookmark-fill', 'text-primary');
      bookmarkIcon.classList.add('ri-bookmark-line');
      showToast('북마크를 취소했습니다', 'success');
    } else {
      // 북마크 추가
      bookmarkIcon.classList.remove('ri-bookmark-line');
      bookmarkIcon.classList.add('ri-bookmark-fill', 'text-primary');
      showToast('북마크에 추가했습니다', 'success');
    }
  } catch (error) {
    console.error('북마크 처리 오류:', error);
    showToast('북마크 처리 중 오류가 발생했습니다', 'error');
  }
}

// 게시글 삭제 함수
async function deletePost(postId) {
  try {
    // 로딩 인디케이터 표시
    showToast('게시글을 삭제 중입니다...', 'info');

    const response = await fetch(`/api/v1/community/${postId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 401) {
        showToast('로그인이 필요합니다. 다시 로그인해주세요.', 'error');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
        return;
      }

      if (response.status === 403) {
        showToast('게시글을 삭제할 권한이 없습니다.', 'error');
        return;
      }

      throw new Error(`게시글 삭제 실패: ${response.status}`);
    }

    showToast('게시글이 삭제되었습니다', 'success');

    // 게시글 목록 페이지로 이동
    setTimeout(() => {
      window.location.href = '/community';
    }, 1500);
  } catch (error) {
    console.error('게시글 삭제 오류:', error);
    showToast('게시글 삭제 중 오류가 발생했습니다', 'error');
  }
}
// 작성자 정보 업데이트 함수 - 수정 버전
function updateAuthorInfo(post) {
  console.log('작성자 정보 업데이트 시작:', post);

  // ID 기반 요소 접근
  const sidebarAuthorProfile = document.getElementById('sidebarAuthorProfile');
  const sidebarAuthorNickname = document.getElementById('sidebarAuthorNickname');
  const sidebarAuthorJob = document.getElementById('sidebarAuthorJob');
  const sidebarAuthorBio = document.getElementById('sidebarAuthorBio');
  const authorOtherPosts = document.getElementById('authorOtherPosts');

  // 요소가 없으면 콘솔에 경고
  if (!sidebarAuthorProfile) console.warn('사이드바 프로필 이미지 요소를 찾을 수 없습니다.');
  if (!sidebarAuthorNickname) console.warn('사이드바 닉네임 요소를 찾을 수 없습니다.');
  if (!sidebarAuthorJob) console.warn('사이드바 직업 요소를 찾을 수 없습니다.');
  if (!sidebarAuthorBio) console.warn('사이드바 소개 요소를 찾을 수 없습니다.');

  // 프로필 이미지 업데이트
  if (sidebarAuthorProfile) {
    const profileUrl = post.profileImageUrl || post.profile_image_url;
    sidebarAuthorProfile.src = profileUrl || `https://i.pravatar.cc/40?u=${post.nickname}`;
    sidebarAuthorProfile.alt = `${post.nickname}의 프로필`;
    console.log('프로필 이미지 설정:', sidebarAuthorProfile.src);
  }

  // 닉네임 업데이트
  if (sidebarAuthorNickname) {
    sidebarAuthorNickname.textContent = post.nickname || '익명 사용자';
    console.log('닉네임 설정:', sidebarAuthorNickname.textContent);
  }

  // 직업/직함 업데이트
  if (sidebarAuthorJob) {
    sidebarAuthorJob.textContent = getJobTitle(post.interest, post.role);
    console.log('직업 설정:', sidebarAuthorJob.textContent);
  }

  // 소개글 업데이트
  if (sidebarAuthorBio) {
    sidebarAuthorBio.textContent = post.introduction ||
        "자기소개가 등록되어 있지 않습니다.";
    console.log('소개글 설정:', sidebarAuthorBio.textContent);
  }

  // 작성자 다른 글 보기 링크 업데이트
  if (authorOtherPosts) {
    authorOtherPosts.href = `/community?author=${post.nickname}`;
    console.log('작성자 다른 글 링크 설정:', authorOtherPosts.href);
  }

  console.log('작성자 정보 업데이트 완료');
}
// 작성자 상세 정보 가져오기 - DB 구조에 맞게 수정
async function fetchAuthorDetails(nickname) {
  if (!nickname) {
    console.warn('작성자 ID가 제공되지 않았습니다');
    return null;
  }

  try {
    console.log('작성자 상세 정보 요청 시작:', nickname);

    // 실제 API 호출
    const response = await fetch(`/api/v1/users/${nickname}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    // 인증 오류 시 null 반환
    if (response.status === 401) {
      console.warn('작성자 정보 접근 권한이 없습니다 (401)');
      return null;
    }

    if (!response.ok) {
      throw new Error(`작성자 정보 로드 실패: ${response.status}`);
    }

    const data = await response.json();
    console.log('작성자 상세 정보 응답:', data);

    if (data.status === 200 && data.data) {
      return data.data;
    }

    return null;
  } catch (error) {
    console.error('작성자 정보 로드 오류:', error);
    return null;
  }
}

// 게시글 로드 및 작성자 정보 처리
async function loadPostDetail(postId) {
  try {
    console.log('게시글 상세 정보 로드 시작:', postId);

    // 게시글 데이터 로드
    const url = `/api/v1/community/detail/${postId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`게시글 로드 실패: ${response.status}`);
    }

    const data = await response.json();
    console.log('게시글 데이터:', data);

    if (data.status === 200 && data.data) {
      const post = data.data;

      // 게시글 렌더링 - 추가 API 호출 없이 바로 표시
      renderPostDetail(post);

      // AI 답변 확인 (질문/답변 카테고리인 경우)
      if (post.category === 'QUESTION') {
        loadAiAnswer(postId);     
      }

      // 부가 정보가 있으면 비동기적으로 업데이트 (UI는 먼저 표시)
      if (post.userId) {
        try {
          // 백그라운드에서 작성자 상세 정보 로드 시도
          const authorDetails = await fetchAuthorDetails(post.nickname);

          if (authorDetails) {
            console.log('추가 작성자 정보 로드 성공:', authorDetails);

            // 추가 정보로 작성자 정보 업데이트
            const updatedAuthorInfo = {
              ...post,
              introduction: authorDetails.introduction,
              interest: authorDetails.interest,
              role: authorDetails.role || post.role,
              profileImageUrl: authorDetails.profileImageUrl || post.profileImageUrl
            };

            // UI 갱신
            updateAuthorInfo(updatedAuthorInfo);
          }
        } catch (authorError) {
          console.warn('작성자 추가 정보 로드 실패, 기본 정보로 계속:', authorError);
          // 오류가 발생해도 UI는 이미 기본 정보로 표시된 상태이므로 추가 처리 불필요
        }
      }
    } else {
      console.error('게시글 데이터 없음:', data);
      showToast('게시글을 불러올 수 없습니다', 'error');

      // 스켈레톤 UI 숨기기
      const postLoadingSkeleton = document.getElementById('postLoadingSkeleton');
      if (postLoadingSkeleton) {
        postLoadingSkeleton.style.display = 'none';
      }

      // 에러 메시지 표시
      const postContent = document.getElementById('postContent');
      if (postContent) {
        postContent.classList.remove('hidden');
        postContent.innerHTML = `
          <div class="text-center py-8">
            <div class="text-gray-400 text-5xl mb-4">
              <i class="ri-error-warning-line"></i>
            </div>
            <h2 class="text-xl font-semibold mb-2">게시글을 불러올 수 없습니다</h2>
            <p class="text-gray-600">존재하지 않거나 접근할 수 없는 게시글입니다.</p>
          </div>
        `;
      }
    }
  } catch (error) {
    console.error('게시글 로드 오류:', error);
    showToast('게시글을 불러오는 중 오류가 발생했습니다', 'error');

    // 스켈레톤 UI 숨기기
    const postLoadingSkeleton = document.getElementById('postLoadingSkeleton');
    if (postLoadingSkeleton) {
      postLoadingSkeleton.style.display = 'none';
    }

    // 에러 메시지 표시
    const postContent = document.getElementById('postContent');
    if (postContent) {
      postContent.classList.remove('hidden');
      postContent.innerHTML = `
        <div class="text-center py-8">
          <div class="text-gray-400 text-5xl mb-4">
            <i class="ri-error-warning-line"></i>
          </div>
          <h2 class="text-xl font-semibold mb-2">게시글을 불러올 수 없습니다</h2>
          <p class="text-gray-600">오류: ${error.message}</p>
          <button onclick="window.location.reload()" class="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-600">
            다시 시도
          </button>
        </div>
      `;
    }
  }
}
// 이벤트 리스너
document.addEventListener('DOMContentLoaded', async function() {
  try {
    // 현재 사용자 정보 로드
    await loadCurrentUser();

    // 게시글 ID 가져오기
    const postId = getPostIdFromUrl();
    if (!postId) {
      showToast('게시글 정보를 찾을 수 없습니다', 'error');
      return;
    }

    // 게시글 상세 정보 로드 (작성자 정보 포함)
    await loadPostDetail(postId);

    // 댓글 목록 로드
    await loadComments(postId);

    // 댓글 작성 이벤트 리스너
    const submitComment = document.getElementById('submitComment');
    if (submitComment) {
      submitComment.addEventListener('click', function(event) {
        if (event) event.preventDefault();

        if (currentUser.isGuest) {
          showToast('로그인이 필요한 기능입니다', 'info');
          setTimeout(() => {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
          }, 1000);
          return;
        }

        handleCommentSubmit();
      });
    }

    // 댓글 입력창 엔터키 이벤트
    const commentInput = document.getElementById('commentInput');
    if (commentInput) {
      commentInput.addEventListener('keydown', function(e) {
        // Ctrl+Enter 또는 Command+Enter로 제출
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          if (!currentUser.isGuest) {
            handleCommentSubmit();
          } else {
            showToast('로그인이 필요한 기능입니다', 'info');
            setTimeout(() => {
              window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
            }, 1000);
          }
        }
      });
    }

    // 좋아요 버튼 이벤트 리스너
    const likeButton = document.getElementById('likeButton');
    if (likeButton) {
      likeButton.addEventListener('click', function() {
        if (currentUser.isGuest) {
          showToast('로그인이 필요한 기능입니다', 'info');
          setTimeout(() => {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
          }, 1000);
          return;
        }

        handleLikeToggle(postId);
      });
    }

    // 북마크 버튼 이벤트 리스너 (계속)
    const bookmarkButton = document.getElementById('bookmarkButton');
    if (bookmarkButton) {
      bookmarkButton.addEventListener('click', function() {
        if (currentUser.isGuest) {
          showToast('로그인이 필요한 기능입니다', 'info');
          setTimeout(() => {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
          }, 1000);
          return;
        }

        handleBookmarkToggle(postId);
      });
    }

    // 수정/삭제 버튼 이벤트 리스너
    const editPostBtn = document.getElementById('editPostBtn');
    const deletePostBtn = document.getElementById('deletePostBtn');

    if (editPostBtn) {
      editPostBtn.addEventListener('click', function() {
        window.location.href = `/community/edit?postId=${postId}`;
      });
    }

    if (deletePostBtn) {
      deletePostBtn.addEventListener('click', function() {
        if (confirm('정말 이 게시글을 삭제하시겠습니까?')) {
          deletePost(postId);
        }
      });
    }

    // 공유 버튼 이벤트 리스너
    const shareButton = document.getElementById('shareButton');
    const shareToast = document.getElementById('shareToast');
    if (shareButton) {
      shareButton.addEventListener('click', function() {
        navigator.clipboard.writeText(window.location.href)
            .then(() => {
              if (shareToast) {
                shareToast.classList.remove('hidden');
                shareToast.classList.remove('opacity-0');
                setTimeout(() => {
                  shareToast.classList.add('opacity-0');
                  setTimeout(() => {
                    shareToast.classList.add('hidden');
                  }, 300);
                }, 2000);
              } else {
                showToast('URL이 클립보드에 복사되었습니다', 'success');
              }
            })
            .catch(() => {
              showToast('URL 복사에 실패했습니다', 'error');
            });
      });
    }

    // 목록으로 버튼 이벤트 리스너
    const backToListBtn = document.querySelector('button[onclick*="location.href=\'/community\'"]');
    if (backToListBtn) {
      // 기존 인라인 onclick 제거
      backToListBtn.removeAttribute('onclick');
      // 새 이벤트 리스너 추가
      backToListBtn.addEventListener('click', function() {
        window.location.href = '/community';
      });
    }

    // 이벤트 위임을 통한 댓글 관련 버튼 처리
    document.addEventListener('click', function(event) {
      // 비로그인 상태에서는 모든 인터랙션 로그인 필요 메시지 표시
      if (currentUser.isGuest) {
        if (event.target.closest('.reply-button') ||
            event.target.closest('.edit-comment') ||
            event.target.closest('.delete-comment') ||
            event.target.closest('.edit-reply') ||
            event.target.closest('.delete-reply')) {
          showToast('로그인이 필요합니다', 'info');
          setTimeout(() => {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
          }, 1000);
          return;
        }
      }

      // 답글 버튼 클릭
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

      // 댓글 취소 버튼 클릭
      if (event.target.closest('.cancel-edit')) {
        const editForm = event.target.closest('.edit-form');
        if (editForm) {
          const contentElement = editForm.closest('.comment-content, .reply-content');
          if (contentElement) {
            contentElement.querySelector('p').style.display = 'block';
            editForm.remove();
          }
        }
      }

      // 답글 취소 버튼 클릭
      if (event.target.closest('.cancel-reply')) {
        const replyForm = event.target.closest('.reply-form');
        if (replyForm) {
          replyForm.remove();
        }
      }
    });

    // 이벤트 바인딩 오류가 없는지 확인
    validateEventBindings();

    console.log('페이지 초기화 완료');
  } catch (error) {
    console.error('페이지 초기화 중 오류 발생:', error);
    showToast('페이지를 불러오는 중 오류가 발생했습니다', 'error');
  }
});

// 이벤트 바인딩 유효성 검사
function validateEventBindings() {
  const criticalElements = [
    { id: 'submitComment', name: '댓글 제출 버튼' },
    { id: 'likeButton', name: '좋아요 버튼' },
    { id: 'bookmarkButton', name: '북마크 버튼' },
    { id: 'shareButton', name: '공유 버튼' }
  ];

  criticalElements.forEach(element => {
    const el = document.getElementById(element.id);
    if (!el) {
      console.warn(`주요 UI 요소를 찾을 수 없습니다: ${element.name} (ID: ${element.id})`);
    }
  });

  // 작성자 정보 요소 확인
  const authorInfoElements = [
    { id: 'sidebarAuthorProfile', name: '작성자 프로필 이미지' },
    { id: 'sidebarAuthorNickname', name: '작성자 닉네임' },
    { id: 'sidebarAuthorJob', name: '작성자 직업' },
    { id: 'sidebarAuthorBio', name: '작성자 소개' },
    { id: 'authorOtherPosts', name: '작성자 다른 글 링크' }
  ];

  authorInfoElements.forEach(element => {
    const el = document.getElementById(element.id);
    if (!el) {
      console.warn(`작성자 정보 요소를 찾을 수 없습니다: ${element.name} (ID: ${element.id})`);
    }
  });
}