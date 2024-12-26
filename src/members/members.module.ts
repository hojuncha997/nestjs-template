import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from './entities/member.entity';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { MembersRepository } from './repositories/members.repository';
import { EmailService } from '@common/services/email.service';

@Module({
  imports: [TypeOrmModule.forFeature([Member])],
  controllers: [MembersController],
  providers: [MembersService, MembersRepository, EmailService],
  exports: [MembersService],
})
export class MembersModule {} 