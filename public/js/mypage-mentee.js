document.addEventListener("DOMContentLoaded", function () {
  const includeElements = document.querySelectorAll("[data-include-path]");

  includeElements.forEach(async function (el) {
    const path = el.getAttribute("data-include-path");
    const response = await fetch(path);
    const html = await response.text();
    el.innerHTML = html;
  });

  // 탭 전환 기능
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // 모든 탭 버튼에서 active 클래스 제거
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      // 클릭한 탭 버튼에 active 클래스 추가
      this.classList.add("active");

      // 모든 탭 컨텐츠 숨기기
      tabContents.forEach((content) => content.classList.add("hidden"));
      // 선택한 탭 컨텐츠 표시
      const tabId = this.getAttribute("data-tab");
      document.getElementById(tabId + "-content").classList.remove("hidden");
    });
  });
});
