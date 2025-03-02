import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { PostStats } from './entities/post-stats.entity';
import { PostStatus } from '@common/enums/post-status.enum';

@Injectable()
export class PostsRepository extends Repository<Post> {
    private readonly logger = new Logger(PostsRepository.name);
    constructor(
        @InjectRepository(Post)
        private readonly repository: Repository<Post>
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }

    async savePost(post: Post): Promise<Post> {
        return await this.repository.save(post);
    }

    // async findAllPosts(): Promise<Post[]> {
    //     return await this.repository.find();
    // }
    async findAllPosts(): Promise<Post[]> {
        return await this.repository
            .createQueryBuilder('post')
            // stats 테이블과 조인 필요
            .leftJoinAndSelect('post.stats', 'stats')
            .getMany();
    }

    async findPostByPublicId(public_id: string, withDeleted: boolean = false): Promise<Post | null> {
        const query = this.repository
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .leftJoinAndSelect('post.stats', 'stats')
            .leftJoinAndSelect('post.meta', 'meta')
            .where('post.public_id = :public_id', { public_id });

        if (withDeleted) {
            query.withDeleted();
        }

        // 실제 실행되는 SQL 쿼리 로깅
        // console.log('---------DEBUG--SQL Query:', query.getSql());
        // console.log('---------DEBUG--Parameters:', { public_id });

        const result = await query.getOne();
        this.logger.log('---------DEBUG--Raw Result:', result);

        return result;
    }

    // async createPost(post: Post): Promise<Post> {
    //     return await this.save(post);
    // }
    async createPost(post: Post): Promise<Post> {
        const savedPost = await this.save(post);
        
        // PostStats 생성
        const postStats = new PostStats();
        postStats.postId = savedPost.id;
        await this.manager.getRepository(PostStats).save(postStats);
        
        return savedPost;
    }

    async updatePost(post: Post): Promise<Post> {
        return await this.savePost(post);
    }

    async deletePost(public_id: string): Promise<void> {
          //    // 상태 코드만 반환
        //    await this.repository.delete({ public_id }); 하드 딜리트  
        // delete 대신 softDelete 사용
        // await this.repository.softDelete({ public_id });

            // 단일 쿼리로 처리
        // await this.repository
        //     .createQueryBuilder()
        //     .update(Post)
        //     .set({ 
        //         status: PostStatus.DELETED,
        //         deletedAt: new Date()
        //     })
        //     .where('public_id = :public_id', { public_id })
        //     .execute();
        await this.repository.manager.transaction(async (transactionalEntityManager) => {
            await transactionalEntityManager
                .createQueryBuilder()
                .update(Post)
                .set({ status: PostStatus.DELETED })
                .where('public_id = :public_id', { public_id })
                .execute();

            await transactionalEntityManager
                .softDelete(Post, { public_id });
        });

    
    }

    async incrementViewCount(public_id: string): Promise<void> {
        const post = await this.findPostByPublicId(public_id);
        if (!post) return;

        await this.manager.getRepository(PostStats)
            .createQueryBuilder()
            .update(PostStats)
            .set({
                viewCount: () => 'view_count + 1'
            })
            .where('postId = :postId', { postId: post.id })
            .execute();
    }

    // async findEntityByPublicId(public_id: string): Promise<Post | null> {
    //     return await this.repository
    //         .createQueryBuilder('post')
    //         .where('post.public_id = :public_id', { public_id })
    //         .getOne();
    // }

    async findEntityByPublicId(public_id: string): Promise<Post | null> {
        return await this.repository
            .createQueryBuilder('post')
            // stats 테이블과 조인 필요
            .leftJoinAndSelect('post.stats', 'stats')
            .where('post.public_id = :public_id', { public_id })
            .getOne();
    }
}
