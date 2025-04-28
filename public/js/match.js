    document.addEventListener("DOMContentLoaded", function () {
    // 프로필 카드 클릭 이벤트
    const profileCards = document.querySelectorAll(".profile-card");
    const profileDetail = document.getElementById("profileDetail");
    const defaultMessage = document.getElementById("defaultMessage");
    // 프로필 데이터 (실제로는 서버에서 가져올 데이터)
    const profilesData = {
    1: {
    name: "김민준",
    image:
    "https://readdy.ai/api/search-image?query=professional%20asian%20male%20portrait%2C%20neutral%20background%2C%20professional%20looking%2C%20high%20quality&width=100&height=100&seq=1&orientation=squarish",
    category: "프로그래밍 / 웹개발",
    location: "서울 강남구",
    time: "주말, 평일 저녁",
    intro:
    "5년차 웹 개발자입니다. 기초부터 실무까지 웹 개발 지식을 나누고 싶습니다. React, Node.js 전문. 현재 스타트업에서 시니어 개발자로 근무하며, 주니어 개발자들의 멘토링도 진행하고 있습니다. 웹 개발에 관심 있는 분들에게 실무에서 실제로 사용되는 기술과 노하우를 전달하고 싶습니다.",
    posts: [
{
    title: "React와 Node.js로 풀스택 개발 배우기",
    date: "2025-04-20",
    content:
    "웹 개발을 시작하시는 분들을 위해 React와 Node.js를 활용한 풀스택 개발 과정을 알려드립니다. 기초부터 실전 프로젝트까지, 체계적인 커리큘럼으로 준비했습니다.",
    likes: 15,
    comments: 8,
},
{
    title: "주니어 개발자를 위한 코드 리뷰 방법",
    date: "2025-04-15",
    content:
    "코드 리뷰는 개발자의 성장에 매우 중요합니다. 제가 실무에서 경험한 효과적인 코드 리뷰 방법과 주니어 개발자가 성장하기 위한 팁을 공유합니다.",
    likes: 23,
    comments: 12,
},
    ],
},
};
    profileCards.forEach((card) => {
    card.addEventListener("click", function () {
    const profileId = this.dataset.profileId;
    const profileData = profilesData[profileId];
    if (profileData) {
    // 프로필 상세 정보 업데이트
    document.getElementById("profileDetailImg").src = profileData.image;
    document.getElementById("profileDetailName").textContent =
    profileData.name;
    document.getElementById("profileDetailCategory").textContent =
    profileData.category;
    document.getElementById("profileDetailLocation").textContent =
    profileData.location;
    document.getElementById("profileDetailTime").textContent =
    profileData.time;
    document.getElementById("profileDetailIntro").textContent =
    profileData.intro;
    // 게시글 목록 업데이트
    const postsContainer = document.getElementById("profileDetailPosts");
    postsContainer.innerHTML = profileData.posts
    .map(
    (post) => `
<div class="border border-gray-200 rounded-lg p-4">
<div class="flex justify-between items-start mb-2">
<h4 class="text-lg font-medium">${post.title}</h4>
<span class="text-sm text-gray-500">${post.date}</span>
</div>
<p class="text-gray-700 mb-3">${post.content}</p>
<div class="flex items-center space-x-4">
<button class="flex items-center text-gray-500 hover:text-primary">
<div class="w-5 h-5 flex items-center justify-center mr-1">
<i class="ri-heart-line"></i>
</div>
<span>${post.likes}</span>
</button>
<button class="flex items-center text-gray-500 hover:text-primary">
<div class="w-5 h-5 flex items-center justify-center mr-1">
<i class="ri-chat-1-line"></i>
</div>
<span>${post.comments}</span>
</button>
</div>
</div>
`,
    )
    .join("");
    // 상세 정보 표시
    profileDetail.classList.remove("hidden");
    defaultMessage.classList.add("hidden");
}
});
});
    // 카테고리 드롭다운
    const categoryButton = document.getElementById("categoryButton");
    const categoryDropdown = document.getElementById("categoryDropdown");
    if (categoryButton && categoryDropdown) {
    categoryButton.addEventListener("click", function () {
    categoryDropdown.classList.toggle("hidden");
});
    document.addEventListener("click", function (event) {
    if (
    !categoryButton.contains(event.target) &&
    !categoryDropdown.contains(event.target)
    ) {
    categoryDropdown.classList.add("hidden");
}
});
    const categoryOptions = categoryDropdown.querySelectorAll("button");
    categoryOptions.forEach((option) => {
    option.addEventListener("click", function () {
    categoryButton.querySelector("span").textContent = this.textContent;
    categoryDropdown.classList.add("hidden");
});
});
}
    // 지역 드롭다운
    const regionButton = document.getElementById("regionButton");
    const regionDropdown = document.getElementById("regionDropdown");
    if (regionButton && regionDropdown) {
    regionButton.addEventListener("click", function () {
    regionDropdown.classList.toggle("hidden");
});
    document.addEventListener("click", function (event) {
    if (
    !regionButton.contains(event.target) &&
    !regionDropdown.contains(event.target)
    ) {
    regionDropdown.classList.add("hidden");
}
});
    const regionOptions = regionDropdown.querySelectorAll("button");
    regionOptions.forEach((option) => {
    option.addEventListener("click", function () {
    regionButton.querySelector("span").textContent = this.textContent;
    regionDropdown.classList.add("hidden");
});
});
}
});
    document.addEventListener("DOMContentLoaded", function () {
    // 게시글 카테고리 드롭다운
    const postCategoryButton = document.getElementById("postCategoryButton");
    const postCategoryDropdown = document.getElementById("postCategoryDropdown");
    if (postCategoryButton && postCategoryDropdown) {
    postCategoryButton.addEventListener("click", function () {
    postCategoryDropdown.classList.toggle("hidden");
});
    document.addEventListener("click", function (event) {
    if (
    !postCategoryButton.contains(event.target) &&
    !postCategoryDropdown.contains(event.target)
    ) {
    postCategoryDropdown.classList.add("hidden");
}
});
    const postCategoryOptions = postCategoryDropdown.querySelectorAll("button");
    postCategoryOptions.forEach((option) => {
    option.addEventListener("click", function () {
    postCategoryButton.querySelector("span").textContent = this.textContent;
    postCategoryDropdown.classList.add("hidden");
});
});
}
    // 글쓰기 버튼 클릭 시 폼 표시
    const writePostBtn = document.getElementById("writePostBtn");
    const postForm = document.getElementById("postForm");
    const cancelPostBtn = document.getElementById("cancelPostBtn");
    if (writePostBtn && postForm && cancelPostBtn) {
    writePostBtn.addEventListener("click", function () {
    postForm.classList.remove("hidden");
});
    cancelPostBtn.addEventListener("click", function () {
    postForm.classList.add("hidden");
});
}
});