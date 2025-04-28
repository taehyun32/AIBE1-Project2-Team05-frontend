document.addEventListener("DOMContentLoaded", function () {
    // 제목 글자수 카운터
    const titleInput = document.getElementById("title");
    const titleCount = document.getElementById("titleCount");

    titleInput.addEventListener("input", function () {
      titleCount.textContent = this.value.length;
    });

    // 카테고리 드롭다운
    const categoryButton = document.getElementById("categoryButton");
    const categoryDropdown = document.getElementById("categoryDropdown");
    const categoryItems = categoryDropdown.querySelectorAll("li");
    const categoryValue = document.getElementById("categoryValue");

    categoryButton.addEventListener("click", function () {
      categoryDropdown.classList.toggle("hidden");
    });

    categoryItems.forEach((item) => {
      item.addEventListener("click", function () {
        const value = this.getAttribute("data-value");
        const text = this.textContent;

        categoryButton.textContent = text;
        categoryValue.value = value;
        categoryDropdown.classList.add("hidden");
        categoryButton.classList.remove("text-gray-500");
        categoryButton.classList.add("text-gray-800");
      });
    });

    document.addEventListener("click", function (event) {
      if (
        !categoryButton.contains(event.target) &&
        !categoryDropdown.contains(event.target)
      ) {
        categoryDropdown.classList.add("hidden");
      }
    });

    // 태그 입력 처리
    const tagInput = document.getElementById("tagInput");
    const tagContainer = document.getElementById("tagContainer");
    const tags = new Set();

    function addTag(tagText) {
      if (tagText.trim() === "" || tags.size >= 5) return;

      if (!tags.has(tagText)) {
        tags.add(tagText);

        const tagElement = document.createElement("div");
        tagElement.className =
          "flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm";
        tagElement.innerHTML = `
                  <span>${tagText}</span>
                  <button type="button" class="ml-1 text-gray-500 hover:text-gray-700" data-tag="${tagText}">
                      <div class="w-4 h-4 flex items-center justify-center">
                          <i class="ri-close-line"></i>
                      </div>
                  </button>
              `;

        tagContainer.appendChild(tagElement);

        // 태그 삭제 이벤트
        const deleteButton = tagElement.querySelector("button");
        deleteButton.addEventListener("click", function () {
          const tagToRemove = this.getAttribute("data-tag");
          tags.delete(tagToRemove);
          tagElement.remove();
        });
      }

      tagInput.value = "";
    }

    tagInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addTag(this.value.trim());
      }
    });

    tagInput.addEventListener("blur", function () {
      if (this.value.trim()) {
        addTag(this.value.trim());
      }
    });

    // 리치 텍스트 에디터
    const editor = document.getElementById("editor");
    const editorButtons = document.querySelectorAll(
      ".editor-toolbar button[data-command]",
    );

    editorButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const command = this.getAttribute("data-command");
        document.execCommand(command, false, null);
        editor.focus();
      });
    });

    // 링크 삽입
    document.getElementById("insertLink").addEventListener("click", function () {
      const url = prompt("링크 URL을 입력하세요:", "https://");
      if (url) {
        document.execCommand("createLink", false, url);
      }
    });

    // 이미지 업로드 처리
    const dropArea = document.getElementById("dropArea");
    const fileInput = document.getElementById("fileInput");
    const browseButton = document.getElementById("browseButton");
    const previewContainer = document.getElementById("previewContainer");
    let uploadedFiles = [];

    browseButton.addEventListener("click", function () {
      fileInput.click();
    });

    dropArea.addEventListener("dragover", function (e) {
      e.preventDefault();
      dropArea.classList.add("border-primary");
    });

    dropArea.addEventListener("dragleave", function () {
      dropArea.classList.remove("border-primary");
    });

    dropArea.addEventListener("drop", function (e) {
      e.preventDefault();
      dropArea.classList.remove("border-primary");

      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    });

    fileInput.addEventListener("change", function () {
      handleFiles(this.files);
    });

    function handleFiles(files) {
      if (uploadedFiles.length + files.length > 5) {
        alert("이미지는 최대 5개까지 업로드할 수 있습니다.");
        return;
      }

      Array.from(files).forEach((file) => {
        if (!file.type.match("image.*")) {
          alert("이미지 파일만 업로드할 수 있습니다.");
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          alert("파일 크기는 5MB를 초과할 수 없습니다.");
          return;
        }

        uploadedFiles.push(file);

        const reader = new FileReader();
        reader.onload = function (e) {
          const preview = document.createElement("div");
          preview.className = "relative group";
          preview.innerHTML = `
                      <div class="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded">
                          <img src="${e.target.result}" alt="미리보기" class="w-full h-full object-cover">
                      </div>
                      <button type="button" class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                          <div class="w-4 h-4 flex items-center justify-center">
                              <i class="ri-delete-bin-line"></i>
                          </div>
                      </button>
                  `;

          previewContainer.appendChild(preview);

          // 이미지 삭제 이벤트
          const deleteButton = preview.querySelector("button");
          deleteButton.addEventListener("click", function () {
            const index = Array.from(previewContainer.children).indexOf(preview);
            uploadedFiles.splice(index, 1);
            preview.remove();
          });

          // 에디터에 이미지 삽입 이벤트
          preview.querySelector("img").addEventListener("click", function () {
            document.execCommand("insertImage", false, e.target.result);
            editor.focus();
          });
        };

        reader.readAsDataURL(file);
      });
    }

    // 이미지 삽입 버튼
    document.getElementById("insertImage").addEventListener("click", function () {
      fileInput.click();
    });

    // 폼 제출
    document.getElementById("postForm").addEventListener("submit", function (e) {
      e.preventDefault();

      // 필수 항목 검증
      const title = document.getElementById("title").value;
      const category = document.getElementById("categoryValue").value;
      const content = document.getElementById("editor").innerHTML;

      if (!title) {
        alert("제목을 입력해주세요.");
        document.getElementById("title").focus();
        return;
      }

      if (!category) {
        alert("카테고리를 선택해주세요.");
        document.getElementById("categoryButton").focus();
        return;
      }

      if (!content || content === "<br>") {
        alert("본문을 입력해주세요.");
        document.getElementById("editor").focus();
        return;
      }

      // 폼 데이터 수집
      const formData = new FormData();
      formData.append("title", title);
      formData.append("category", category);
      formData.append("content", content);

      // 태그 추가
      const tagsArray = Array.from(tags);
      tagsArray.forEach((tag) => {
        formData.append("tags[]", tag);
      });

      // 이미지 파일 추가
      uploadedFiles.forEach((file) => {
        formData.append("images[]", file);
      });

      // 서버로 데이터 전송 (실제 구현에서는 fetch 또는 axios 사용)
      console.log("폼 제출됨", {
        title,
        category,
        content,
        tags: tagsArray,
        uploadedFiles,
      });

      // 성공 시 커뮤니티 페이지로 이동
      alert("게시글이 등록되었습니다.");
      window.location.href =
        "https://readdy.ai/home/ac21da48-6871-4806-adae-3402107fffdd/b7baf916-1754-43c5-8692-ad365db6ac9f";
    });

    // 페이지 이탈 경고
    window.addEventListener("beforeunload", function (e) {
      if (
        titleInput.value ||
        (editor.innerHTML !== "" && editor.innerHTML !== "<br>") ||
        uploadedFiles.length > 0
      ) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    });
  });