document.addEventListener('DOMContentLoaded', function() {
  // Include header and footer
  const includeElements = document.querySelectorAll('[data-include-path]');
  includeElements.forEach(async function(el) {
    const path = el.getAttribute('data-include-path');
    const response = await fetch(path);
    const html = await response.text();
    el.innerHTML = html;
  });

  // Get the type and id parameters from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const type = urlParams.get('type');
  const id = urlParams.get('id');

  // Set page title and load content based on type
  setupPage(type, id);
});

/**
 * Set up the page based on the content type
 * @param {string} type - The type of content to display (reviews, matching, etc.)
 * @param {string} id - Optional ID for specific content
 */
function setupPage(type, id) {
  const pageTitle = document.getElementById('page-title');
  const filterSection = document.getElementById('filter-section');
  const contentList = document.getElementById('content-list');

  // Clear existing content
  contentList.innerHTML = '';

  // Set up page based on content type
  switch(type) {
    case 'reviews':
      pageTitle.textContent = '받은 리뷰';
      setupFilters(['전체', '최신순', '높은 평점순', '낮은 평점순']);
      loadReviews(id);
      break;
    case 'matching-requests':
      pageTitle.textContent = '받은 매칭 요청';
      setupFilters(['전체', '최신순', '대기중', '수락됨', '거절됨']);
      loadMatchingRequests(id);
      break;
    case 'my-posts':
      pageTitle.textContent = '내가 작성한 게시글';
      setupFilters(['전체', '질문/답변', '정보공유', '후기', '자유게시판']);
      loadMyPosts(id);
      break;
    case 'my-comments':
      pageTitle.textContent = '내가 작성한 댓글';
      setupFilters(['전체', '최신순']);
      loadMyComments(id);
      break;
    case 'favorites':
      pageTitle.textContent = '관심 목록';
      setupFilters(['전체', '멘토', '게시글']);
      loadFavorites(id);
      break;
    default:
      pageTitle.textContent = '상세 정보';
      filterSection.classList.add('hidden');
      contentList.innerHTML = '<p class="text-center text-gray-500 py-10">잘못된 접근입니다.</p>';
  }
}

/**
 * Set up filter buttons
 * @param {Array} filters - Array of filter names
 */
function setupFilters(filters) {
  const filterContainer = document.querySelector('#filter-section .flex.space-x-2');
  filterContainer.innerHTML = ''; // Clear existing filters

  filters.forEach((filter, index) => {
    const button = document.createElement('button');
    button.textContent = filter;
    button.className = index === 0 
      ? 'px-4 py-2 bg-primary text-white rounded-full whitespace-nowrap'
      : 'px-4 py-2 bg-gray-100 text-gray-700 rounded-full whitespace-nowrap hover:bg-gray-200';
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      filterContainer.querySelectorAll('button').forEach(btn => {
        btn.className = 'px-4 py-2 bg-gray-100 text-gray-700 rounded-full whitespace-nowrap hover:bg-gray-200';
      });
      // Add active class to clicked button
      button.className = 'px-4 py-2 bg-primary text-white rounded-full whitespace-nowrap';
      // Filter content
      filterContent(filter);
    });
    filterContainer.appendChild(button);
  });
}

/**
 * Filter content based on selected filter
 * @param {string} filter - The selected filter
 */
function filterContent(filter) {
  // This would be implemented based on the specific content type
  console.log('Filtering by:', filter);
  // For now, we'll just reload the current content type
  const urlParams = new URLSearchParams(window.location.search);
  const type = urlParams.get('type');
  const id = urlParams.get('id');
  
  // Reload content with filter
  setupPage(type, id);
}

/**
 * Load reviews data
 * @param {string} id - Optional ID for specific content
 */
