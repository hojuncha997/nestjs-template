# 1. 로컬 로그인 시도 (POST /auth/local/login)

- 로컬 로그인 시도 시 회원 정보 검증 후 토큰 발급
- 토큰 발급 시 리프레시 토큰 발급
- 리프레시 토큰 발급 시 리프레시 토큰 테이블에 저장
- 리프레시 토큰 테이블에 저장 시 회원 정보 테이블에 저장
- 리프레시 토큰 테이블에 저장 시 회원 정보 테이블에 저장

# 2. LocalAuthGuard 동작
- @UseGuards(LocalAuthGuard)가 Passport local strategy 실행
- local.strategy.ts의 validate 메서드 호출
- validate 메서드는 authService.validateMember(email, password) 호출

# 3. 사용자 검증(AuthService.validateMember)
- 이메일로 사용자 조회
- 계정 잠금 확인
- 비밀번호 검증

# 4. 토큰 발급(AuthService.login)
- JWT 토큰 생성
- 기존 리프레시 토큰 무효화 후 새 토큰 저장

# 5. 응답 변환(AuthResponseInterceptor)
 - 웹 클라이언트의 경우
    if (clientType === ClientType.WEB) {
    response.cookie('refreshToken', data.refreshToken, {
        httpOnly: true,
        secure: true
    });
    delete data.refreshToken;
    }
- 모바일의 경우 refresh_token이 JSON 응답에 포함

# 6. 토큰 재발급(POST /auth/refresh)
- 리프레시 토큰 유효성 검증
- DB에서 토큰 조회 및 검증
- 새 토큰 발급 및 교체

# 7. 로그아웃(POST /auth/logout)
- JWT 인증 (JwtAuthGuard)
- 리프레시 토큰 무효화
    await this.authRepository.revokeRefreshToken(refreshToken);

# 8. 전체 로그아웃 (POST /auth/logout/all)
- JWT 인증
- 사용자의 모든 리프레시 토큰 무효화
    await this.authRepository.revokeAllRefreshTokens(userId);


------

주요 보안 기능:
- 리프레시 토큰은 DB에서 관리하여 즉시 무효화 가능
- 웹에서는 리프레시 토큰을 httpOnly 쿠키로 안전하게 저장
- 액세스 토큰 만료 시간을 짧게(15분) 설정
- 로그인 시도 횟수 제한과 계정 잠금
- 새 로그인 시 기존 리프레시 토큰 무효화
- 리프레시 토큰 만료 시 해당 사용자의 모든 토큰 무효화
