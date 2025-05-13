document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const nickname = sessionStorage.getItem('nickname');
    const contentList = document.getElementById('content-list');

    if (type !== 'my-talents') return;

    if (!nickname || !contentList) {
        console.error('닉네임 또는 content-list가 없습니다.');
        return;
    }

    try {
        const response = await fetch(`/api/v1/users/${nickname}/activity/more-details?type=my-talents&page=0&size=10`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });

        const result = await response.json();
        const items = result?.data?.content || [];

        if (!items.length) {
            contentList.innerHTML = '<p class="text-gray-500">등록한 재능이 없습니다.</p>';
            return;
        }

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'border border-gray-200 rounded-lg p-4 hover:shadow-md transition';
            card.innerHTML = `
        <div class="flex items-center text-xs text-gray-500 mb-1">
          <span>${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</span>
        </div>
        <div class="flex justify-between items-start">
          <h3 class="font-medium">${item.title}</h3>
        </div>
        <div class="flex flex-wrap gap-2 mt-1 mb-2">
          ${(item.tags || []).map(tag => `
            <span class="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">#${tag}</span>
          `).join('')}
        </div>
        <p class="text-sm text-gray-600">${item.content}</p>
      `;
            contentList.appendChild(card);
        });
    } catch (err) {
        console.error('❌ 재능 목록 로딩 실패:', err);
        contentList.innerHTML = '<p class="text-red-500">재능 데이터를 불러올 수 없습니다.</p>';
    }
});
