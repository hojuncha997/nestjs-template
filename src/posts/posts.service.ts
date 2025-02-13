import { Injectable } from '@nestjs/common';
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
import { LessThan, MoreThan } from 'typeorm';

@Injectable()
export class PostsService {
    constructor(
        private readonly postsRepository: PostsRepository, 
        private readonly postMapper: PostMapper
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
        const { MAX_QUERY_LIMIT, DEFAULT_QUERY_LIMIT, DEFAULT_QUERY_PAGE } = QUERY_CONSTANTS;

        const limit = Math.min(query.limit || DEFAULT_QUERY_LIMIT, MAX_QUERY_LIMIT);
        const page = Math.max(query.page || DEFAULT_QUERY_PAGE, 1);

        // 쿼리 빌더 생성
        const queryBuilder = this.postsRepository.createQueryBuilder('post');

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
            queryBuilder.where('post.title ILIKE :search', { search: `%${query.search}%` });
        }
    
        // 카테고리 필터
        if (query.category) {
            queryBuilder.andWhere('post.category = :category', { category: query.category });
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
            //쿼리 파라미터인 sortBy를 입력하는 경우 ASC만 사용. order는DESC
            queryBuilder.orderBy(`post.${query.sortBy}`, query.order);
        } else {
            queryBuilder.orderBy('post.createdAt', 'DESC');
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
    
        // return {
        //      //posts: posts,
        //     //  posts: this.postMapper.toDtoList(posts),
        //     //  메타 데이터
        //     posts: this.postMapper.toListDtoList(posts),
        //     meta: {
        //         total,
        //         page: page,
        //         limit: limit,
        //         totalPages: Math.ceil(total / limit)
        //     }
        // };

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





    async findPostByPublicId(public_id: string): Promise<PostDetailResponseDto | null> {
        const postEntity = await this.postsRepository.findPostByPublicId(public_id);
        if (!postEntity) {
            throw new NotFoundException(`Post with ID "${public_id}" not found`);
        }

        // 조회수 증가
        await this.postsRepository.incrementViewCount(public_id);
        return this.postMapper.toDto(postEntity);
    }

    async createPost(createPostDto: CreatePostDto, member: Member): Promise<PostDetailResponseDto> {
        const postEntity = this.postMapper.toEntity(createPostDto);
        const displayName = member.nickname || member.email;
        postEntity.author = member;
        postEntity.author_display_name = displayName;
        postEntity.current_author_name = displayName;
        
        const savedPost = await this.postsRepository.createPost(postEntity);
        return this.postMapper.toDto(savedPost);
    }

    async updatePost(public_id: string, updatePostDto: UpdatePostDto, member: Member): Promise<PostDetailResponseDto> {
        const existingPost = await this.postsRepository.findPostByPublicId(public_id);
        if (!existingPost) {
            throw new NotFoundException(`Post with ID "${public_id}" not found`);
        }

        if (existingPost.author.id !== member.id) {
            throw new ForbiddenException('게시글을 수정할 권한이 없습니다.');
        }
                
        const updatedPost = this.postMapper.updateEntity(existingPost, updatePostDto);
        const savedPost = await this.postsRepository.updatePost(updatedPost);
        return this.postMapper.toDto(savedPost);
    }

    async deletePost(public_id: string, member: Member): Promise<void> {
        const existingPost = await this.postsRepository.findPostByPublicId(public_id);
        if (!existingPost) {
            throw new NotFoundException(`Post with ID "${public_id}" not found`);
        }

        if (existingPost.author.id !== member.id) {
            throw new ForbiddenException('게시글을 삭제할 권한이 없습니다.');
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
        const currentPost = await this.findPostByPublicId(publicId);
        
        const [prev, next] = await Promise.all([
            this.postsRepository.find({
                where: {
                    category: currentPost.category,
                    createdAt: LessThan(currentPost.createdAt)
                },
                order: { createdAt: 'DESC' },
                take: options.limit,
                select: [
                    'public_id', 'title', 'slug', 'category', 
                    'createdAt', 'thumbnail', 'excerpt'
                ]
            }),
            this.postsRepository.find({
                where: {
                    category: currentPost.category,
                    createdAt: MoreThan(currentPost.createdAt)
                },
                order: { createdAt: 'ASC' },
                take: options.limit,
                select: [
                    'public_id', 'title', 'slug', 'category', 
                    'createdAt', 'thumbnail', 'excerpt'
                ]
            })
        ]);

        return {
            prev: this.postMapper.toListDtoList(prev),
            next: this.postMapper.toListDtoList(next)
        };
    }
}