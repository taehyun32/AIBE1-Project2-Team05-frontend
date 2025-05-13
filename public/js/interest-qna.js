document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const nickname = sessionStorage.getItem('nickname');
    const contentList = document.getElementById('content-list');

    if (type !== 'interest-qna') return;
    if (!nickname || !contentList) return;

    try {
        const response = await fetch(`/api/v1/users/${nickname}/matching/more-details?type=interest-qna&page=0&size=10`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });

        const result = await response.json();
        const posts = result?.data?.content || [];

        if (posts.length === 0) {
            contentList.innerHTML = '<p class="text-gray-500">추천된 질문/답변 게시글이 없습니다.</p>';
            return;
        }

        posts.forEach(post => {
            const card = document.createElement('div');
            card.className = 'review-card border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer';

            const tagHTML = (post.tags || []).map(tag =>
                `<span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded mr-2">#${tag}</span>`
            ).join('');

            card.innerHTML = `
        <div class="flex justify-between items-start">
          <div class="flex gap-3">
            <div class="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
              <img src="${post.profileImageUrl}" alt="프로필" class="w-full h-full object-cover">
            </div>
            <div>
              <p class="text-sm font-medium text-gray-800">${post.nickname}</p>
              <p class="text-xs text-gray-500">${new Date(post.createdAt).toLocaleDateString()} · 질문/답변</p>
              <h3 class="font-semibold text-base mt-1">${post.title}</h3>
              <p class="text-sm text-gray-700 mt-1 line-clamp-2">${post.content}</p>
              <div class="mt-2 flex flex-wrap gap-1">${tagHTML}</div>
            </div>
          </div>
          <span class="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full whitespace-nowrap">
            답변 ${post.commentCount}개
          </span>
        </div>
      `;

            card.onclick = () => window.location.href = `/community-detail.html?id=${post.postId}`;
            contentList.appendChild(card);
        });

    } catch (err) {
        console.error("❌ QnA 더보기 API 호출 실패:", err);
        contentList.innerHTML = '<p class="text-red-500">데이터를 불러오지 못했습니다.</p>';
    }
});
