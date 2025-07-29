import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const GetMember = createParamDecorator(
  // (data: unknown, ctx: ExecutionContext) => {
  //   // 요청 객체 가져오기
  (optional: boolean = false, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // console.log('GetMember decorator - entire request:', request); // 전체 request 객체 확인
    // console.log('GetMember decorator - request.member:', request.member);
      // // JWT 전략에서 설정한 Member 객체 반환
      // return request.member; 
    
    if (!request.member && !optional) {
      throw new UnauthorizedException('Member not found');
    }
    
    return request.member;
  },
); 