function loadReviews(id) {
  const contentList = document.getElementById('content-list');
  
  // In a real application, this would fetch data from a server
  // For now, we'll use mock data
  const mockReviews = [
    {
      id: 1,
      mentee: {
        name: '정우진',
        image: 'https://readdy.ai/api/search-image?query=professional%20asian%20male%20portrait%2C%20neutral%20background%2C%20athletic%20build%2C%20high%20quality&width=100&height=100&seq=5&orientation=squarish',
        date: '2025-04-25'
      },
      rating: 5,
      content: 'React와 Node.js 멘토링이 정말 도움이 많이 되었습니다. 실무에서 사용하는 팁들을 많이 알려주셔서 개발 실력이 크게 향상되었어요. 특히 코드 구조화와 최적화 부분에서 많은 것을 배웠습니다.'
    },
    {
      id: 2,
      mentee: {
        name: '김유진',
        image: 'https://readdy.ai/api/search-image?query=professional%20asian%20female%20portrait%2C%20neutral%20background%2C%20business%20attire%2C%20high%20quality&width=100&height=100&seq=6&orientation=squarish',
        date: '2025-04-20'
      },
      rating: 4,
      content: '코드 리뷰를 통해 많은 인사이트를 얻었습니다. 제가 놓치고 있던 부분들을 정확히 짚어주셔서 감사합니다. 다만 일정이 가끔 지연되는 점이 아쉬웠습니다.'
    },
    {
      id: 3,
      mentee: {
        name: '이지훈',
        image: 'https://readdy.ai/api/search-image?query=professional%20asian%20male%20portrait%2C%20neutral%20background%2C%20casual%20style%2C%20high%20quality&width=100&height=100&seq=7&orientation=squarish',
        date: '2025-04-15'
      },
      rating: 5,
      content: '웹 개발 멘토링을 통해 실무에서 사용하는 기술들을 배울 수 있어서 좋았습니다. 특히 프로젝트 구조와 코드 리뷰 과정이 많은 도움이 되었습니다.'
    }
  ];

  // Render reviews
  mockReviews.forEach(review => {
    const reviewElement = document.createElement('div');
    reviewElement.className = 'border border-gray-200 rounded-lg p-4 hover:shadow-md transition';
    reviewElement.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
          <img src="${review.mentee.image}" alt="프로필" class="w-full h-full object-cover">
        </div>
        <div class="flex-1">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="font-medium">${review.mentee.name}</h3>
              <p class="text-xs text-gray-500">${review.mentee.date} 작성</p>
            </div>
            <div class="flex items-center">
              ${generateStarRating(review.rating)}
              <span class="ml-1 text-sm font-medium">${review.rating}.0</span>
            </div>
          </div>
          <p class="text-sm text-gray-600 mt-2">${review.content}</p>
        </div>
      </div>
    `;
    contentList.appendChild(reviewElement);
  });
}

/**
 * Load matching requests data
 * @param {string} id - Optional ID for specific content
 */
function loadMatchingRequests(id) {
  const contentList = document.getElementById('content-list');
  
  // Mock data for matching requests
  const mockRequests = [
    {
      id: 1,
      mentee: {
        name: '최서연',
        image: 'https://readdy.ai/api/search-image?query=professional%20asian%20female%20portrait%2C%20neutral%20background%2C%20casual%20style%2C%20high%20quality&width=100&height=100&seq=4&orientation=squarish',
        date: '2025-04-22'
      },
      content: 'React와 Node.js로 풀스택 개발 배우기 재능에 관심이 있습니다. 기초부터 차근차근 배우고 싶습니다.',
      preferredTime: '희망 시간: 주말 오후',
      status: 'pending'
    },
    {
      id: 2,
      mentee: {
        name: '박준호',
        image: 'https://readdy.ai/api/search-image?query=professional%20asian%20male%20portrait%2C%20neutral%20background%2C%20glasses%2C%20friendly%20look%2C%20high%20quality&width=100&height=100&seq=3&orientation=squarish',
        date: '2025-04-20'
      },
      content: '주니어 개발자를 위한 코드 리뷰 재능에 관심이 있습니다. 현재 진행 중인 프로젝트에 대한 코드 리뷰를 받고 싶습니다.',
      preferredTime: '희망 시간: 평일 저녁',
      status: 'pending'
    },
    {
      id: 3,
      mentee: {
        name: '김민지',
        image: 'https://readdy.ai/api/search-image?query=professional%20asian%20female%20portrait%2C%20neutral%20background%2C%20young%20professional%2C%20high%20quality&width=100&height=100&seq=8&orientation=squarish',
        date: '2025-04-18'
      },
      content: 'React 컴포넌트 설계와 상태 관리에 대해 배우고 싶습니다. 실무에서 사용하는 패턴과 구조에 대해 알고 싶습니다.',
      preferredTime: '희망 시간: 주말 오전',
      status: 'accepted'
    }
  ];

  // Render matching requests
  mockRequests.forEach(request => {
    const requestElement = document.createElement('div');
    requestElement.className = 'border border-gray-200 rounded-lg p-4 hover:shadow-md transition';
    requestElement.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
          <img src="${request.mentee.image}" alt="프로필" class="w-full h-full object-cover">
        </div>
        <div class="flex-1">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="font-medium">${request.mentee.name}</h3>
              <p class="text-xs text-gray-500">${request.mentee.date} 요청</p>
            </div>
            <div class="flex items-center gap-2">
              ${request.status === 'pending' ? `
                <button class="bg-primary text-white px-3 py-1 rounded-button text-sm hover:bg-indigo-600">수락</button>
                <button class="bg-gray-200 text-gray-700 px-3 py-1 rounded-button text-sm hover:bg-gray-300">거절</button>
              ` : request.status === 'accepted' ? `
                <span class="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">수락됨</span>
              ` : `
                <span class="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">거절됨</span>
              `}
            </div>
          </div>
          <p class="text-sm text-gray-600 mt-2">${request.content}</p>
          <div class="flex items-center text-sm text-gray-500 mt-2">
            <div class="w-4 h-4 flex items-center justify-center mr-1">
              <i class="ri-time-line"></i>
            </div>
            <span>${request.preferredTime}</span>
          </div>
        </div>
      </div>
    `;
    contentList.appendChild(requestElement);
  });
}

