import { Controller, Get, Post, Put, Delete, Param, Body, Query, BadRequestException, DefaultValuePipe, ParseIntPipe, Logger } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostLikeService } from './services/post-like.service';
import { PostCommentService } from './services/post-comment.service';
import { CreatePostDto } from './dtos/create-post.dto';
import { UpdatePostDto } from './dtos/update-post.dto';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { UpdateCommentDto } from './dtos/update-comment.dto';
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
    private readonly logger = new Logger(PostsController.name);
    constructor(
        
        private readonly postsService: PostsService,
        private readonly postLikeService: PostLikeService,
        private readonly postCommentService: PostCommentService,
    ) {}

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
        this.logger.log('---------!!!--포스팅 목록 조회');
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
        this.logger.log(`---------!!!--포스팅 상세 조회 Request ID: ${requestId}`);
        this.logger.log('---------!!!--member:', member);  // member 정보도 함께 출력

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
        this.logger.log('---------!!!--포스팅 수정');
        this.logger.log('---------!!!--public_id:', public_id);
        this.logger.log('---------!!!--member:', member.email);

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

        this.logger.log('---------!!!--포스팅 삭제');
        this.logger.log('---------!!!--public_id:', public_id);
        this.logger.log('---------!!!--member:', member.email);
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

    // 좋아요 상태 조회
    @Get(':public_id/like-status')
    @Public()
    @UseGuards(JwtAuthGuard)
    async getLikeStatus(
        @Param('public_id') public_id: string,
        @GetMember(true) member: Member | null
    ) {
        const decodedPublicId = decodeURIComponent(public_id);
        
        if (!decodedPublicId?.match(/^[a-z0-9]{10}$/i)) {
            throw new BadRequestException('Invalid public_id format');
        }

        if (!member) {
            return { isLiked: false };
        }

        const isLiked = await this.postLikeService.checkUserLiked(decodedPublicId, member.id);
        return { isLiked };
    }

    @Public()
    @Post(':public_id/views')
    async incrementViewCount(
        @Param('public_id') public_id: string
    ) {
        const decodedPublicId = decodeURIComponent(public_id);
        
        if (!public_id?.match(/^[a-z0-9]{10}$/i)) {
            throw new BadRequestException('Invalid public_id format');
        }

        await this.postsService.incrementViewCount(public_id);
        return { success: true };
    }

    // 좋아요 관련 엔드포인트들

    @Public()
    @Get(':public_id/likes')
    async getLikes(
        @Param('public_id') public_id: string,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
        @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number
    ) {
        const decodedPublicId = decodeURIComponent(public_id);
        
        if (!public_id?.match(/^[a-z0-9]{10}$/i)) {
            throw new BadRequestException('Invalid public_id format');
        }

        return await this.postLikeService.getLikesByPost(public_id, limit, offset);
    }


    @UseGuards(JwtAuthGuard)
    @Post(':public_id/likes')
    async toggleLike(
        @Param('public_id') public_id: string,
        @GetMember() member: Member
    ) {
        const decodedPublicId = decodeURIComponent(public_id);
        
        if (!public_id?.match(/^[a-z0-9]{10}$/i)) {
            throw new BadRequestException('Invalid public_id format');
        }

        return await this.postLikeService.toggleLike(public_id, member);
    }


    // 댓글 관련 엔드포인트들
    @Public()
    @Get(':public_id/comments')
    async getComments(
        @Param('public_id') public_id: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number
    ) {
        const decodedPublicId = decodeURIComponent(public_id);
        
        if (!public_id?.match(/^[a-z0-9]{10}$/i)) {
            throw new BadRequestException('Invalid public_id format');
        }

        return await this.postCommentService.getCommentsByPost(public_id, page, limit);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':public_id/comments')
    async createComment(
        @Param('public_id') public_id: string,
        @GetMember() member: Member,
        @Body() createCommentDto: CreateCommentDto
    ) {
        const decodedPublicId = decodeURIComponent(public_id);
        
        if (!public_id?.match(/^[a-z0-9]{10}$/i)) {
            throw new BadRequestException('Invalid public_id format');
        }

        return await this.postCommentService.createComment(public_id, createCommentDto, member);
    }

    @UseGuards(JwtAuthGuard)
    @Put('comments/:commentId')
    async updateComment(
        @Param('commentId', ParseIntPipe) commentId: number,
        @GetMember() member: Member,
        @Body() updateCommentDto: UpdateCommentDto
    ) {
        return await this.postCommentService.updateComment(commentId, updateCommentDto, member);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('comments/:commentId')
    async deleteComment(
        @Param('commentId', ParseIntPipe) commentId: number,
        @GetMember() member: Member
    ) {
        await this.postCommentService.deleteComment(commentId, member);
        return { success: true };
    }

    @Public()
    @Get('comments/:commentId/replies')
    async getCommentReplies(
        @Param('commentId', ParseIntPipe) commentId: number,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
    ) {
        return await this.postCommentService.getCommentReplies(commentId, page, limit);
    }


   
}