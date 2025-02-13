import { Controller, Get, Post, Put, Delete, Param, Body, Query, BadRequestException, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dtos/create-post.dto';
import { UpdatePostDto } from './dtos/update-post.dto';
import { GetPostsQueryDto } from './dtos/get-post-query.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { Public } from '@decorators/auth/public.decorator';
import { GetMember } from '@decorators/auth/get-member.decorator';
import { Member } from '@members/entities/member.entity';
import { PostListResponseDto } from './dtos/post-list-response.dto';
import { ListResponse } from '@common/types/list-response.types';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
    constructor(private readonly postsService: PostsService) {}

    @Public()
    @Get()
    // async getPosts(@Query() query: GetPostsQueryDto) {
    async getPosts(@Query() query: GetPostsQueryDto): Promise<ListResponse<PostListResponseDto>> {
        // {
        // posts: PostListResponseDto[];
        // meta: {
        //     total: number;
        //     page: number;
        //     limit: number;
        //     totalPages: number;
        // };
    // }

        console.log('query', query);
        const result = await this.postsService.findPostList(query);
        console.log('result', result);
        return result;
    }

    @Public()
    @Get(':slugAndId')
    async getPost(@Param('slugAndId') slugAndId: string) {
        const decodedSlugAndId = decodeURIComponent(slugAndId);
        const lastHyphenIndex = decodedSlugAndId.lastIndexOf('-');
        const publicId = decodedSlugAndId.substring(lastHyphenIndex + 1);
        
        if (!publicId?.match(/^[a-z0-9]{10}$/i)) {
            throw new BadRequestException('Invalid public_id format');
        }
        
        return await this.postsService.findPostByPublicId(publicId);
    }

    

    @Post()
    async createPost(
        @GetMember() member: Member,
        @Body() post: CreatePostDto
    ) {
        return await this.postsService.createPost(post, member);
    }

    @Put(':public_id')
    async updatePost(
        @GetMember() member: Member,
        @Param('public_id') public_id: string,
        @Body() post: UpdatePostDto
    ) {
        return await this.postsService.updatePost(public_id, post, member);
    }

    @Delete(':public_id')
    async deletePost(
        @GetMember() member: Member,
        @Param('public_id') public_id: string
    ) {
        return await this.postsService.deletePost(public_id, member);
    }


    @Public()
    @Get(':public_id/navigation')
    async getPostNavigation(
        @Param('public_id') public_id: string,
        @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number
    ) {
        const decodedPublicId = decodeURIComponent(public_id);
        
        if (!public_id?.match(/^[a-z0-9]{10}$/i)) {
            throw new BadRequestException('Invalid public_id format');
        }

        return await this.postsService.getPostNavigation(public_id, { limit });
    }

   
}