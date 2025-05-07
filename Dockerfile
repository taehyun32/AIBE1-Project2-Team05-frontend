FROM node:20-slim

WORKDIR /app

# 패키지 파일 복사 및 의존성 설치
COPY package*.json ./
RUN npm install --production

# 소스 코드 복사
COPY . .

# CSS 빌드
RUN npm run build

# 비루트 사용자로 전환
USER node

ENV PORT=3000
EXPOSE 3000

# 헬스체크 설정
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["node", "src/server.js"]