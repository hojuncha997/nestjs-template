import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dtos/create-post.dto';
import { UpdatePostDto } from './dtos/update-post.dto';
import { GetPostsQueryDto } from './dtos/get-post-query.dto';

@Controller('posts')
export class PostsController {
    constructor(private readonly postsService: PostsService) {}

    @Get()
    async getPosts(@Query() query: GetPostsQueryDto) {
        return await this.postsService.findPosts(query);
    }

    @Get(':uuid')
    async getPost(@Param('uuid') uuid: string) {
        return await this.postsService.findPostByUuId(uuid);
    }

    @Post()
    async createPost(@Body() post: CreatePostDto) {
        return await this.postsService.createPost(post);
    }

    @Put(':uuid')
    async updatePost(@Param('uuid') uuid: string, @Body() post: UpdatePostDto) {
        return await this.postsService.updatePost(uuid, post);
    }

    @Delete(':uuid')
    async deletePost(@Param('uuid') uuid: string) {
        return await this.postsService.deletePost(uuid);
    }
}
