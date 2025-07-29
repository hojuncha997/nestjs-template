# 빌드 스테이지: 소스 코드를 컴파일하고 프로덕션 배포를 위한 결과물 생성
FROM node:20.18-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# 빌드에 필요한 도구 설치 (C/C++ 기반 네이티브 모듈 컴파일에 필요)
RUN apk add --no-cache python3 make g++

# pnpm 패키지 매니저 설치 (npm보다 빠르고 효율적인 의존성 관리)
RUN npm install -g pnpm

# 패키지 정의 파일 복사 및 의존성 설치 (레이어 캐싱 최적화)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# 모든 소스 코드 복사
COPY . .

# bcrypt 네이티브 모듈 직접 빌드 (플랫폼 호환성 문제 방지)
RUN cd node_modules/bcrypt && npm install --build-from-source

# TypeScript 컴파일 및 애플리케이션 빌드
RUN pnpm run build

# ========================================================

# 실행 스테이지: 경량화된 프로덕션 환경 구성
FROM node:20.18-alpine
WORKDIR /app

# 타임존 설정 (시간 관련 문제 해결을 위한 설정)
# 기본적으로 Docker 컨테이너는 UTC 시간대를 사용
# 토큰 발급, 소셜 로그인, DB 타임스탬프 등에서 시간대 불일치 문제가 발생할 경우 주석을 해제
# - UTC 유지(권장): 국제 표준시 사용으로 시스템 간 일관성 유지 (주석 유지)
# - KST 사용: 한국 기준 시간 적용 시 'ENV TZ=Asia/Seoul' 주석 해제
# - 기타 지역: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones 참조
# ENV TZ=Asia/Seoul

# 빌드 도구 설치 (bcrypt 실행 환경에 필요한 네이티브 의존성)
RUN apk add --no-cache python3 make g++

# pnpm 패키지 매니저 설치
RUN npm install -g pnpm

# 프로덕션 모드로 의존성 설치 (개발 의존성 제외하여 이미지 크기 최소화)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod

# 빌더 스테이지에서 컴파일된 JavaScript 결과물만 복사
COPY --from=builder /app/dist ./dist

# bcrypt 모듈 복사 (네이티브 모듈은 별도로 복사 필요)
COPY --from=builder /app/node_modules/bcrypt ./node_modules/bcrypt

# 애플리케이션 포트 노출
EXPOSE 3000

# 애플리케이션 실행 명령
CMD ["node", "dist/src/main.js"]