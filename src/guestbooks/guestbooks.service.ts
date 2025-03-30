import { Injectable, Logger } from '@nestjs/common';
import { GuestbooksRepository } from './guestbooks.repository';
import { CreateGuestbookDto } from './dtos/create-guestbook.dto';
import { UpdateGuestbookDto } from './dtos/update-guestbook.dto';
import { GuestbookDetailResponseDto } from './dtos/guestbook-detail-response.dto';
import { GuestbooksMapper } from './mappers/guestbooks.mapper';
import { NotFoundException } from '@nestjs/common';
import { GetGuestbooksQueryDto } from './dtos/get-guestbook-query.dto';
import { QUERY_CONSTANTS } from '@common/constants/query-constants.contant';
import { Member } from '@members/entities/member.entity';
import { ForbiddenException } from '@nestjs/common';
import { GuestbookListResponseDto } from './dtos/guestbook-list-response.dto';
import { ListResponse } from '@common/types/list-response.types';
import { LessThan, MoreThan, Brackets, Like } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { MemberStatus } from '@common/enums';
import { Guestbook } from './entities/guestbook.entity';
import { GuestbookCategory } from '@category/entities/guestbook-category.entity';
import { GuestbookStatsRepository } from './guestbook-stats.repository';
import { GuestbookMetaRepository } from './guestbook-meta.repository';  
import { GuestbookCategoryRepository } from '@category/repositories/guestbook-category.repository';

@Injectable()
export class GuestbooksService {
    private readonly logger = new Logger(GuestbooksService.name);

    constructor(
        private readonly guestbooksRepository: GuestbooksRepository, 
        private readonly guestbooksMapper: GuestbooksMapper,
        private readonly guestbookStatsRepository: GuestbookStatsRepository,
        private readonly guestbookMetaRepository: GuestbookMetaRepository,
        private readonly categoryRepository: GuestbookCategoryRepository
    ) {}