/**
 * Load my posts data
 * @param {string} id - Optional ID for specific content
 */
function loadMyPosts(id) {
  const contentList = document.getElementById('content-list');
  
  // Mock data for posts
  const mockPosts = [
    {
      id: 1,
      date: '2025-04-20',
      category: '정보공유',
      title: 'UI/UX 디자인 초보자를 위한 필수 도구 모음',
      content: 'UI/UX 디자인을 시작하는 분들을 위해 실무에서 꼭 필요한 도구들을 정리했습니다. 피그마, 스케치부터 프로토타이핑 도구까지 상세 설명과 함께 공유합니다.',
      views: 256,
      likes: 42,
      comments: 18
    },
    {
      id: 2,
      date: '2025-04-15',
      category: '질문/답변',
      title: 'React와 Next.js 중 어떤 것을 먼저 배워야 할까요?',
      content: '웹 개발을 시작하는 초보자입니다. React와 Next.js 중 어떤 것을 먼저 배우는 것이 좋을까요? 각각의 장단점과 학습 경로에 대한 조언 부탁드립니다.',
      views: 312,
      likes: 28,
      comments: 34
    },
    {
      id: 3,
      date: '2025-04-10',
      category: '후기',
      title: '재능 기부를 통해 얻은 소중한 깨달음',
      content: '1년간 영어 멘토링을 진행하면서 느낀 점과 배운 점을 공유합니다. 재능 기부는 나눔이 아닌 함께 성장하는 과정이었습니다.',
      views: 178,
      likes: 45,
      comments: 12
    }
  ];

  // Render posts
  mockPosts.forEach(post => {
    const postElement = document.createElement('div');
    postElement.className = 'border border-gray-200 rounded-lg p-4 hover:shadow-md transition';
    postElement.innerHTML = `
      <div class="flex items-center text-xs text-gray-500 mb-1">
        <span>${post.date}</span>
        <span class="mx-1">•</span>
        <span>${post.category}</span>
      </div>
      <h3 class="font-medium mb-2">${post.title}</h3>
      <p class="text-sm text-gray-600 mb-3">${post.content}</p>
      <div class="flex items-center justify-between text-sm text-gray-500">
        <div class="flex items-center space-x-3">
          <div class="flex items-center">
            <div class="w-4 h-4 flex items-center justify-center mr-1">
              <i class="ri-eye-line"></i>
            </div>
            <span>${post.views}</span>
          </div>
          <div class="flex items-center">
            <div class="w-4 h-4 flex items-center justify-center mr-1">
              <i class="ri-heart-line"></i>
            </div>
            <span>${post.likes}</span>
          </div>
          <div class="flex items-center">
            <div class="w-4 h-4 flex items-center justify-center mr-1">
              <i class="ri-chat-1-line"></i>
            </div>
            <span>${post.comments}</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button class="text-gray-500 hover:text-primary">
            <i class="ri-edit-line"></i>
          </button>
          <button class="text-gray-500 hover:text-red-500">
            <i class="ri-delete-bin-line"></i>
          </button>
        </div>
      </div>
    `;
    contentList.appendChild(postElement);
  });
}

/**
 * Load my comments data
 * @param {string} id - Optional ID for specific content
 */
function loadMyComments(id) {
  const contentList = document.getElementById('content-list');
  
  // Mock data for comments
  const mockComments = [
    {
      id: 1,
      date: '2025-04-22',
      postTitle: '"비전공자를 위한 프로그래밍 학습 로드맵" 게시글에 댓글',
      content: '정말 유용한 정보 감사합니다! 저도 비전공자로 시작했는데, 이런 로드맵이 있었다면 좋았을 것 같아요.'
    },
    {
      id: 2,
      date: '2025-04-18',
      postTitle: '"요가 초보자를 위한 추천 동작이 있을까요?" 게시글에 댓글',
      content: '초보자라면 마운틴 포즈, 다운독, 차일드 포즈 등의 기본 동작부터 시작하는 것이 좋습니다. 유연성보다는 호흡과 균형에 집중하세요.'
    },
    {
      id: 3,
      date: '2025-04-15',
      postTitle: '"프론트엔드 개발자 로드맵 2025" 게시글에 댓글',
      content: 'HTML, CSS, JavaScript 기초부터 차근차근 배우는 것이 중요합니다. 기초가 탄탄해야 프레임워크를 배울 때도 수월합니다.'
    }
  ];

  // Render comments
  mockComments.forEach(comment => {
    const commentElement = document.createElement('div');
    commentElement.className = 'border border-gray-200 rounded-lg p-4 hover:shadow-md transition';
    commentElement.innerHTML = `
      <div class="flex items-center text-xs text-gray-500 mb-1">
        <span>${comment.date}</span>
        <span class="mx-1">•</span>
        <span>댓글</span>
      </div>
      <h3 class="text-sm font-medium mb-2">
        <a href="#" class="hover:text-primary">${comment.postTitle}</a>
      </h3>
      <p class="text-sm text-gray-600">${comment.content}</p>
      <div class="flex justify-end mt-2">
        <div class="flex items-center gap-2">
          <button class="text-gray-500 hover:text-primary">
            <i class="ri-edit-line"></i>
          </button>
          <button class="text-gray-500 hover:text-red-500">
            <i class="ri-delete-bin-line"></i>
          </button>
        </div>
      </div>
    `;
    contentList.appendChild(commentElement);
  });
}

