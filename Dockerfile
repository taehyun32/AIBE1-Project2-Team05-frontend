FROM node:20-slim

WORKDIR /app

# 패키지 파일 복사 및 의존성 설치
COPY package*.json ./
RUN npm install

# 소스 코드 복사
COPY . .

# CSS 빌드 - build:css 명령 사용
RUN npm run build:css

# 개발 의존성 제거
RUN npm prune --production

# 비루트 사용자로 전환
USER node

ENV PORT=3000
EXPOSE 3000

CMD ["node", "src/server.js"]