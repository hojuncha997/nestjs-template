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
        const clientType = request.body.clientType;

        if (clientType === ClientType.WEB) {
          if (data.refresh_token) {
            response.cookie('refresh_token', data.refresh_token, {
              httpOnly: true,
              secure: true,
              sameSite: 'strict',
              maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
            });
            delete data.refresh_token;
          }
        }

        return data;
      }),
    );
  }
} 