import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetMember = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    // 요청 객체 가져오기
    const request = ctx.switchToHttp().getRequest();
    // JWT 전략에서 설정한 Member 객체 반환
    return request.member; 
  },
); 