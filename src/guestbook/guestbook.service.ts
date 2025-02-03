import { Injectable } from '@nestjs/common';
import { GuestbookRepository } from './guestbook.repository';
import { CreateGuestbookDto } from './dtos/create-guestbook.dto';
import { UpdateGuestbookDto } from './dtos/update-guestbook.dto';
import { GuestbookResponseDto } from './dtos/guestbook-response.dto';
import { GuestbookMapper } from './mappers/guestbook.mapper';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { GetGuestbooksQueryDto } from './dtos/get-guestbook-query.dto';
import { QUERY_CONSTANTS } from '@common/constants/query-constants.contant';
import { Member } from '../members/entities/member.entity';

@Injectable()
export class GuestbookService {
    constructor(
        private readonly guestbookRepository: GuestbookRepository, 
        private readonly guestbookMapper: GuestbookMapper
    ) {}

    // async findAllPosts(): Promise<PostResponseDto[]> {
    //     const posts = await this.postsRepository.findAllPosts();
    //     return this.postMapper.toDtoList(posts);
    // }

    async findGuestbooks(query: GetGuestbooksQueryDto) {
        const { MAX_QUERY_LIMIT, DEFAULT_QUERY_LIMIT, DEFAULT_QUERY_PAGE } = QUERY_CONSTANTS;

        const limit = Math.min(query.limit || DEFAULT_QUERY_LIMIT, MAX_QUERY_LIMIT);
        const page = Math.max(query.page || DEFAULT_QUERY_PAGE, 1);

        // 쿼리 빌더 생성
        const queryBuilder = this.guestbookRepository.createQueryBuilder('guestbook');

            // 시작일 필터
        if (query.startDate) {
            queryBuilder.andWhere('guestbook.createdAt >= :startDate', { 
                startDate: new Date(query.startDate) 
            });
        }

        // 종료일 필터
        if (query.endDate) {
            // 종료일의 경우 해당 날짜의 끝(23:59:59)까지 포함
            const endDate = new Date(query.endDate);
            endDate.setHours(23, 59, 59, 999);
            
            queryBuilder.andWhere('guestbook.createdAt <= :endDate', { 
                endDate 
            });
        }
        
        // 검색어
        if (query.search) {
            queryBuilder.where('guestbook.title ILIKE :search', { search: `%${query.search}%` });
        }
    
        // 카테고리 필터
        if (query.category) {
            queryBuilder.andWhere('guestbook.category = :category', { category: query.category });
        }
    
        // 상태 필터
        if (query.status) {
            queryBuilder.andWhere('guestbook.status = :status', { status: query.status });
        }
    
        // 태그 필터
        if (query.tag) {
            queryBuilder.andWhere(':tag = ANY(guestbook.tags)', { tag: query.tag });
        }
    
        // 정렬
        if (query.sortBy) {
            //쿼리 파라미터인 sortBy를 입력하는 경우 ASC만 사용. order는DESC
            queryBuilder.orderBy(`guestbook.${query.sortBy}`, query.order);
        } else {
            queryBuilder.orderBy('guestbook.createdAt', 'DESC');
        }
    
        // 페이지네이션
        // 필터링 된 총 게시글 수
        const total = await queryBuilder.getCount();
        // 필터링 된 게시글 목록
        const posts = await queryBuilder
            // 건너 뛸 레코드 수
            .skip((page - 1) * limit)
            // 가져올 레코드 수: 기본 20개 설정
            .take(limit)
            // TypeORM의 메서드. 쿼리 결과를 엔티티 객체의 배열로 반환
            .getMany();
    
        return {
            //posts: posts,
            posts: this.guestbookMapper.toDtoList(posts),
            // 메타 데이터
            meta: {
                total,
                page: page,
                limit: limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async findGuestbookByUuid(uuid: string): Promise<GuestbookResponseDto | null> {
        const guestbookEntity = await this.guestbookRepository.findGuestbookByUuid(uuid);
        if (!guestbookEntity) {
            throw new NotFoundException(`Guestbook with UUID "${uuid}" not found`);
        }

        return this.guestbookMapper.toDto(guestbookEntity);
    }

    async createGuestbook(guestbookDto: CreateGuestbookDto, member: Member): Promise<GuestbookResponseDto> {
        const guestbook = this.guestbookMapper.toEntity(guestbookDto);

        const displayName = member.nickname || member.email;
          // 작성자 정보 추가
        guestbook.author = member;
        guestbook.author_id = member.id;
        guestbook.author_display_name = displayName;
        guestbook.current_author_name = displayName;

        const savedGuestbook = await this.guestbookRepository.createGuestbook(guestbook);
        return this.guestbookMapper.toDto(savedGuestbook);
    }

    async updateGuestbook(uuid: string, guestbookDto: UpdateGuestbookDto, member: Member): Promise<GuestbookResponseDto> {
        const guestbook = await this.guestbookRepository.findGuestbookByUuid(uuid);
        if (!guestbook) {
            throw new NotFoundException('방명록을 찾을 수 없습니다.');
        }
        
        // 작성자 본인만 수정 가능
        if (guestbook.author_id !== member.id) {
            throw new ForbiddenException('방명록을 수정할 권한이 없습니다.');
        }

        const updatedGuestbook = this.guestbookMapper.updateEntity(guestbook, guestbookDto);
        const savedGuestbook = await this.guestbookRepository.updateGuestbook(updatedGuestbook);
        return this.guestbookMapper.toDto(savedGuestbook);
    }

    async deleteGuestbook(uuid: string, member: Member): Promise<void> {
        const guestbook = await this.guestbookRepository.findGuestbookByUuid(uuid);
        if (!guestbook) {
            throw new NotFoundException('방명록을 찾을 수 없습니다.');
        }

        // 작성자 본인만 삭제 가능
        if (guestbook.author_id !== member.id) {
            throw new ForbiddenException('방명록을 삭제할 권한이 없습니다.');
        }

        await this.guestbookRepository.deleteGuestbook(uuid);
    }


    // Member 정보 업데이트 시 호출되는 메서드
    async updateAuthorDisplayNames(userId: number, newDisplayName: string) {
        await this.guestbookRepository.update(
            { author_id: userId },
            { current_author_name: newDisplayName }
        );
    }
}