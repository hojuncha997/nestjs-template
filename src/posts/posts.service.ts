import { Injectable } from '@nestjs/common';
import { PostsRepository } from './posts.repository';
@Injectable()
export class PostsService {
    constructor(private readonly postsRepository: PostsRepository) {}

    async findAllPosts(): Promise<Post[]> {
        return this.postsRepository.findAllPosts();
    }

    async findPostByUuId(uuid: string): Promise<Post | null> {
        return this.postsRepository.findPostByUuId(uuid);
    }

    async createPost(post: Post): Promise<Post> {
        return this.postsRepository.createPost(post);
    }

    async updatePost(uuid: string, post: Post): Promise<Post> {
        return this.postsRepository.updatePost(uuid, post);
    }

    async deletePost(uuid: string): Promise<void> {
        return this.postsRepository.deletePost(uuid);
    }
}