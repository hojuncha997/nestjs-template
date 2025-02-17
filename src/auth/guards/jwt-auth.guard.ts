import { Injectable, UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../decorators/auth/public.decorator';
import { MembersService } from '../../members/members.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {  // 여기서의 'jwt(기본값)' 문자열이 Passport가 jwtStrategy를 찾는 키가 된다. 이 키는 jwt.strategy.ts에서 설정한 전략 이름과 일치해야 한다.
  constructor(
    private reflector: Reflector,
    private membersService: MembersService
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    console.log('Auth Header:', authHeader);

    // 토큰이 있는 경우 검증 및 member 설정 시도
    if (authHeader) {
      try {
        const result = (await super.canActivate(context)) as boolean;
        
        if (result) {
          const user = request.user;
          const member = await this.membersService.findOneByUuid(user.uuid);
          
          if (member && member.tokenVersion === user.tokenVersion) {
            request.member = member;
            console.log('Member found and set:', member.uuid);
          }
        }
      } catch (error) {
        // Public 엔드포인트면 에러를 무시
        if (!isPublic) {
          throw error;
        }
      }
    }

    // Public 엔드포인트면 토큰이 없거나 검증 실패해도 true
    if (isPublic) {
      return true;
    }

    // Private 엔드포인트면 member 존재 여부로 판단
    return !!request.member;
  }
}







// import { Injectable, UnauthorizedException, ExecutionContext } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';
// import { Reflector } from '@nestjs/core';
// import { IS_PUBLIC_KEY } from '../../decorators/auth/public.decorator';
// import { MembersService } from '../../members/members.service';

// @Injectable()
// export class JwtAuthGuard extends AuthGuard('jwt') {  // 여기서의 'jwt(기본값)' 문자열이 Passport가 jwtStrategy를 찾는 키가 된다. 이 키는 jwt.strategy.ts에서 설정한 전략 이름과 일치해야 한다.
//   constructor(
//     private reflector: Reflector,
//     private membersService: MembersService
//   ) {
//     super();
//   }

//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     // Public 데코레이터 체크
//     // JwtAuthGuard에서 reflector를 사용하여 현재 컨트롤러 또는 메서드에 적용된 Public 데코레이터를 찾는다.
    
//     // 리플렉터(Reflector)
//     // - NestJS에서 제공하는 메타데이터 처리 기능을 제공하는 헬퍼 클래스
//     // - 리플렉션(reflection)은 프로그램 실행 중(런타임)에 프로그램 자신의 구조와 동작을 검사하고 수정할 수 있는 기능
    
//     // getAllAndOverride<boolean>()
//     // - 여러 대상(메서드, 클래스)에서 메타데이터를 찾고 첫 번째로 발견된 값을 반환
//     // - 메서드 레벨의 데코레이터가 클래스 레벨의 데코레이터보다 우선순위가 높음
//     const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
//       context.getHandler(), // 메서드 레벨 메타데이터 확인
//       context.getClass(),   // 클래스 레벨 메타데이터 확인
//     ]);

//     try {
//       // JWT 검증 시도
//       const result = (await super.canActivate(context)) as boolean;
//       console.log('--------------------------------result:', result);

//       // 인증 성공 시
//       if (result) {
//         console.log('--------------------------------result:', result);
//         // 요청 객체 가져오기
//         const request = context.switchToHttp().getRequest();
//         // console.log('-----------------요청객체 가져오기----request:', request);
//         // JWT 전략에서 설정한 Member 객체 반환
//         const user = request.user;
//         // DB에서 현재 회원의 토큰 버전 조회 및 검증
//         const member = await this.membersService.findOneByUuid(user.uuid);
//         // 회원이 존재하고 토큰 버전이 일치하면 요청 객체에 회원 정보 추가
//         if (member && member.tokenVersion === user.tokenVersion) {
//           request.member = member;
//         }
//       }

//     } catch (error) {
//       // JWT 검증 실패시 무시
//       if (!isPublic) {
//         throw error;
//       }
//     }

//     // Public 엔드포인트면 항상 true 반환
//     if (isPublic) {
//       return true;
//     }

//     // Private 엔드포인트면 member 존재 여부로 판단
//     const request = context.switchToHttp().getRequest();
//     return !!request.member;
//   }
// }









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