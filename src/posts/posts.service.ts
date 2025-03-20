import { Injectable, Logger } from '@nestjs/common';
import { PostsRepository } from './posts.repository';
import { CreatePostDto } from './dtos/create-post.dto';
import { UpdatePostDto } from './dtos/update-post.dto';
import { PostDetailResponseDto } from './dtos/post-detail-response.dto';
import { PostMapper } from './mappers/post.mapper';
import { NotFoundException } from '@nestjs/common';
import { GetPostsQueryDto } from './dtos/get-post-query.dto';
import { QUERY_CONSTANTS } from '@common/constants/query-constants.contant';
import { Member } from '@members/entities/member.entity';
import { ForbiddenException } from '@nestjs/common';
import { PostListResponseDto } from './dtos/post-list-response.dto';
import { ListResponse } from '@common/types/list-response.types';
import { LessThan, MoreThan, Brackets, Like } from 'typeorm';
import { PostRelationRepository } from './post-relation.repository';
import { PostRelation } from './entities/post-relation.entity';
import { PostStats } from './entities/post-stats.entity';
import { PostStatsRepository } from './post-stats.repository';
import { PostMetaRepository } from './post-meta.repository';
import { PostMeta } from './entities/post-meta.entity';
import { BadRequestException } from '@nestjs/common';
import { MemberStatus } from '@common/enums';
import { Post } from './entities/post.entity';
import { PostCategoryRepository } from '@category/repositories/post-category.repository';
import { PostCategory } from '@category/entities/post-category.entity';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';


@Injectable()
export class PostsService {
    private readonly logger = new Logger(PostsService.name);

    constructor(
        private readonly postsRepository: PostsRepository, 
        private readonly postMapper: PostMapper,
        private readonly postRelationRepository: PostRelationRepository,
        // @InjectRepository(PostStats) // 만약 커스텀 레포지토리를 사용하지 않는 경우, 이처럼 typeorm의 기본 레포지토리를 사용해야 함
        // private readonly postStatsRepository: Repository<PostStats>
        // 커스텀 레포지토리에는 @InjectRepository 처리가 돼 있음.
        private readonly postStatsRepository: PostStatsRepository,
        private readonly postMetaRepository: PostMetaRepository,
        private readonly categoryRepository: PostCategoryRepository
    ) {}

    // async findAllPosts(): Promise<PostResponseDto[]> {
    //     const posts = await this.postsRepository.findAllPosts();
    //     return this.postMapper.toDtoList(posts);
    // }

