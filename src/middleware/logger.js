/**
 * 요청 로깅 미들웨어
 * 모든 들어오는 요청을 콘솔에 기록합니다.
 */
const logger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
};

module.exports = logger;