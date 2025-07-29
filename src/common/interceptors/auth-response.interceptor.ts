// src/common/interceptors/auth-response.interceptor.ts
// 인증 응답 인터셉터
// 이 인터셉터는 auth.controller.ts에서 사용되며, 로그인 응답에 대한 처리를 담당.
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ClientType } from '@common/enums/client-type.enum';

@Injectable()
export class AuthResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const clientType = request.body.clientType || request.headers['x-client-type'];
        // const clientType = request.body.clientType;

        if (clientType === ClientType.WEB) {
          if (data.refresh_token) {
        
            response.cookie('refresh_token', data.refresh_token, {
              httpOnly: true,
              secure: true,
              sameSite: 'strict',
              // keepLoggedIn 여부에 따라 쿠키 만료 시간 설정:
              // keepLoggedIn이 true인 경우 7일, false인 경우 세션 쿠키로 설정.
              maxAge: data.keepLoggedIn ? 7 * 24 * 60 * 60 * 1000 : undefined,
            });
            delete data.refresh_token;
            delete data.keepLoggedIn;
          }
        }

        return data;
      }),
    );
  }
} 