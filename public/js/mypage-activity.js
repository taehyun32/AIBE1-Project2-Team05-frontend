async function fetchActivityData() {
    const nickname = sessionStorage.getItem('nickname');
    try {
        const response = await fetch(`/api/v1/users/${nickname}/activity`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result.data;  // Assuming the relevant data is in `result.data`
    } catch (error) {
        console.error('Error fetching activity data:', error);
        return null;
    }
}

function populateActivityData(activityData) {
    if (!activityData) {
        console.warn('No activity data to populate.');
        return;
    }

    populateTalentList(activityData.talents);
    populateCommunityPosts(activityData.posts);
    populateCommentList(activityData.comments);
    populateBookmarkList(activityData.bookmarks);
    populateLikeList(activityData.likes);
}

function populateTalentList(talents) {
    const talentList = document.getElementById('talent-list');
    if (!talentList) {
        console.warn('Talent list element not found.');
        return;
    }

    talentList.innerHTML = ''; // Clear existing content

    if (talents && talents.length > 0) {
        talents.forEach(talent => {
            const listItem = document.createElement('li');
            const date = convertUtcToKstDate(talent.createdAt);

            listItem.innerHTML = `
                <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div class="flex items-center text-xs text-gray-500 mb-1">
                        <span>${date}</span>
                    </div>
                    <div class="flex justify-between items-start">
                        <h3 class="font-medium">${talent.title}</h3>
                    </div>
                    <div class="flex flex-wrap gap-2 mt-2">
    ${talent.tags.map(tag =>
                `<span class="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">${tag}</span>`
            ).join('')}
                </div>

                    <p class="text-sm text-gray-600 mt-2">${talent.content}</p>
                </div>
            `;

            talentList.appendChild(listItem);
        });
    } else {
        talentList.innerHTML = '<p>등록된 재능이 없습니다.</p>';
    }
}

function populateCommunityPosts(posts) {
    const communityPostsList = document.getElementById('community-posts-list');
    if (!communityPostsList) {
        console.warn('Community posts list element not found.');
        return;
    }

    communityPostsList.innerHTML = ''; // Clear existing content

    if (posts && posts.length > 0) {
        posts.forEach(post => {
            const listItem = document.createElement('li');
            const date = convertUtcToKstDate(post.createdAt);
            listItem.innerHTML = `
                <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div class="flex items-center text-xs text-gray-500 mb-1">
                    <span>${date}</span>
                    <span>•</span>
                    <span>${post.categoryDisplayName}</span>
                    </div>  
                    <h3 class="font-medium  mb-2">${post.title}</h3>
                    <p class="text-sm text-gray-600 mb-3 line-clamp-2">${post.content}</p>
                    <!-- You can add more post details here -->
                    <div class="flex items-center justify-between text-sm text-gray-500">
                    <div class="flex items-center space-x-3">
                      <div class="flex items-center">
                        <div class="w-4 h-4 flex items-center justify-center mr-1">
                          <i class="ri-eye-line"></i>
                        </div>
                        <span>${post.viewCount}</span>
                      </div>
                      <div class="flex items-center">
                        <div class="w-4 h-4 flex items-center justify-center mr-1">
                          <i class="ri-heart-line"></i>
                        </div>
                        <span>${post.likeCount}</span>
                      </div>
                      <div class="flex items-center">
                        <div class="w-4 h-4 flex items-center justify-center mr-1">
                          <i class="ri-chat-1-line"></i>
                        </div>
                        <span>${post.commentCount}</span>
                      </div>
                    </div>
               </div>
            `;
            communityPostsList.appendChild(listItem);
        });
    } else {
        communityPostsList.innerHTML = '<p>작성한 게시글이 없습니다.</p>';
    }
}

function convertUtcToKstDate(utcString) {
    // 밀리초 이하가 너무 길면 JS에서 에러날 수 있으므로 .SSS까지만 사용
    const trimmed = utcString.replace(/(\.\d{3})\d+Z$/, "$1Z");

    // UTC 기준 Date 객체 생성
    const utcDate = new Date(trimmed);

    // KST = UTC + 9시간
    const kstDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);

    // 날짜 포맷팅: YYYY-MM-DD
    const yyyy = kstDate.getFullYear();
    const mm = String(kstDate.getMonth() + 1).padStart(2, "0");
    const dd = String(kstDate.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
}


function populateCommentList(comments) {
    const commentList = document.getElementById('comment-list');
    if (!commentList) {
        console.warn('Comment list element not found.');
        return;
    }

    commentList.innerHTML = ''; // Clear existing content

    if (comments && comments.length > 0) {
        comments.forEach(comment => {
            const listItem = document.createElement('li');
            const date = convertUtcToKstDate(comment.createdAt);
            listItem.innerHTML = `
                <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div class="flex items-center text-xs text-gray-500 mb-1">
                    <span class="font-medium text-primary mr-2">[${comment.categoryDisplayName}]</span> 
                    <span>${date}</span>
                    <span class="mx-1">•</span>
                    <span>댓글</span>
                  </div>
                  <h3 class="text-sm font-medium mb-2">
                    <span href="#" class="hover:text-primary">
                        "${comment.postTitle}" 게시글에 댓글
                    </span>
                  </h3>
                  <p class="text-sm text-gray-600">
                  ${comment.commentContent}
              </p>
              <!-- 하단 '자세히 보기' 버튼 -->
              <div class="w-full text-right">
                <a href="community-detail.html?postId=${comment.postId}" class="text-sm text-primary hover:underline">자세히 보기</a>
              </div>
              </div>
                    <!-- You can add more comment details here -->
                </div>
            `;
            commentList.appendChild(listItem);
        });
    } else {
        commentList.innerHTML = '<p>작성한 댓글이 없습니다.</p>';
    }
}

function populateBookmarkList(bookmarks) {
    const bookmarkList = document.getElementById('bookmark-list');
    if (!bookmarkList) {
        console.warn('Bookmark list element not found.');
        return;
    }

    bookmarkList.innerHTML = ''; // Clear existing content

    if (bookmarks && bookmarks.length > 0) {
        bookmarks.forEach(bookmark => {
            const listItem = document.createElement('li');
            const date = convertUtcToKstDate(bookmark.updatedAt);
            listItem.innerHTML = `
                <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div class="flex items-center text-xs text-gray-500 mb-1">
                    <span>${date}</span>
                    <span class="mx-1">•</span>
                    <span>${bookmark.type}</span>
                </div>
                    <h3 class="font-medium">${bookmark.title}</h3>
                    <p class="text-sm text-gray-600 mt-2">${bookmark.content}</p>
                    <!-- You can add more bookmark details here -->
                </div>
            `;
            bookmarkList.appendChild(listItem);
        });
    } else {
        bookmarkList.innerHTML = '<p>북마크한 게시글이 없습니다.</p>';
    }
}

function populateLikeList(likes) {
    const likeList = document.getElementById('like-list');
    if (!likeList) {
        console.warn('Like list element not found.');
        return;
    }

    likeList.innerHTML = ''; // Clear existing content

    if (likes && likes.length > 0) {
        likes.forEach(like => {
            const listItem = document.createElement('li');
            const date = convertUtcToKstDate(like.updatedAt);
            listItem.innerHTML = `
                <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div class="flex items-center text-xs text-gray-500 mb-1">
                        <span>${date}</span>
                        <span class="mx-1">•</span>
                        <span>${like.type}</span>
                    </div>
                    <h3 class="font-medium">${like.title}</h3>
                    <p class="text-sm text-gray-600 mt-2">${like.content}</p>
                    <!-- You can add more like details here -->
                </div>
            `;
            likeList.appendChild(listItem);
        });
    } else {
        likeList.innerHTML = '<p>좋아요한 게시글이 없습니다.</p>';
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    // Fetch and populate activity data after other DOM setup.
    const activityData = await fetchActivityData();
    populateActivityData(activityData);

});