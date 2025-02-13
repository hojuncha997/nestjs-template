import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';

@Injectable()
export class PostsRepository extends Repository<Post> {
    constructor(
        @InjectRepository(Post)
        private readonly repository: Repository<Post>
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }

    async savePost(post: Post): Promise<Post> {
        return await this.repository.save(post);
    }

    async findAllPosts(): Promise<Post[]> {
        return await this.repository.find();
    }

    async findPostByPublicId(public_id: string): Promise<Post | null> {
        // return await this.repository.findOne({ where: { public_id } });
        return await this.repository
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .where('post.public_id = :public_id', { public_id })
            .getOne();
    }

    async createPost(post: Post): Promise<Post> {
        return await this.save(post);
    }

    async updatePost(post: Post): Promise<Post> {
        return await this.savePost(post);
    }

    async deletePost(public_id: string): Promise<void> {
        await this.repository.delete({ public_id });
    }

    async incrementViewCount(public_id: string): Promise<void> {
        await this.repository
            .createQueryBuilder()
            .update(Post)
            .set({
                viewCount: () => 'view_count + 1'
            })
            .where('public_id = :public_id', { public_id })
            .execute();
    }

    async findEntityByPublicId(public_id: string): Promise<Post | null> {
        return await this.repository
            .createQueryBuilder('post')
            .where('post.public_id = :public_id', { public_id })
            .getOne();
    }
}
