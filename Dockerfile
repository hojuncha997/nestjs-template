# 빌드 스테이지
FROM node:20.18-alpine AS builder

WORKDIR /app
RUN apk add --no-cache python3 make g++
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY . .
# bcrypt 수동 빌드 추가
RUN cd node_modules/bcrypt && npm install --build-from-source
RUN pnpm run build

# 실행 스테이지
FROM node:20.18-alpine
WORKDIR /app

# 빌드 도구 설치 (bcrypt 실행에 필요할 수 있음)
RUN apk add --no-cache python3 make g++
RUN npm install -g pnpm

# 프로덕션 의존성만 설치
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod

# 빌드 결과물만 복사
COPY --from=builder /app/dist ./dist
# bcrypt 모듈 복사
COPY --from=builder /app/node_modules/bcrypt ./node_modules/bcrypt

EXPOSE 3000
CMD ["node", "dist/src/main.js"]