    // async findPosts(query: GetPostsQueryDto) {
    async findPostList(query: GetPostsQueryDto): Promise<
    ListResponse<PostListResponseDto>
    // {
    //     posts: PostListResponseDto[];
    //     meta: {
    //         total: number;
    //         page: number;
    //         limit: number;
    //         totalPages: number;
    //     };
    // }
    > {
        this.logger.log('---------@@@--query from service:', query);
        const { MAX_QUERY_LIMIT, DEFAULT_QUERY_LIMIT, DEFAULT_QUERY_PAGE } = QUERY_CONSTANTS;

        const limit = Math.min(query.limit || DEFAULT_QUERY_LIMIT, MAX_QUERY_LIMIT);
        const page = Math.max(query.page || DEFAULT_QUERY_PAGE, 1);

        // 쿼리 빌더 생성
        const queryBuilder = this.postsRepository.createQueryBuilder('post')
            .leftJoinAndSelect('post.stats', 'stats')
            .leftJoinAndSelect('post.meta', 'meta')
            .leftJoinAndSelect('post.category', 'category');  // 카테고리 조인 추가



            // 시작일 필터
        if (query.startDate) {
            queryBuilder.andWhere('post.createdAt >= :startDate', { 
                startDate: new Date(query.startDate) 
            });
        }

        // 종료일 필터
        if (query.endDate) {
            // 종료일의 경우 해당 날짜의 끝(23:59:59)까지 포함
            const endDate = new Date(query.endDate);
            endDate.setHours(23, 59, 59, 999);
            
            queryBuilder.andWhere('post.createdAt <= :endDate', { 
                endDate 
            });
        }
        
        // 검색어
        if (query.search) {
            queryBuilder.andWhere('post.title ILIKE :search', { search: `%${query.search}%` });
        }
    
        // 카테고리 필터
        if (query.categorySlug) {
            const category = await this.categoryRepository.findOne({
                where: { slug: query.categorySlug }
            });
            
            this.logger.log('---------@@@--found category:', category);
            
            if (category) {
                // path가 '1/2' 형식이므로 이에 맞게 검색
                const subCategories = await this.categoryRepository.find({
                    where: [
                        { id: category.id },  // 현재 카테고리
                        { path: Like(`${category.path}/%`) }  // 하위 카테고리
                    ]
                });

                this.logger.log('---------@@@--found sub categories:', subCategories);

                const categoryIds = subCategories.map(cat => cat.id);
                queryBuilder.andWhere('category.id IN (:...categoryIds)', {
                    categoryIds
                });
            }
        }
    
        // 상태 필터
        if (query.status) {
            queryBuilder.andWhere('post.status = :status', { status: query.status });
        }
    
        // 태그 필터
        if (query.tag) {
            queryBuilder.andWhere(':tag = ANY(post.tags)', { tag: query.tag });
        }
    
        // 정렬
        if (query.sortBy) {
            switch (query.sortBy) {
                case 'createdAt':
                    queryBuilder.orderBy('post.createdAt', query.order);
                    break;
                case 'viewCount':
                    // 서브쿼리를 사용하여 정렬
                    queryBuilder
                        .addSelect('COALESCE(stats.view_count, 0)', 'view_count_order')  // stats는 이미 조인되어 있음
                        .orderBy('view_count_order', query.order)
                        .addOrderBy('post.createdAt', 'DESC');
                    break;
                case 'likeCount':
                    queryBuilder
                        .addSelect('COALESCE(stats.like_count, 0)', 'like_count_order')  // stats는 이미 조인되어 있음
                        .orderBy('like_count_order', query.order)
                        .addOrderBy('post.createdAt', 'DESC');
                    break;
                default:
                    queryBuilder.orderBy('post.createdAt', 'DESC');
            }
        } else {
            queryBuilder.orderBy('post.createdAt', 'DESC');
        }
    
        // 쿼리 실행 전
        this.logger.log('---------@@@--final query:', queryBuilder.getSql());  // 최종 SQL 쿼리 확인
        this.logger.log('---------@@@--query parameters:', queryBuilder.getParameters());  // 쿼리 파라미터 확인

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

        this.logger.log('---------@@@--found posts:', posts);  // 조회된 포스트 확인

        return {
            data: this.postMapper.toListDtoList(posts),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    // 내부용 (조회수 증가 없음)
    private async findPostEntityByPublicId(public_id: string) {
        return await this.postsRepository.findOne({
            where: { public_id },
            relations: ['category', 'meta', 'stats', 'author']  // author 관계 추가
        });
    }

    // 외부 API용 (조회수 증가 포함)
    async findPostByPublicId(public_id: string, member?: Member) {
        const postEntity = await this.findPostEntityByPublicId(public_id);
        if (!postEntity) {
            throw new NotFoundException(`Post with ID "${public_id}" not found`);
        }

        // 작성자가 탈퇴한 경우 처리
        if (!postEntity.author || postEntity.author.status === MemberStatus.WITHDRAWAL) {
            postEntity.author = {
                ...postEntity.author,
                nickname: '[withdrawn member]',
            } as Member;
        }

        // 조회수 증가
        await this.postsRepository.incrementViewCount(public_id);

        // DTO로 변환
        const postDetailResponseDto = this.postMapper.toDto(postEntity);
        this.logger.log('---------@@@--postDetailResponseDto: ', postDetailResponseDto);

        return postDetailResponseDto;
    }

    async createPost(createPostDto: CreatePostDto, member: Member): Promise<PostDetailResponseDto> {
        // 먼저 카테고리를 조회
        let category: PostCategory | null = null;
        if (createPostDto.categorySlug) {
            category = await this.categoryRepository.findOne({
                where: { slug: createPostDto.categorySlug }
            });
            
            if (!category) {
                throw new NotFoundException(`Category with slug "${createPostDto.categorySlug}" not found`);
            }
        }

        const postEntity = this.postMapper.toEntity(createPostDto);
        
        // 찾은 실제 카테고리 엔티티를 설정
        if (category) {
            postEntity.category = category;  // 이렇게 하면 category_id가 자동으로 설정
        }

        const displayName = member.nickname || member.email;
        postEntity.author = member;
        postEntity.author_display_name = displayName;
        postEntity.current_author_name = displayName;
        
        const savedPost = await this.postsRepository.createPost(postEntity);

        // PostStats 생성
        const postStats = new PostStats();
        postStats.postId = savedPost.id;
        await this.postStatsRepository.save(postStats);

        // PostMeta 생성
        const postMeta = new PostMeta();
        postMeta.postId = savedPost.id;
        postMeta.description = createPostDto.description;
        postMeta.excerpt = this.postMapper.generateExcerpt(createPostDto.content);
        postMeta.readingTime = Math.ceil(this.postMapper.extractTextFromContent(createPostDto.content).split(' ').length / 200);
        postMeta.coverImageAlt = createPostDto.coverImageAlt;
        postMeta.metaDescription = createPostDto.metaDescription;
        await this.postMetaRepository.save(postMeta);

        return this.postMapper.toDto(savedPost);
    }

    async updatePost(public_id: string, updatePostDto: UpdatePostDto, member: Member): Promise<PostDetailResponseDto> {
        // 모든 필요한 관계를 포함하여 포스트 조회
        const existingPost = await this.postsRepository.findOne({
            where: { public_id },
            relations: ['author', 'category', 'meta', 'stats']
        });

        if (!existingPost) {
            throw new NotFoundException(`Post with ID "${public_id}" not found`);
        }

        if (existingPost.author.id !== member.id) {
            throw new ForbiddenException('게시글을 수정할 권한이 없습니다.');
        }

        // 카테고리 업데이트 처리
        if (updatePostDto.categorySlug) {
            const category = await this.categoryRepository.findOne({
                where: { slug: updatePostDto.categorySlug }
            });
            
            if (!category) {
                throw new NotFoundException(`Category with slug "${updatePostDto.categorySlug}" not found`);
            }
            
            // 직접 category_id 설정
            existingPost.category = category;
            await this.postsRepository.update(existingPost.id, {
                category: { id: category.id }
            });
        }
            
        // 나머지 필드 업데이트
        const updatedPost = this.postMapper.updateEntity(existingPost, updatePostDto);
        await this.postsRepository.save(updatedPost);
        
        // 저장된 포스트를 다시 모든 관계와 함께 조회
        const refreshedPost = await this.findPostEntityByPublicId(public_id);
        
        return this.postMapper.toDto(refreshedPost);
    }

    async deletePost(public_id: string, member: Member): Promise<void> {
        // withDeleted: true로 설정하여 이미 삭제된 게시글도 조회 : 기본값은 false
        const existingPost = await this.postsRepository.findPostByPublicId(public_id, false);
        this.logger.log('---------!!!--public_id:', public_id);
        this.logger.log('---------!!!--existingPost:', existingPost);

        if (!existingPost) {
            throw new NotFoundException(`Post with ID "${public_id}" not found`);
        }

        if (existingPost.author.id !== member.id) {
            throw new ForbiddenException('게시글을 삭제할 권한이 없습니다.');
        }

        // 이미 삭제된 게시글인지 확인
        if (existingPost.deletedAt) {
            throw new BadRequestException('이미 삭제된 게시글입니다.');
        }

        await this.postsRepository.deletePost(public_id);
    }

    // Member 정보 업데이트 시 호출되는 메서드
    async updateAuthorDisplayNames(memberId: number, newDisplayName: string) {
        await this.postsRepository.update(
            { author: { id: memberId } },
            { current_author_name: newDisplayName }
        );
    }

    async getPostNavigation(publicId: string, options: { limit: number }) {
        // 현재 게시글 조회 시 category 관계를 명시적으로 포함
        const currentPost = await this.postsRepository.findOne({
            where: { public_id: publicId },
            relations: ['category']
        });

        if (!currentPost) {
            throw new NotFoundException('Post not found');
        }

        // 카테고리가 없는 경우 빈 결과 반환
        if (!currentPost.category) {
            return {
                prev: [],
                next: []
            };
        }

        // 이전/다음 게시글 조회
        const [prev, next] = await Promise.all([
            this.postsRepository.find({
                where: {
                    category: { id: currentPost.category.id },
                    createdAt: LessThan(currentPost.createdAt)
                },
                order: { createdAt: 'DESC' },
                take: options.limit,
                relations: ['meta', 'stats']
            }),
            this.postsRepository.find({
                where: {
                    category: { id: currentPost.category.id },
                    createdAt: MoreThan(currentPost.createdAt)
                },
                order: { createdAt: 'ASC' },
                take: options.limit,
                relations: ['meta', 'stats']
            })
        ]);

        return {
            prev: this.postMapper.toListDtoList(prev),
            next: this.postMapper.toListDtoList(next)
        };
    }

    /**
     * 특정 게시글의 연관 게시글 목록을 조회
     * 1. 수동으로 설정된 연관 게시글을 우선 조회
     * 2. 남은 개수만큼 자동으로 추천된 게시글을 조회 (같은 카테고리 + 태그 유사도 기반)
     * 
     * @param publicId 게시글의 public_id
     * @param options.limit 조회할 최대 게시글 수
     * @returns {manual: 수동설정된 연관글[], auto: 자동추천된 연관글[]}
     */
    async getRelatedPosts(publicId: string, options: { limit: number }) {
        // 현재 게시글 조회 시 category 관계를 명시적으로 포함
        const currentPost = await this.postsRepository.findOne({
            where: { public_id: publicId },
            relations: ['category']  // category 관계를 명시적으로 포함
        });

        if (!currentPost) {
            throw new NotFoundException('Post not found');
        }

        // 카테고리가 없는 경우 빈 결과 반환
        if (!currentPost.category) {
            return {
                manual: [],
                auto: []
            };
        }

        // 1. 수동으로 설정된 연관 게시글 조회
        // post_relation 테이블에서 isManual이 true인 관계만 조회
        const manuallyRelated = await this.postRelationRepository
            .createQueryBuilder('relation')
            .leftJoinAndSelect('relation.relatedPost', 'post')
            .where('relation.sourcePost = :postId', { postId: currentPost.id })
            .andWhere('relation.isManual = true')
            .take(options.limit)
            .getMany();

        // 2. 자동 추천 게시글 조회 (수동 설정된 게시글 수를 제외한 만큼)
        const remainingCount = options.limit - manuallyRelated.length;
        
        if (remainingCount > 0) {
            // 2-1. 같은 카테고리의 글을 최신순으로 조회
            const autoRelated = await this.postsRepository
                .createQueryBuilder('post')
                .where('post.id != :postId', { postId: currentPost.id })
                .andWhere('post.category.id = :categoryId', { 
                    categoryId: currentPost.category.id 
                })
                .orderBy('post.createdAt', 'DESC')
                .take(remainingCount)
                .getMany();

            // 2-2. 조회된 게시글들을 태그 일치도에 따라 재정렬
            // 현재 글과 공통 태그가 많은 순서대로 정렬
            const sortedByTags = autoRelated.sort((a, b) => {
                const aMatchCount = a.tags.filter(tag => currentPost.tags.includes(tag)).length;
                const bMatchCount = b.tags.filter(tag => currentPost.tags.includes(tag)).length;
                return bMatchCount - aMatchCount;
            });

            return {
                manual: this.postMapper.toListDtoList(manuallyRelated.map(r => r.relatedPost)),
                auto: this.postMapper.toListDtoList(sortedByTags)
            };
        }

        // 수동 설정된 게시글만 반환
        return {
            manual: this.postMapper.toListDtoList(manuallyRelated.map(r => r.relatedPost)),
            auto: []
        };
    }

    // 수동 연관 게시글 설정을 위한 메서드
    async setManualRelation(sourceId: string, relatedId: string) {
        const [sourcePost, relatedPost] = await Promise.all([
            this.postsRepository.findPostByPublicId(sourceId),
            this.postsRepository.findPostByPublicId(relatedId)
        ]);

        if (!sourcePost || !relatedPost) {
            throw new NotFoundException('Post not found');
        }

        const relation = new PostRelation();
        relation.sourcePost = sourcePost;
        relation.relatedPost = relatedPost;
        relation.isManual = true;

        return this.postRelationRepository.save(relation);
    }
}