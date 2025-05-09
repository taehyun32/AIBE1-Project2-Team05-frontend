/**
 * js/communityAPI.js
 * 백엔드 API와의 통신을 처리
 */
import { API_BASE_URL } from "./communityContants.js";

// --- Core Fetch 기능 ---
/**
 * 백엔드 API와 상호 작용하는 일반적인 fetch 기능
 * @param {string} endpoint - The API endpoint (e.g., '/list')
 * @param {object} [params={}] - URL query parameters
 * @returns {Promise<any>} - ApiResponse의 '데이터' 필드에서 얻은 실제 데이터
 * @throws {Error} -  가져오기가 실패하거나 API가 오류를 반환하는 경우
 */
async function fetchApi(endpoint, params = {}) {
  const url = new URL(API_BASE_URL + endpoint);
  Object.keys(params).forEach((key) => {
    if (params[key] !== null && params[key] !== undefined) {
      url.searchParams.append(key, params[key]);
    }
  });

  try {
    const response = await fetch(url.toString(), { credentials: "include" });
    const responseBody = await response.json(); // 상태에 관계없이 JSON 구문 분석 시도

    // HTTP 상태 또는 APIResponse 구조를 기반으로 오류 확인
    if (!response.ok || (responseBody && responseBody.status >= 400)) {
      const errorMessage =
        responseBody?.message ||
        `Request failed with status ${response.status}`;
      console.error(`API Error (${endpoint}): ${errorMessage}`, responseBody);
      throw new Error(errorMessage);
    }

    // 성공: ApiResponse에서 데이터 필드 반환
    // '데이터'가 명시적으로 무효일 수 있는 경우 처리(예: 콘텐츠 없이 성공적으로 삭제)
    return responseBody.data !== undefined ? responseBody.data : null; // Return null if data is undefined
  } catch (error) {
    // 네트워크 오류 또는 JSON 구문 분석 오류 처리
    console.error(`Network or Parsing Error (${endpoint}):`, error);
    // 사용자 친화적이거나 표준화된 오류 Re-throw
    if (error instanceof SyntaxError) {
      throw new Error("Failed to parse server response.");
    }
    // 잡힌 오류를 다시 thorw ('if (!response.ok)' 블록에서 나온 오류일 수도 있고 네트워크 오류일 수도)
    throw error;
  }
}

// --- 커뮤니티 API 함수 ---

/**
 * 주요 인기 커뮤니티 게시물 fetch (전체 요약)
 * endpoint: /popular
 * @param {number} limit - 최대 게시물 수
 * @param {number} day - 되돌아볼 일수
 * @returns {Promise<Array<object>>} - CommunitySummaryResponseDTO 배열
 */
export async function fetchMainPopularPosts(limit = 2, day = 2) {
  const popularPosts = await fetchApi("/popular", { limit, day });
  return popularPosts || [];
}

/**
 * 주간 인기 커뮤니티 게시물(ID, 제목, 카테고리) fetch
 * endpoint: /weekly-popular
 * @param {number} limit - 최대 게시물 수
 * @param {number} day - 되돌아볼 일수
 * @returns {Promise<Array<object>>} - CommunityWeeklyPopularDTOs 배열
 */
export async function fetchWeeklyPopularPosts(limit = 5, day = 7) {
  const weeklyPopularPosts = await fetchApi("/weekly-popular", { limit, day });
  return weeklyPopularPosts || [];
}

/**
 * 커뮤니티 게시물 페이지 fetch
 * @param {number} [page=0] - 페이지 번호
 * @param {number} [size=5] - 페이지당 항목 수
 * @param {string|null} [category=null] - 필터링할 카테고리
 * @param {string} [sort="createdAt,desc"] - 정렬 매개변수
 * @param {string|null} [tag=null] - ⭐ 필터링할 태그 이름
 * @returns {Promise<object>} - 페이지 객체({content: [], 페이지: {totalPages, ...} })
 */
export async function fetchCommunityList(
  page = 0,
  size = 5,
  category = null,
  sort = "createdAt,desc",
  tag = null
) {
  const params = { page, size, sort };
  if (category) {
    params.category = category;
  }
  if (tag) {
    params.tag = tag;
  }
  const responseData = await fetchApi("/list", params);
  return (
    responseData || {
      content: [],
      page: {
        size,
        number: 0,
        totalElements: 0,
        totalPages: 0,
      },
    }
  );
}

/**
 * 커뮤니티 게시물을 키워드별로 검색
 * @param {string} keyword - 검색어
 * @param {number} [page=0] - 페이지 번호
 * @param {number} [size=10] - 페이지당 항목 수
 * @param {string} [sort="createdAt,desc"] - 정렬 매개변수
 * @returns {Promise<object>} - 페이지 객체
 */
export async function searchCommunities(
  keyword,
  page = 0,
  size = 10,
  sort = "createdAt,desc"
) {
  const params = { keyword, page, size, sort };
  const responseData = await fetchApi("/search", params);
  return (
    responseData || {
      content: [],
      page: {
        size,
        number: 0,
        totalElements: 0,
        totalPages: 0,
      },
    }
  );
}

/** 인기 태그 목록을 가져옵니다.
 * @param {number} limit - 가져올 태그의 최대 개수
 * @param {number} days - 최근 N일 기준
 * @returns {Promise<Array<object>>} - 태그 객체 배열 ({ name: string, count: number })
 */
export async function fetchPopularTags(limit = 10, days = 30) {
  const popularTags = await fetchApi("/popular-tags", { limit, days });
  return popularTags || [];
}
