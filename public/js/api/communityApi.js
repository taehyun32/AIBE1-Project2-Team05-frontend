// /public/js/api/communityApi.js
import { apiClient } from './apiClient.js';

export const communityApi = {
    // 게시글 목록 조회
    getList: (page = 0, size = 5, category = null, tag = null, sort = 'createdAt,desc') => {
        let endpoint = `/community/list?page=${page}&size=${size}&sort=${sort}`;
        if (category) endpoint += `&category=${category}`;
        if (tag) endpoint += `&tag=${tag}`;
        return apiClient.get(endpoint);
    },

    // 게시글 검색
    search: (keyword, page = 0, size = 10) => {
        return apiClient.get(`/community/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`);
    },

    // 인기 게시글 조회
    getPopular: (limit = 2, day = 2) => {
        return apiClient.get(`/community/popular?limit=${limit}&day=${day}`);
    },

    // 주간 인기 게시글 조회
    getWeeklyPopular: (limit = 5, day = 7) => {
        return apiClient.get(`/community/weekly-popular?limit=${limit}&day=${day}`);
    },

    // 인기 태그 조회
    getPopularTags: (limit = 10, days = 30) => {
        return apiClient.get(`/community/popular-tags?limit=${limit}&days=${days}`);
    },

    // 게시글 상세 조회
    getDetail: (postId) => {
        return apiClient.get(`/community/detail/${postId}`);
    },

    // 게시글 작성
    create: (postData) => {
        return apiClient.post('/community/new', postData);
    },

    // 게시글 수정
    update: (postId, postData) => {
        return apiClient.put(`/community/detail/${postId}`, postData);
    },

    // 게시글 삭제
    delete: (postId) => {
        return apiClient.delete(`/community/${postId}`);
    },

    // 게시글 좋아요 토글
    toggleLike: (postId) => {
        return apiClient.post(`/community/details/${postId}/like`);
    },

    // 게시글 북마크 토글
    toggleBookmark: (postId) => {
        return apiClient.post(`/community/details/${postId}/bookmark`);
    },

    // 댓글 목록 조회
    getComments: (postId, page = 0, size = 20) => {
        return apiClient.get(`/community/${postId}/comments?page=${page}&size=${size}`);
    },

    // 댓글 작성
    createComment: (postId, commentData) => {
        return apiClient.post(`/community/${postId}/comments`, commentData);
    },

    // 댓글 수정
    updateComment: (postId, commentId, commentData) => {
        return apiClient.put(`/community/comments/${postId}/${commentId}`, commentData);
    },

    // 댓글 삭제
    deleteComment: (postId, commentId) => {
        return apiClient.delete(`/community/comments/${postId}/${commentId}`);
    },

    // 답글 목록 조회
    getChildComments: (parentId, page = 0, size = 10) => {
        return apiClient.get(`/community/comments/${parentId}/replies?page=${page}&size=${size}`);
    },

    // 이미지 업로드
    uploadImages: (postId, formData) => {
        return apiClient.upload(`/community/${postId}/images`, formData);
    },

    // AI 답변 조회
    getAiComment: (postId) => {
        return apiClient.get(`/community/ai/${postId}`);
    }
};