document.addEventListener('DOMContentLoaded', function() {
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
  
  // 댓글 ID 카운터 (실제 구현에서는 서버에서 관리)
  let commentIdCounter = 3; // 이미 2개의 댓글이 있으므로 3부터 시작
  
  // 현재 사용자 정보 (실제 구현에서는 서버에서 가져옴)
  const currentUser = {
    id: 'user123',
    name: '현재 사용자',
    profileImage: 'https://readdy.ai/api/search-image?query=professional%20asian%20male%20portrait%2C%20neutral%20background%2C%20professional%20looking%2C%20high%20quality&width=100&height=100&seq=1&orientation=squarish'
  };
  
  // 댓글 작성 기능
  submitComment.addEventListener('click', function() {
    const commentText = commentInput.value.trim();
    if (commentText) {
      addNewComment(commentText);
      commentInput.value = '';
      
      // 댓글 수 업데이트
      updateCommentCount(1);
    }
  });
  
  // 새 댓글 추가 함수
  function addNewComment(text) {
    const commentId = commentIdCounter++;
    const now = new Date();
    const dateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    const commentHtml = `
      <div class="comment-item" data-comment-id="${commentId}">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
            <img
              src="${currentUser.profileImage}"
              alt="프로필"
              class="w-full h-full object-cover"
            />
          </div>
          <div class="flex-1">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-medium">${currentUser.name}</h3>
                <div class="text-xs text-gray-500">${dateString}</div>
              </div>
              <div class="comment-actions">
                <button class="text-gray-500 hover:text-primary edit-comment">
                  <i class="ri-edit-line"></i>
                </button>
                <button class="text-gray-500 hover:text-red-500 delete-comment">
                  <i class="ri-delete-bin-line"></i>
                </button>
              </div>
            </div>
            <div class="comment-content mt-1">
              <p class="text-gray-700">
                ${text}
              </p>
            </div>
            <div class="comment-edit-form hidden mt-2">
              <textarea class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none" rows="3">${text}</textarea>
              <div class="flex justify-end mt-2 space-x-2">
                <button class="bg-gray-200 text-gray-700 px-3 py-1 rounded-button hover:bg-gray-300 cancel-edit">취소</button>
                <button class="bg-primary text-white px-3 py-1 rounded-button hover:bg-indigo-600 save-edit">저장</button>
              </div>
            </div>
            <div class="flex items-center gap-4 mt-2">
              <button class="text-xs text-gray-500 hover:text-primary reply-button">
                답글 달기
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // 댓글 목록 맨 위에 새 댓글 추가
    commentsList.insertAdjacentHTML('afterbegin', commentHtml);
    
    // 새로 추가된 댓글에 이벤트 리스너 연결
    const newComment = commentsList.querySelector(`[data-comment-id="${commentId}"]`);
    attachCommentEventListeners(newComment);
  }
  
  // 댓글 수 업데이트 함수
  function updateCommentCount(change) {
    const currentTotal = parseInt(totalComments.textContent);
    const newTotal = currentTotal + change;
    totalComments.textContent = newTotal;
    commentCount.textContent = newTotal;
  }
  
  // 댓글 수정 및 삭제 기능
  function attachCommentEventListeners(commentElement) {
    // 댓글 호버 시 수정/삭제 버튼 표시
    commentElement.addEventListener('mouseenter', function() {
      const actionsElement = this.querySelector('.comment-actions');
      if (actionsElement) {
        actionsElement.classList.remove('hidden');
      }
    });
    
    commentElement.addEventListener('mouseleave', function() {
      const actionsElement = this.querySelector('.comment-actions');
      if (actionsElement) {
        actionsElement.classList.add('hidden');
      }
    });
    
    // 수정 버튼 클릭
    const editButton = commentElement.querySelector('.edit-comment');
    if (editButton) {
      editButton.addEventListener('click', function() {
        const commentItem = this.closest('.comment-item');
        const contentElement = commentItem.querySelector('.comment-content');
        const editFormElement = commentItem.querySelector('.comment-edit-form');
        
        contentElement.classList.add('hidden');
        editFormElement.classList.remove('hidden');
      });
    }
    
    // 수정 취소 버튼 클릭
    const cancelEditButton = commentElement.querySelector('.cancel-edit');
    if (cancelEditButton) {
      cancelEditButton.addEventListener('click', function() {
        const commentItem = this.closest('.comment-item');
        const contentElement = commentItem.querySelector('.comment-content');
        const editFormElement = commentItem.querySelector('.comment-edit-form');
        
        contentElement.classList.remove('hidden');
        editFormElement.classList.add('hidden');
      });
    }
    
    // 수정 저장 버튼 클릭
    const saveEditButton = commentElement.querySelector('.save-edit');
    if (saveEditButton) {
      saveEditButton.addEventListener('click', function() {
        const commentItem = this.closest('.comment-item');
        const contentElement = commentItem.querySelector('.comment-content p');
        const editFormElement = commentItem.querySelector('.comment-edit-form');
        const textarea = editFormElement.querySelector('textarea');
        
        const newText = textarea.value.trim();
        if (newText) {
          contentElement.textContent = newText;
          commentItem.querySelector('.comment-content').classList.remove('hidden');
          editFormElement.classList.add('hidden');
        }
      });
    }
    
    // 삭제 버튼 클릭
    const deleteButton = commentElement.querySelector('.delete-comment');
    if (deleteButton) {
      deleteButton.addEventListener('click', function() {
        if (confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
          const commentItem = this.closest('.comment-item');
          commentItem.remove();
          
          // 댓글 수 업데이트
          updateCommentCount(-1);
        }
      });
    }
    
    // 답글 달기 버튼 클릭
    const replyButton = commentElement.querySelector('.reply-button');
    if (replyButton) {
      replyButton.addEventListener('click', function() {
        const commentItem = this.closest('.comment-item');
        
        // 이미 답글 폼이 있는지 확인
        let replyForm = commentItem.querySelector('.reply-form');
        
        // 답글 폼이 없으면 생성
        if (!replyForm) {
          const replyFormHtml = `
            <div class="reply-form ml-12 mt-4">
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                  <img
                    src="${currentUser.profileImage}"
                    alt="내 프로필"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div class="flex-1">
                  <textarea
                    placeholder="답글을 작성해주세요"
                    class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-sm"
                    rows="2"
                  ></textarea>
                  <div class="flex justify-end mt-2 space-x-2">
                    <button class="bg-gray-200 text-gray-700 px-3 py-1 rounded-button text-xs hover:bg-gray-300 cancel-reply">취소</button>
                    <button class="bg-primary text-white px-3 py-1 rounded-button text-xs hover:bg-indigo-600 submit-reply">답글 작성</button>
                  </div>
                </div>
              </div>
            </div>
          `;
          
          commentItem.insertAdjacentHTML('beforeend', replyFormHtml);
          replyForm = commentItem.querySelector('.reply-form');
          
          // 답글 취소 버튼 이벤트
          const cancelReplyButton = replyForm.querySelector('.cancel-reply');
          cancelReplyButton.addEventListener('click', function() {
            replyForm.remove();
          });
          
          // 답글 작성 버튼 이벤트
          const submitReplyButton = replyForm.querySelector('.submit-reply');
          submitReplyButton.addEventListener('click', function() {
            const replyText = replyForm.querySelector('textarea').value.trim();
            if (replyText) {
              addNewReply(commentItem, replyText);
              replyForm.remove();
              
              // 댓글 수 업데이트
              updateCommentCount(1);
            }
          });
        } else {
          // 이미 답글 폼이 있으면 토글
          replyForm.classList.toggle('hidden');
        }
      });
    }
  }
  
  // 새 답글 추가 함수
  function addNewReply(commentItem, text) {
    const replyId = commentIdCounter++;
    const now = new Date();
    const dateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    // 답글 목록 컨테이너 찾기 또는 생성
    let repliesContainer = commentItem.querySelector('.ml-12.mt-4.space-y-4');
    if (!repliesContainer) {
      commentItem.insertAdjacentHTML('beforeend', '<div class="ml-12 mt-4 space-y-4"></div>');
      repliesContainer = commentItem.querySelector('.ml-12.mt-4.space-y-4');
    }
    
    const replyHtml = `
      <div class="reply-item" data-reply-id="${replyId}">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
            <img
              src="${currentUser.profileImage}"
              alt="프로필"
              class="w-full h-full object-cover"
            />
          </div>
          <div class="flex-1">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-medium text-sm">${currentUser.name}</h3>
                <div class="text-xs text-gray-500">${dateString}</div>
              </div>
              <div class="reply-actions">
                <button class="text-gray-500 hover:text-primary edit-reply">
                  <i class="ri-edit-line"></i>
                </button>
                <button class="text-gray-500 hover:text-red-500 delete-reply">
                  <i class="ri-delete-bin-line"></i>
                </button>
              </div>
            </div>
            <div class="reply-content mt-1">
              <p class="text-sm text-gray-700">
                ${text}
              </p>
            </div>
            <div class="reply-edit-form hidden mt-2">
              <textarea class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-sm" rows="3">${text}</textarea>
              <div class="flex justify-end mt-2 space-x-2">
                <button class="bg-gray-200 text-gray-700 px-3 py-1 rounded-button text-xs hover:bg-gray-300 cancel-edit">취소</button>
                <button class="bg-primary text-white px-3 py-1 rounded-button text-xs hover:bg-indigo-600 save-edit">저장</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    repliesContainer.insertAdjacentHTML('beforeend', replyHtml);
    
    // 새로 추가된 답글에 이벤트 리스너 연결
    const newReply = repliesContainer.querySelector(`[data-reply-id="${replyId}"]`);
    attachReplyEventListeners(newReply);
  }
  
  // 답글 수정 및 삭제 기능
  function attachReplyEventListeners(replyElement) {
    // 답글 호버 시 수정/삭제 버튼 표시
    replyElement.addEventListener('mouseenter', function() {
      const actionsElement = this.querySelector('.reply-actions');
      if (actionsElement) {
        actionsElement.classList.remove('hidden');
      }
    });
    
    replyElement.addEventListener('mouseleave', function() {
      const actionsElement = this.querySelector('.reply-actions');
      if (actionsElement) {
        actionsElement.classList.add('hidden');
      }
    });
    
    // 수정 버튼 클릭
    const editButton = replyElement.querySelector('.edit-reply');
    if (editButton) {
      editButton.addEventListener('click', function() {
        const replyItem = this.closest('.reply-item');
        const contentElement = replyItem.querySelector('.reply-content');
        const editFormElement = replyItem.querySelector('.reply-edit-form');
        
        contentElement.classList.add('hidden');
        editFormElement.classList.remove('hidden');
      });
    }
    
    // 수정 취소 버튼 클릭
    const cancelEditButton = replyElement.querySelector('.cancel-edit');
    if (cancelEditButton) {
      cancelEditButton.addEventListener('click', function() {
        const replyItem = this.closest('.reply-item');
        const contentElement = replyItem.querySelector('.reply-content');
        const editFormElement = replyItem.querySelector('.reply-edit-form');
        
        contentElement.classList.remove('hidden');
        editFormElement.classList.add('hidden');
      });
    }
    
    // 수정 저장 버튼 클릭
    const saveEditButton = replyElement.querySelector('.save-edit');
    if (saveEditButton) {
      saveEditButton.addEventListener('click', function() {
        const replyItem = this.closest('.reply-item');
        const contentElement = replyItem.querySelector('.reply-content p');
        const editFormElement = replyItem.querySelector('.reply-edit-form');
        const textarea = editFormElement.querySelector('textarea');
        
        const newText = textarea.value.trim();
        if (newText) {
          contentElement.textContent = newText;
          replyItem.querySelector('.reply-content').classList.remove('hidden');
          editFormElement.classList.add('hidden');
        }
      });
    }
    
    // 삭제 버튼 클릭
    const deleteButton = replyElement.querySelector('.delete-reply');
    if (deleteButton) {
      deleteButton.addEventListener('click', function() {
        if (confirm('정말로 이 답글을 삭제하시겠습니까?')) {
          const replyItem = this.closest('.reply-item');
          replyItem.remove();
          
          // 댓글 수 업데이트
          updateCommentCount(-1);
        }
      });
    }
  }
  
  // 좋아요 기능
  let isLiked = false;
  
  likeButton.addEventListener('click', function() {
    isLiked = !isLiked;
    
    if (isLiked) {
      likeIcon.classList.remove('ri-heart-line');
      likeIcon.classList.add('ri-heart-fill');
      likeIcon.style.color = '#ef4444'; // 빨간색
      likeCount.textContent = parseInt(likeCount.textContent) + 1;
    } else {
      likeIcon.classList.remove('ri-heart-fill');
      likeIcon.classList.add('ri-heart-line');
      likeIcon.style.color = ''; // 기본 색상으로 복원
      likeCount.textContent = parseInt(likeCount.textContent) - 1;
    }
  });
  
  // 기존 댓글에 이벤트 리스너 연결
  document.querySelectorAll('.comment-item').forEach(function(comment) {
    attachCommentEventListeners(comment);
  });
  
  // 기존 답글에 이벤트 리스너 연결
  document.querySelectorAll('.reply-item').forEach(function(reply) {
    attachReplyEventListeners(reply);
  });
  
  // 더보기 버튼 클릭 이벤트
  const loadMoreButton = document.getElementById('loadMoreComments');
  if (loadMoreButton) {
    loadMoreButton.addEventListener('click', function() {
      // 실제 구현에서는 서버에서 추가 댓글을 가져옴
      alert('추가 댓글을 로드합니다. (실제 구현에서는 서버에서 가져옵니다)');
    });
  }
});