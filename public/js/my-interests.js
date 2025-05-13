document.addEventListener('DOMContentLoaded', async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type'); // my-interests
    const filter = urlParams.get('filter') || 'all';
    const nickname = sessionStorage.getItem('nickname'); // 또는 JWT에서 가져오는 로직
    const contentList = document.getElementById('content-list');

    if (type !== 'my-interests') return;

    // ✅ 필터 버튼들 동적 생성
    const filterContainer = document.querySelector('#filter-section .space-x-2');

    // 🔥 기존 버튼들 모두 제거 (중복 방지용)
    filterContainer.innerHTML = '';

    ['all', 'bookmarked', 'liked'].forEach(f => {
        const btn = document.createElement('button');
        btn.className = `px-4 py-2 rounded-full whitespace-nowrap ${f === filter ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`;
        btn.innerText = f === 'all' ? '전체' : (f === 'bookmarked' ? '북마크' : '좋아요');
        btn.dataset.filter = f;
        btn.addEventListener('click', () => {
            window.location.href = `/more-details.html?type=my-interests&filter=${f}`;
        });
        filterContainer.appendChild(btn);
    });

    // ✅ 데이터 불러오기
    try {
        const res = await fetch(`api/v1/users/${nickname}/activity/more-details/interests?filter=${filter}&page=0&size=10`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include'
        });

        if (!res.ok) throw new Error('요청 실패');
        const result = await res.json();
        renderList(result.data.content);

    } catch (err) {
        console.error('❌ 관심 데이터 불러오기 실패', err);
        contentList.innerHTML = '<p class="text-red-500">데이터를 불러오지 못했습니다.</p>';
    }

    // ✅ 목록 렌더링
    function renderList(items) {
        contentList.innerHTML = '';
        if (!items || items.length === 0) {
            contentList.innerHTML = '<p class="text-gray-500">표시할 항목이 없습니다.</p>';
            return;
        }

        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'bg-white p-4 border rounded shadow-sm';
            div.innerHTML = `
        <div class="text-xs text-gray-400 mb-1">${item.updatedAt}</div>
        <div class="font-semibold">${item.title}</div>
        <div class="text-sm text-gray-600">${item.content}</div>
        <div class="mt-1 text-xs text-blue-500">${item.type === 'bookmark' ? '북마크' : '좋아요'}</div>
      `;
            contentList.appendChild(div);
        });
    }
});