    async findGuestbookList(query: GetGuestbooksQueryDto): Promise<
    ListResponse<GuestbookListResponseDto>
    > {
        this.logger.log('---------@@@--query from service:', query);
        const { MAX_QUERY_LIMIT, DEFAULT_QUERY_LIMIT, DEFAULT_QUERY_PAGE } = QUERY_CONSTANTS;

        const limit = Math.min(query.limit || DEFAULT_QUERY_LIMIT, MAX_QUERY_LIMIT);
        const page = Math.max(query.page || DEFAULT_QUERY_PAGE, 1);

        const queryBuilder = this.guestbooksRepository.createQueryBuilder('guestbook')
            .leftJoinAndSelect('guestbook.stats', 'stats')
            .leftJoinAndSelect('guestbook.meta', 'meta')
            .leftJoinAndSelect('guestbook.category', 'category')
            .leftJoinAndSelect('guestbook.author', 'author');

        if (query.startDate) {
            queryBuilder.andWhere('guestbook.createdAt >= :startDate', { 
                startDate: new Date(query.startDate) 
            });
        }

        if (query.endDate) {
            const endDate = new Date(query.endDate);
            endDate.setHours(23, 59, 59, 999);
            
            queryBuilder.andWhere('guestbook.createdAt <= :endDate', { 
                endDate 
            });
        }
        
        if (query.search) {
            queryBuilder.andWhere('guestbook.title ILIKE :search', { search: `%${query.search}%` });
        }
    
        if (query.categorySlug) {
            const category = await this.categoryRepository.findOne({
                where: { slug: query.categorySlug }
            });
            
            this.logger.log('---------@@@--found category:', category);
            
            if (category) {
                const categoryPath = category.path;
                const subCategories = await this.categoryRepository
                    .createQueryBuilder('category')
                    .where('category.id = :categoryId', { categoryId: category.id })
                    .orWhere('category.path LIKE :pathPattern', { 
                        pathPattern: `${categoryPath}/%` 
                    })
                    .getMany();

                this.logger.log('---------@@@--found sub categories:', subCategories);

                if (subCategories.length > 0) {
                    const categoryIds = subCategories.map(cat => cat.id);
                    queryBuilder.andWhere('guestbook.category_id IN (:...categoryIds)', {
                        categoryIds
                    });
                } else {
                    queryBuilder.andWhere('guestbook.category_id = :categoryId', {
                        categoryId: category.id
                    });
                }
            }
        }
    
        if (query.status) {
            queryBuilder.andWhere('guestbook.status = :status', { status: query.status });
        }
    
        if (query.tag) {
            queryBuilder.andWhere(':tag = ANY(guestbook.tags)', { tag: query.tag });
        }
    
        if (query.sortBy) {
            switch (query.sortBy) {
                case 'createdAt':
                    queryBuilder.orderBy('guestbook.createdAt', query.order);
                    break;
                case 'viewCount':
                    queryBuilder
                        .addSelect('COALESCE(stats.view_count, 0)', 'view_count_order')
                        .orderBy('view_count_order', query.order)
                        .addOrderBy('guestbook.createdAt', 'DESC');
                    break;
                case 'likeCount':
                    queryBuilder
                        .addSelect('COALESCE(stats.like_count, 0)', 'like_count_order')
                        .orderBy('like_count_order', query.order)
                        .addOrderBy('guestbook.createdAt', 'DESC');
                    break;
                default:
                    queryBuilder.orderBy('guestbook.createdAt', 'DESC');
            }
        } else {
                queryBuilder.orderBy('guestbook.createdAt', 'DESC');
        }
    
        this.logger.log('---------@@@--final query:', queryBuilder.getSql());
        this.logger.log('---------@@@--query parameters:', queryBuilder.getParameters());

        const total = await queryBuilder.getCount();
        const guestbooks = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        this.logger.log('---------@@@--found guestbooks:', guestbooks);

        // 각 방명록의 current_author_name을 현재 멤버의 닉네임으로 업데이트
        guestbooks.forEach(guestbook => {
            if (guestbook.author) {
                guestbook.current_author_name = guestbook.author.nickname || guestbook.author.email;
            }
        });

        return {
            data: this.guestbooksMapper.toListDtoList(guestbooks),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    private async findGuestbookEntityByPublicId(public_id: string) {
        const guestbook = await this.guestbooksRepository.findOne({
            where: { public_id },
            relations: ['category', 'meta', 'stats', 'author']
        });

        if (guestbook && guestbook.author) {
            guestbook.current_author_name = guestbook.author.nickname || guestbook.author.email;
        }

        return guestbook;
    }

    async findGuestbookByPublicId(public_id: string, member?: Member) {
        const guestbookEntity = await this.findGuestbookEntityByPublicId(public_id);
        if (!guestbookEntity) {
            throw new NotFoundException(`Guestbook with ID "${public_id}" not found`);
        }

        if (!guestbookEntity.author || guestbookEntity.author.status === MemberStatus.WITHDRAWAL) {
            guestbookEntity.author = {
                ...guestbookEntity.author,
                nickname: '[withdrawn member]',
            } as Member;
            guestbookEntity.current_author_name = '[withdrawn member]';
        }

        const guestbookDetailResponseDto = this.guestbooksMapper.toDto(guestbookEntity);
        this.logger.log('---------@@@--guestbookDetailResponseDto: ', guestbookDetailResponseDto);

        return guestbookDetailResponseDto;
    }

    async incrementViewCount(public_id: string): Promise<void> {
        const guestbook = await this.guestbooksRepository.findOne({
            where: { public_id }
        });

        if (!guestbook) {
            throw new NotFoundException(`Guestbook with ID "${public_id}" not found`);
        }

        await this.guestbooksRepository.incrementViewCount(public_id);
    }

    async createGuestbook(createGuestbookDto: CreateGuestbookDto, member: Member): Promise<GuestbookDetailResponseDto> {
        let category: GuestbookCategory | null = null;
        if (createGuestbookDto.categorySlug) {
            category = await this.categoryRepository.findOne({
                where: { slug: createGuestbookDto.categorySlug }
            });
            
            if (!category) {
                throw new NotFoundException(`Category with slug "${createGuestbookDto.categorySlug}" not found`);
            }
        }

        const guestbookEntity = this.guestbooksMapper.toEntity(createGuestbookDto);
        
        if (category) {
            guestbookEntity.category = category;
        }

        const displayName = member.nickname || member.email;
        guestbookEntity.author = member;
        guestbookEntity.current_author_name = displayName;

        const savedGuestbook = await this.guestbooksRepository.createGuestbook(guestbookEntity);
        return this.guestbooksMapper.toDto(savedGuestbook);
    }

    async updateGuestbook(public_id: string, updateGuestbookDto: UpdateGuestbookDto, member: Member): Promise<GuestbookDetailResponseDto> {
        const guestbookEntity = await this.findGuestbookEntityByPublicId(public_id);
        if (!guestbookEntity) {
            throw new NotFoundException(`Guestbook with ID "${public_id}" not found`);
        }

        if (guestbookEntity.author.id !== member.id) {
            throw new ForbiddenException('You are not authorized to update this guestbook');
        }

        let category: GuestbookCategory | null = null;
        if (updateGuestbookDto.categorySlug) {
            category = await this.categoryRepository.findOne({
                where: { slug: updateGuestbookDto.categorySlug }
            });
            
            if (!category) {
                throw new NotFoundException(`Category with slug "${updateGuestbookDto.categorySlug}" not found`);
            }
        }

        const updatedGuestbook = this.guestbooksMapper.updateEntity(guestbookEntity, updateGuestbookDto);
        updatedGuestbook.current_author_name = member.nickname || member.email;

        if (category) {
            updatedGuestbook.category = category;
        }

        const savedGuestbook = await this.guestbooksRepository.updateGuestbook(updatedGuestbook);
        return this.guestbooksMapper.toDto(savedGuestbook);
    }

    async deleteGuestbook(public_id: string, member: Member): Promise<void> {
        const guestbookEntity = await this.findGuestbookEntityByPublicId(public_id);
        if (!guestbookEntity) {
            throw new NotFoundException(`Guestbook with ID "${public_id}" not found`);
        }

        if (guestbookEntity.author.id !== member.id) {
            throw new ForbiddenException('You are not authorized to delete this guestbook');
        }

        await this.guestbooksRepository.deleteGuestbook(public_id);
    }

    async updateAuthorDisplayNames(memberId: number, newDisplayName: string) {
        await this.guestbooksRepository.update(
            { author: { id: memberId } },
            { current_author_name: newDisplayName }
        );
    }
} 