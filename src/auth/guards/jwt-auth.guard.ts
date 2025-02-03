import { Injectable, UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../decorators/auth/public.decorator';
import { MembersService } from '../../members/members.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private membersService: MembersService
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Public 데코레이터 체크
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // 기본 JWT 검증
    const result = (await super.canActivate(context)) as boolean;
    if (!result) {
      return false;
    }

    // 사용자 정보 및 토큰 버전 검증
    const request = context.switchToHttp().getRequest();
    const user = request.user;  // JWT payload에서 추출된 정보

    // DB에서 현재 회원 조회 및 검증
    const member = await this.membersService.findOneByUuid(user.uuid);
    if (!member || member.tokenVersion !== user.tokenVersion) {
      throw new UnauthorizedException('토큰이 더 이상 유효하지 않습니다.');
    }

    // 요청 객체에 검증된 member 정보 추가
    request.member = member;

    return true;
  }
}

// export class JwtAuthGuard extends AuthGuard('jwt') {
//   constructor(private membersService: MembersService) {
//     super();
//   }

//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     // 기본 JWT 검증
//     const result = (await super.canActivate(context)) as boolean;
//     if (!result) {
//       return false;
//     }
//     //jwt.strategy.ts에서 추출된 정보
//     const request = context.switchToHttp().getRequest();
//     console.log('--------------------------------request:', request);
//     const user = request.user;  // JWT payload에서 추출된 정보

//     // DB에서 현재 회원의 토큰 버전 조회 및 검증
//     // const member = await this.authService.findMemberByUuid(user.sub);
//     const member = await this.membersService.findOneByUuid(user.uuid);
//     console.log('--------------------------------member:', member);
//     if (!member || member.tokenVersion !== user.tokenVersion) {
//         console.log('--------------------------------member.tokenVersion:', member.tokenVersion);
//         console.log('--------------------------------user.tokenVersion:', user.tokenVersion);
//         console.log('--------------------------------user:', user);

//       throw new UnauthorizedException('토큰이 더 이상 유효하지 않습니다.');
//     }

//     return true;
//   }
// } 


/**
 * JWT 인증 가드의 동작 원리


이 가드는 다음과 같은 순서로 동작한다:

1. **요청 인터셉트**
- `JwtAuthGuard`는 NestJS의 가드 메커니즘을 통해 HTTP 요청이 라우트 핸들러에 도달하기 전에 인터셉트됩니다.
- `@UseGuards(JwtAuthGuard)` 데코레이터가 사용된 컨트롤러나 라우트에서 동작합니다.

2. **Passport JWT 전략 실행**
- `AuthGuard('jwt')`는 내부적으로 Passport의 JWT 전략을 실행합니다.
- JWT 전략은 일반적으로 다음과 같은 과정을 수행합니다:
  - 요청 헤더에서 'Authorization: Bearer {token}' 형식의 JWT 토큰을 추출
  - JWT 토큰의 유효성 검증
  - 토큰이 유효하면 디코딩된 페이로드를 사용자 객체로 변환

3. **인증 결과 처리**
- 인증 성공: 요청이 다음 단계로 진행됩니다.
- 인증 실패: `UnauthorizedException`이 발생하며 요청이 거부됩니다.

예시로 실제 사용되는 방식을 보여드리겠습니다:


`JwtAuthGuard`는 `@nestjs/passport`의 `AuthGuard` 클래스를 상속받아 다음과 같은 주요 메서드들을 사용할 수 있다:

- `canActivate()`: 요청 처리 가능 여부를 결정
- `handleRequest()`: 인증 결과 처리
- `getRequest()`: 요청 객체 획득
- `logIn()`: 사용자 로그인 처리

이러한 메서드들은 기본 구현체에서 자동으로 처리되므로, 대부분의 경우 별도의 구현 없이 `JwtAuthGuard`를 그대로 사용할 수 있다.

 * 
 */