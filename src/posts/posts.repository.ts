import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';

@Injectable()
export class PostsRepository {
    constructor(
        @InjectRepository(Post)
        private readonly postRepository: Repository<Post>,
    ) {}

    async findAllPosts(): Promise<Post[]> {
        return this.postRepository.find();
    }

    async findPostByUuId(uuid: string): Promise<Post | null> {
        return this.postRepository.findOne({ where: { uuid: uuid } });
    }

    async createPost(post: Post): Promise<Post> {
        return this.postRepository.save(post);
    }

    async updatePost(uuid: string, post: Post): Promise<Post> {
        await this.postRepository.update(uuid, post);
        return this.postRepository.findOne({ where: { uuid: uuid } });
    }

    async deletePost(uuid: string): Promise<void> {
        await this.postRepository.delete(uuid);
    }
}