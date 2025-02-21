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
// @UseGuards(JwtAuthGuard)
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

        // console.log('query', query);
        console.log('---------!!!--포스팅 목록 조회');
        const result = await this.postsService.findPostList(query);
        // console.log('result', result);
        return result;
    }

    @Get(':slugAndId')
    @Public()                  // Public 메타데이터를 먼저 설정
    @UseGuards(JwtAuthGuard)  // 그 다음 가드가 이 메타데이터를 확인
    async getPost(
        @Param('slugAndId') slugAndId: string,
        @GetMember(true) member: Member | null
    ) {
        const requestId = Date.now();
        console.log(`---------!!!--포스팅 상세 조회 Request ID: ${requestId}`);
        console.log('---------!!!--member:', member);  // member 정보도 함께 출력

        const decodedSlugAndId = decodeURIComponent(slugAndId);
        const lastHyphenIndex = decodedSlugAndId.lastIndexOf('-');
        const publicId = decodedSlugAndId.substring(lastHyphenIndex + 1);
        
        if (!publicId?.match(/^[a-z0-9]{10}$/i)) {
            throw new BadRequestException('Invalid public_id format');
        }

        return await this.postsService.findPostByPublicId(publicId, member);
    }

    

    @UseGuards(JwtAuthGuard)
    @Post()
    async createPost(
        @GetMember() member: Member,
        @Body() post: CreatePostDto
    ) {
        return await this.postsService.createPost(post, member);
    }

    @UseGuards(JwtAuthGuard)
    @Put(':public_id')
    async updatePost(
        @GetMember() member: Member,
        @Param('public_id') public_id: string,
        @Body() post: UpdatePostDto
    ) {
        const decodedPublicId = decodeURIComponent(public_id);
        
        if (!decodedPublicId?.match(/^[a-z0-9]{10}$/i)) {
            throw new BadRequestException('Invalid public_id format');
        }
        console.log('---------!!!--포스팅 수정');
        console.log('---------!!!--public_id:', public_id);
        console.log('---------!!!--member:', member.email);

        return await this.postsService.updatePost(public_id, post, member);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':public_id')
    async deletePost(
        @GetMember() member: Member,
        @Param('public_id') public_id: string
    ) {
        const decodedPublicId = decodeURIComponent(public_id);
        
        if (!decodedPublicId?.match(/^[a-z0-9]{10}$/i)) {
            throw new BadRequestException('Invalid public_id format');
        }

        console.log('---------!!!--포스팅 삭제');
        console.log('---------!!!--public_id:', public_id);
        console.log('---------!!!--member:', member.email);
        return await this.postsService.deletePost(decodedPublicId, member);
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

    @Public()
    @Get(':public_id/related')
    async getRelatedPosts(
        @Param('public_id') public_id: string,
        @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number
    ) {
        const decodedPublicId = decodeURIComponent(public_id);
        
        if (!public_id?.match(/^[a-z0-9]{10}$/i)) {
            throw new BadRequestException('Invalid public_id format');
        }

        return await this.postsService.getRelatedPosts(public_id, { limit });
    }
   
}