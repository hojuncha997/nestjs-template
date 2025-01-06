// src/members/mappers/member.mapper.ts
// 멤버 매퍼: Entity와 DTO 간의 변환을 담당
// 데이터 계층과 표현 계층 사이의 데이터 변환을 중앙화하여 관리

import { Member } from '../entities/member.entity';
import { MemberResponseDto } from '../dto/member-response.dto';
import { CreateMemberDto } from '../dto/create-member.dto';
import { UpdateMemberDto } from '../dto/update-member.dto';
import { AuthProvider, MemberStatus } from '@common/enums';

export class MemberMapper {
  // Entity를 ResponseDTO로 변환
  static toDto(member: Member): MemberResponseDto {
    const dto = new MemberResponseDto();
    dto.uuid = member.uuid;
    dto.email = member.email;
    dto.tokenVersion = member.tokenVersion;
    dto.name = member.name;
    dto.nickname = member.nickname;
    dto.phoneNumber = member.phoneNumber;
    dto.provider = member.provider;
    dto.emailVerified = member.emailVerified;
    dto.profileImage = member.profileImage;
    dto.status = member.status;
    dto.lastLoginAt = member.lastLoginAt;
    dto.termsAgreed = member.termsAgreed;
    dto.termsAgreedAt = member.termsAgreedAt;
    dto.marketingAgreed = member.marketingAgreed;
    dto.marketingAgreedAt = member.marketingAgreedAt;
    dto.notificationSettings = member.notificationSettings;
    dto.preferences = member.preferences;
    dto.createdAt = member.createdAt;
    dto.updatedAt = member.updatedAt;
    dto.points = member.points;

    dto.levelInfo = member.levelInfo;
    dto.role = member.role;
    return dto;
  }

  // DTO 목록을 ResponseDTO 목록으로 변환
  static toDtoList(members: Member[]): MemberResponseDto[] {
    return members.map(member => this.toDto(member));
  }

  // DTO를 Entity로 변환 (생성/수정 시 사용)
  static toEntity(dto: CreateMemberDto | UpdateMemberDto): Partial<Member> {
    const entity = new Member();
    if (dto.email) entity.email = dto.email;
    if (dto.password) entity.password = dto.password;
    
    // 약관 동의 처리
    if ('termsAgreed' in dto) {
      entity.termsAgreed = dto.termsAgreed;
      entity.termsAgreedAt = new Date();
    }
    
    if ('marketingAgreed' in dto) {
      entity.marketingAgreed = dto.marketingAgreed;
      entity.marketingAgreedAt = new Date();
    }

    // 기본값 설정
    entity.provider = AuthProvider.LOCAL;
    entity.status = MemberStatus.ACTIVE;
    
    return entity;
  }
} 