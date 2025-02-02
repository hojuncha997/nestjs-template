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

    async findPostByUuId(uuid: string): Promise<Post | null> {
        return await this.repository.findOne({ where: { uuid: uuid } });
    }

    async createPost(post: Post): Promise<Post> {
        return await this.savePost(post);
    }

    async updatePost(post: Post): Promise<Post> {
        return await this.savePost(post);
    }

    async deletePost(uuid: string): Promise<void> {
        await this.repository.delete(uuid);
    }
}
