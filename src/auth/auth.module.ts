import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersModule } from '../members/members.module';
import { AuthService } from './services/auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshToken } from './entities/refresh-token.entity';
import { AuthRepository } from './repositories/auth.repository';
import { Member } from '../members/entities/member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken, Member]),
    MembersModule,
    PassportModule,
    JwtModule.register({
      // JWT 토큰을 서명(sign)하고 검증(verify)하는 데 사용되는 비밀 키
      // 이 키를 사용해 토큰이 서버에서 발급된 것이 맞는지, 중간에 변조되지 않았는지 확인
      secret: 'your-secret-key', // 실제 환경에서는 환경변수로 관리 필요
      signOptions: { expiresIn: '1h' },// 토큰 만료 시간
    }),
  ],
  providers: [
    AuthService,
    AuthRepository,
    LocalStrategy,
    JwtStrategy
  ],
  controllers: [AuthController],
  exports: [AuthService]
})
export class AuthModule {}