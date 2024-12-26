// src/members/repositories/members.repository.ts
// 멤버 리포지토리: 데이터베이스 접근을 담당하는 클래스
// TypeORM의 Repository를 래핑하여 도메인에 특화된 데이터 접근 메서드 제공

import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm'; 
import { Member } from '../entities/member.entity';

@Injectable()
export class MembersRepository {
  private repository: Repository<Member>;

  constructor(private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(Member);
  }

  // UUID로 단일 멤버 조회
  async findOne(uuid: string): Promise<Member | null> {
    return this.repository.findOne({ where: { uuid } });
  }

  // 내부용: ID로 단일 멤버 조회 (시스템 내부에서만 사용)
  async findOneById(id: number): Promise<Member | null> {
    return this.repository.findOne({ where: { id } });
  }

  // 이메일로 멤버 조회 (로그인, 중복 확인 등에 사용)
  async findByEmail(email: string): Promise<Member | null> {
    return this.repository.findOne({ where: { email } });
  }

  // 모든 멤버 목록 조회
  async findAll(): Promise<Member[]> {
    return this.repository.find();
  }

  // 새 멤버 생성
  async create(member: Partial<Member>): Promise<Member> {
    const newMember = this.repository.create(member);
    return this.repository.save(newMember);
  }

  // 멤버 정보 업데이트
  async save(member: Member): Promise<Member> {
    return this.repository.save(member);
  }

  // 멤버 삭제 (Soft Delete)
  async delete(uuid: string): Promise<{ affected?: number }> {
    return this.repository.softDelete({ uuid });
  }
} 