/**
 * 오류 처리 미들웨어
 * 애플리케이션에서 발생하는 모든 오류를 처리합니다.
 */
const errorHandler = (err, req, res, next) => {
    console.error('Server Error:', err);

    // 오류 상태 코드가 설정되어 있으면 사용, 아니면 500으로 설정
    const statusCode = err.statusCode || 500;

    // 개발 환경에서는 오류 정보를 자세히 보여주고, 프로덕션에서는 간략히 표시
    const errorResponse = process.env.NODE_ENV === 'production'
        ? { message: 'Internal Server Error' }
        : { message: err.message, stack: err.stack };

    res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;