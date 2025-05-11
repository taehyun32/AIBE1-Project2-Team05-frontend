// /public/js/api/apiClient.js

// API 기본 설정
const API_BASE_URL = '/api/v1';

// 공통 fetch 함수
async function fetchAPI(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    // 기본 옵션 설정
    const defaultOptions = {
        credentials: 'include', // 쿠키 포함
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });

    // 응답 처리
    if (!response.ok) {
        const error = await response.json().catch(() => ({
            message: `API 요청 실패: ${response.status} ${response.statusText}`
        }));
        throw new Error(error.message || '알 수 없는 오류가 발생했습니다.');
    }

    return response.json();
}

// 모듈 내보내기
export const apiClient = {
    get: (endpoint) => fetchAPI(endpoint),
    post: (endpoint, data) => fetchAPI(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    put: (endpoint, data) => fetchAPI(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (endpoint) => fetchAPI(endpoint, {
        method: 'DELETE',
    }),
    // 파일 업로드용 메서드
    upload: (endpoint, formData) => fetchAPI(endpoint, {
        method: 'POST',
        headers: {}, // Content-Type을 제거하여 브라우저가 자동으로 설정하게 함
        body: formData,
    }),
};