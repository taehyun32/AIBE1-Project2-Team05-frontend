document.addEventListener("DOMContentLoaded", function () {
  // 정렬 드롭다운

  const includeElements = document.querySelectorAll('[data-include-path]');

  includeElements.forEach(async function(el) {
    const path = el.getAttribute('data-include-path');
    const response = await fetch(path);
    const html = await response.text();
    el.innerHTML = html;
  });

  const sortButton = document.getElementById("sortButton");
  const sortDropdown = document.getElementById("sortDropdown");

  if (sortButton && sortDropdown) {
    sortButton.addEventListener("click", function () {
      sortDropdown.classList.toggle("hidden");
    });

    document.addEventListener("click", function (event) {
      if (
        !sortButton.contains(event.target) &&
        !sortDropdown.contains(event.target)
      ) {
        sortDropdown.classList.add("hidden");
      }
    });

    const sortOptions = sortDropdown.querySelectorAll("button");
    sortOptions.forEach((option) => {
      option.addEventListener("click", function () {
        sortButton.querySelector("span").textContent = this.textContent;
        sortDropdown.classList.add("hidden");
      });
    });
  }

  // 게시글 클릭 시 상세 페이지로 이동
  const postItems = document.querySelectorAll('.border.border-gray-200.rounded-lg.p-4.hover\\:shadow-md.transition.cursor-pointer');
  postItems.forEach(item => {
    item.addEventListener('click', function() {
      window.location.href = 'community-detail.html';
    });
  });
});
