document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const contentList = document.getElementById('content-list');
    const nickname = sessionStorage.getItem('nickname');

    if (type !== 'ongoing') return;
    if (!nickname || !contentList) return;

    try {
        const response = await fetch(`/api/v1/users/${nickname}/matching/more-details?type=ongoing`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });

        const result = await response.json();
        const matchings = result?.data?.content || [];

        console.log('✅ [진행 중 매칭] 응답:', matchings);

        if (matchings.length === 0) {
            contentList.innerHTML = '<p class="text-gray-500">진행 중인 매칭이 없습니다.</p>';
            return;
        }

        matchings.forEach(item => {
            console.log('▶️ 매칭 항목:', item);

            const card = document.createElement('div');
            card.className = 'border border-gray-200 rounded-lg p-4 hover:shadow-md transition';

            const imageUrl = item.menteeProfileImageUrl || '/img/default-profile.png';
            const nickname = item.menteeNickname || '닉네임 없음';
            const date = item.matchingDate ? new Date(item.matchingDate).toLocaleDateString() : '-';
            const normalizedStatus = (item.status || '').trim().toLowerCase();
            const isCompleted = normalizedStatus === '완료' || normalizedStatus === 'completed';
            const statusText = isCompleted ? '완료' : '진행중';
            const statusClass = isCompleted
                ? 'bg-gray-600 text-gray-100'
                : 'bg-green-500 text-green-100';

            const statusPill = `
              <span class="text-xs ${statusClass} px-2 py-1 rounded-full whitespace-nowrap font-medium">
                ${statusText}
              </span>
            `;

            const contactLink = item.contactLink ?? null;

            const tags = (item.tag || '').split(',').filter(Boolean).map(tag =>
                `<span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded mr-1">#${tag.trim()}</span>`
            ).join('');

            card.innerHTML = `
  <div class="flex items-start gap-4">
    <!-- 프로필 이미지 -->
    <div class="w-16 h-16 min-w-[64px] min-h-[64px] rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
      <img
        src="${imageUrl}"
        alt="프로필"
        class="w-full h-full object-cover object-center"
        style="aspect-ratio: 1 / 1;"
      />
    </div>

    <!-- 텍스트 콘텐츠 -->
    <div class="flex-1">
      <div class="flex justify-between items-start">
        <div>
          <p class="text-sm font-semibold text-gray-900">${nickname}</p>
          <p class="text-xs text-gray-500">${date} 매칭</p>
        </div>
        <span class="text-xs px-2 py-0.5 rounded-full text-white ${statusClass}">
          ${statusText}
        </span>
      </div>
      <div class="text-xs text-purple-600 font-semibold mt-1">${item.category || ''}</div>
      <p class="text-sm text-gray-700 mt-1">${item.description || ''}</p>
      <div class="mt-2 flex flex-wrap gap-1">${tags}</div>
    </div>

    <!-- 연락하기 버튼 -->
    <div class="flex-shrink-0 ml-4 mt-1 relative">
        ${isCompleted
                ? `
<a href="#"
  class="text-sm font-bold text-gray-400 cursor-not-allowed whitespace-nowrap"
  aria-disabled="true"
  onclick="event.preventDefault(); showCompletedTooltip(this);">
  연락하기
</a>
`
                : `
<a href="${contactLink || '#'}"
  target="_blank"
  class="text-sm font-bold text-blue-800 hover:underline open-chat-link whitespace-nowrap"
  data-haslink="${!!contactLink}">
  연락하기
</a>
`
            }

    </div>

  </div>
`;


            contentList.appendChild(card);
        });
    } catch (error) {
        console.error("❌ 진행 중 매칭 데이터를 불러오지 못했습니다:", error);
        contentList.innerHTML = '<p class="text-red-500">데이터를 불러오는 중 오류가 발생했습니다.</p>';
    }
});

// null 링크 클릭 시 경고 처리
document.addEventListener('click', function (e) {
    if (e.target.matches('.open-chat-link')) {
        const hasLink = e.target.dataset.haslink === 'true';
        if (!hasLink) {
            e.preventDefault();
            alert('이 유저는 오픈채팅 링크를 등록하지 않았습니다.');
        }
    }
});

function showCompletedTooltip(el) {
    const existing = el.parentElement.querySelector('.custom-tooltip');
    if (existing) existing.remove();

    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';
    tooltip.innerHTML = `
    <span class="tooltip-icon">❗</span>
    <span class="tooltip-text">매칭이 완료된 멘티입니다.</span>
  `;

    el.parentElement.appendChild(tooltip);

    setTimeout(() => tooltip.classList.add('fade-out'), 2000);
    setTimeout(() => tooltip.remove(), 2500);
}
