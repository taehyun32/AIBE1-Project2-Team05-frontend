/**
 * js/communityConstants.js
 * community 사용되는 상수 값을 정의
 */

// API Configuration
// export const API_BASE_URL = "http://localhost:8080/v1/community";
export const API_BASE_URL = "/api/v1/community";

// Community Page Specifics
export const POSTS_PER_PAGE = 5;
export const SEARCH_RESULTS_PER_PAGE = 10;
export const DEFAULT_SORT = "createdAt,desc";

// 인기글 API 호출의 매개변수(기본값은 종종 컨트롤러를 기반으로 한 API 함수 자체에서 처리됨)
// 그러나 특정 프론트엔드 기반 값이 호출에 필요한 경우 여기서 정의 가능)
export const MAIN_POPULAR_POSTS_LIMIT = 2;
export const MAIN_POPULAR_POSTS_DAYS = 2;

export const WEEKLY_POPULAR_POSTS_LIMIT = 5;
export const WEEKLY_POPULAR_POSTS_DAYS = 7;

export const POPULAR_TAGS_LIMIT = 10;
export const POPULAR_TAGS_DAYS = 30;

// Category enum(백엔드)을 디스플레이 이름(프론트엔드)으로 매핑
export const CATEGORY_DISPLAY_NAMES = {
  ALL: "전체",
  QUESTION: "질문/답변",
  INFO: "정보공유",
  REVIEW: "후기",
  FREE: "자유게시판",
  TALENT: "재능 나눔",
};

// 정렬 옵션: [텍스트 표시, 매개변수 값 정렬]
export const SORT_OPTIONS = [
  { text: "최신순", value: "createdAt,desc" },
  { text: "인기순", value: "likeCount,desc" },
  { text: "조회순", value: "viewCount,desc" },
  { text: "댓글순", value: "commentCount,desc" },
];

// 주간 인기 게시물의 순위 배지 색상
export const WEEKLY_RANK_BADGE_CLASSES = [
  "bg-red-100 text-red-600", // Rank 1
  "bg-orange-100 text-orange-600", // Rank 2
  "bg-yellow-100 text-yellow-600", // Rank 3
  "bg-gray-100 text-gray-600", // Default for ranks > 3
];
