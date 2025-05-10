document.addEventListener('DOMContentLoaded', function() {
  // 매칭 유형 선택 기능
  const matchingTypeOptions = document.querySelectorAll('.matching-type-option');
  const matchingTypeRadios = document.querySelectorAll('input[name="matchingType"]');
  const confirmMatchingTypeBtn = document.getElementById('confirmMatchingType');
  const matchingSelectionContainer = document.getElementById('matching-selection-container');
  const loadingContainer = document.getElementById('loading-container');
  const aiMatchingResultContainer = document.getElementById('ai-matching-result-container');
  const continueToMatchingBtn = document.getElementById('continueToMatching');

  // 초기 상태에서 첫 번째 옵션 선택 표시
  matchingTypeOptions[0].classList.add('selected');

  // 매칭 유형 옵션 클릭 시 라디오 버튼 선택
  matchingTypeOptions.forEach(option => {
    option.addEventListener('click', function() {
      const type = this.dataset.type;
      const radio = this.querySelector('input[type="radio"]');

      // 모든 라디오 버튼 선택 해제
      matchingTypeRadios.forEach(r => r.checked = false);

      // 클릭한 옵션의 라디오 버튼 선택
      radio.checked = true;

      // 시각적 표시 (선택된 옵션 강조)
      matchingTypeOptions.forEach(opt => {
        opt.classList.remove('selected');
      });

      this.classList.add('selected');

      // 애니메이션 효과 추가
      this.classList.add('animate-scaleIn');
      setTimeout(() => {
        this.classList.remove('animate-scaleIn');
      }, 300);
    });
  });

  // 선택 완료 버튼 클릭 시
  confirmMatchingTypeBtn.addEventListener('click', async function() {
    // 선택된 매칭 유형 가져오기
    const selectedType = document.querySelector('input[name="matchingType"]:checked').value;

    // 로컬 스토리지에 저장
    localStorage.setItem('matchingType', selectedType);

    // 매칭 유형에 따라 적절한 처리
    if (selectedType === 'ai') {
      // 매칭 선택 화면 숨기기
      matchingSelectionContainer.classList.add('hidden');

      // 로딩 화면 표시
      loadingContainer.classList.remove('hidden');

      try {
        // API 호출
        const response = await fetch('/api/v1/matching/recommendations', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (response.status === 401) {
          const retry = await handle401Error();
          if (!retry) {
            return;
          }
          // 토큰 갱신 후 재시도
          return confirmMatchingTypeBtn.click();
        }

        const result = await response.json();
        console.log(result);

        if (result.status === 200 && result.data) {
          // 매칭 결과 데이터 가져오기
          const { results } = result.data;
          
          // 매칭 결과 컨테이너 초기화
          const resultContainer = document.querySelector('#ai-matching-result-container .grid');
          resultContainer.innerHTML = '';

          // 각 매칭 결과를 화면에 표시
          results.forEach((match, index) => {
            const matchCard = document.createElement('div');
            matchCard.className = 'border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer hover-scale';
            
            // 유사도 점수를 백분율로 변환
            const similarityPercent = Math.round(match.similarity * 100);
            
            matchCard.innerHTML = `
              <div class="text-center">
                <div class="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-3 overflow-hidden">
                  <img src="${match.profileImageUrl}" alt="프로필 이미지" class="w-full h-full object-cover">
                </div>
                <h4 class="font-medium text-lg">${match.nickname}</h4>
                <p class="text-sm text-gray-600 mb-2">${match.areaName} ${match.sigunguname}</p>
                <div class="flex flex-wrap justify-center gap-1 mt-2">
                  ${match.profileTag.split(', ').map(tag => 
                    `<span class="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">${tag}</span>`
                  ).join('')}
                </div>
                <p class="text-sm text-gray-600 mt-3">매칭 점수: ${similarityPercent}%</p>
              </div>
            `;

            // 클릭 이벤트 추가
            matchCard.addEventListener('click', () => {
              window.location.href = match.contactLink;
            });

            resultContainer.appendChild(matchCard);
          });
        }

        // 로딩 화면 숨기기
        loadingContainer.classList.add('hidden');

        // AI 매칭 결과 화면 표시
        aiMatchingResultContainer.classList.remove('hidden');

        // 스크롤을 결과 화면으로 이동
        aiMatchingResultContainer.scrollIntoView({ behavior: 'smooth' });
      } catch (error) {
        console.error('Error:', error);
        loadingContainer.classList.add('hidden');
        matchingSelectionContainer.classList.remove('hidden');
        alert('매칭 추천을 가져오는 중 오류가 발생했습니다.');
      }
    } else {
      // 수동 매칭 페이지로 이동
      window.location.href = '/match';
    }
  });

  // 매칭 상세 보기 버튼 클릭 시
  continueToMatchingBtn.addEventListener('click', function() {
    // 매칭 상세 페이지로 이동
    window.location.href = 'match.html';
  });
});
