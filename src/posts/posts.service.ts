import { Injectable } from '@nestjs/common';
import { PostsRepository } from './posts.repository';
import { CreatePostDto } from './dtos/create-post.dto';
import { UpdatePostDto } from './dtos/update-post.dto';
import { PostResponseDto } from './dtos/post-response.dto';
import { PostMapper } from './mappers/post.mapper';
import { NotFoundException } from '@nestjs/common';
import { GetPostsQueryDto } from './dtos/get-post-query.dto';
import { QUERY_CONSTANTS } from '@common/constants/query-constants.contant';

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

    async findPosts(query: GetPostsQueryDto) {
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
    
        return {
            //posts: posts,
            posts: this.postMapper.toDtoList(posts),
            // 메타 데이터
            meta: {
                total,
                page: page,
                limit: limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async findPostByUuid(uuid: string): Promise<PostResponseDto | null> {
        const postEntity = await this.postsRepository.findPostByUuid(uuid);
        if (!postEntity) {
            throw new NotFoundException(`Post with UUID "${uuid}" not found`);
        }

        return this.postMapper.toDto(postEntity);
    }

    async createPost(createPostDto: CreatePostDto): Promise<PostResponseDto> {
        const postEntity = this.postMapper.toEntity(createPostDto);
        const savedPost = await this.postsRepository.createPost(postEntity);
        return this.postMapper.toDto(savedPost);
    }

    async updatePost(uuid: string, updatePostDto: UpdatePostDto): Promise<PostResponseDto> {
        // const postEntity = this.postMapper.updateEntity(post);
        // const existingPost = await this.postRepository.findOneOrFail({ where: { id } });
        const existingPost = await this.postsRepository.findPostByUuid(uuid);
        if (!existingPost) {
            throw new NotFoundException(`Post with UUID "${uuid}" not found`);
        }
                
        const updatedPost = this.postMapper.updateEntity(existingPost, updatePostDto);
        const savedPost = await this.postsRepository.updatePost(updatedPost);
        return this.postMapper.toDto(savedPost);
    }

    async deletePost(uuid: string): Promise<void> {
        const existingPost = await this.postsRepository.findPostByUuid(uuid);
        if (!existingPost) {
            throw new NotFoundException(`Post with UUID "${uuid}" not found`);
        }

        await this.postsRepository.deletePost(uuid);
    }
}