/**
 * Load favorites data
 * @param {string} id - Optional ID for specific content
 */
function loadFavorites(id) {
  const contentList = document.getElementById('content-list');
  
  // Mock data for favorites
  const mockFavorites = [
    {
      id: 1,
      type: 'mentor',
      name: '이지은',
      image: 'https://readdy.ai/api/search-image?query=professional%20asian%20female%20portrait%2C%20neutral%20background%2C%20friendly%20smile%2C%20high%20quality&width=100&height=100&seq=2&orientation=squarish',
      category: '디자인 / UI/UX',
      description: '현직 UI/UX 디자이너로 활동 중입니다. 기초 디자인 원칙부터 실무에서 사용하는 피그마, 스케치 등 툴 사용법까지 알려드립니다.'
    },
    {
      id: 2,
      type: 'post',
      date: '2025-04-20',
      category: '정보공유',
      title: '비전공자를 위한 프로그래밍 학습 로드맵',
      content: '비전공자가 프로그래밍을 시작할 때 어떤 순서로 공부하면 좋을지 로드맵을 정리했습니다. 실제 현업에서 필요한 기술 위주로 구성했습니다.'
    },
    {
      id: 3,
      type: 'mentor',
      name: '김태호',
      image: 'https://readdy.ai/api/search-image?query=professional%20asian%20male%20portrait%2C%20neutral%20background%2C%20business%20casual%2C%20high%20quality&width=100&height=100&seq=9&orientation=squarish',
      category: '교육 / 영어',
      description: '10년 경력의 영어 강사입니다. 영어 회화와 비즈니스 영어를 중점적으로 가르치고 있으며, 실생활에서 바로 활용할 수 있는 표현 위주로 알려드립니다.'
    }
  ];

  // Render favorites
  mockFavorites.forEach(favorite => {
    const favoriteElement = document.createElement('div');
    favoriteElement.className = 'border border-gray-200 rounded-lg p-4 hover:shadow-md transition';
    
    if (favorite.type === 'mentor') {
      favoriteElement.innerHTML = `
        <div class="flex items-start gap-3">
          <div class="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
            <img src="${favorite.image}" alt="프로필" class="w-full h-full object-cover">
          </div>
          <div class="flex-1">
            <div class="flex justify-between items-start">
              <h3 class="font-medium">${favorite.name}</h3>
              <button class="text-red-500 hover:text-red-600">
                <i class="ri-heart-fill"></i>
              </button>
            </div>
            <p class="text-primary text-sm font-medium mt-1">${favorite.category}</p>
            <p class="text-sm text-gray-600 mt-2">${favorite.description}</p>
          </div>
        </div>
      `;
    } else if (favorite.type === 'post') {
      favoriteElement.innerHTML = `
        <div class="flex items-center text-xs text-gray-500 mb-1">
          <span>${favorite.date}</span>
          <span class="mx-1">•</span>
          <span>${favorite.category}</span>
          <span class="ml-auto text-red-500">
            <i class="ri-heart-fill"></i>
          </span>
        </div>
        <h3 class="font-medium mb-2">${favorite.title}</h3>
        <p class="text-sm text-gray-600 mb-3">${favorite.content}</p>
      `;
    }
    
    contentList.appendChild(favoriteElement);
  });
}

/**
 * Generate HTML for star rating
 * @param {number} rating - Rating value (1-5)
 * @returns {string} HTML for star rating
 */
function generateStarRating(rating) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      stars += '<i class="ri-star-fill text-yellow-400"></i>';
    } else if (i - 0.5 <= rating) {
      stars += '<i class="ri-star-half-fill text-yellow-400"></i>';
    } else {
      stars += '<i class="ri-star-line text-yellow-400"></i>';
    }
  }
  return stars;
}