import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostComment } from '../entities/post-comment.entity';
import { PostStats } from '../entities/post-stats.entity';
import { PostsRepository } from '../posts.repository';
import { Member } from '@members/entities/member.entity';
import { CreateCommentDto } from '../dtos/create-comment.dto';
import { UpdateCommentDto } from '../dtos/update-comment.dto';

@Injectable()
export class PostCommentService {
  private readonly logger = new Logger(PostCommentService.name);

  constructor(
    @InjectRepository(PostComment)
    private readonly commentRepository: Repository<PostComment>,
    @InjectRepository(PostStats)
    private readonly postStatsRepository: Repository<PostStats>,
    private readonly postsRepository: PostsRepository,
  ) {}

  async createComment(
    publicId: string,
    createCommentDto: CreateCommentDto,
    member: Member
  ): Promise<PostComment> {
    const post = await this.postsRepository.findPostByPublicId(publicId);
    
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    let parentComment = null;
    if (createCommentDto.parentCommentId) {
      parentComment = await this.commentRepository.findOne({
        where: { id: createCommentDto.parentCommentId },
      });
      
      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const comment = await this.commentRepository.save({
      postId: post.id,
      memberId: member.id,
      content: createCommentDto.content,
      parentCommentId: createCommentDto.parentCommentId,
    });

    // 최상위 댓글(부모 댓글이 없는 경우)만 댓글 수에 포함
    if (!createCommentDto.parentCommentId) {
      await this.updateCommentCount(post.id, 1);
    }

    return this.commentRepository.findOne({
      where: { id: comment.id },
      relations: ['member'],
    });
  }

  async updateComment(
    commentId: number,
    updateCommentDto: UpdateCommentDto,
    member: Member
  ): Promise<PostComment> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['member'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.memberId !== member.id) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    comment.content = updateCommentDto.content;
    comment.isEdited = true;

    return await this.commentRepository.save(comment);
  }

  async deleteComment(commentId: number, member: Member): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.memberId !== member.id && member.role !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentRepository.softDelete(commentId);
    
    // 최상위 댓글(부모 댓글이 없는 경우)만 댓글 수에서 차감
    if (!comment.parentCommentId) {
      await this.updateCommentCount(comment.postId, -1);
    }
  }

  async getCommentsByPost(
    publicId: string,
    page: number = 1,
    limit: number = 20
  ) {
    const post = await this.postsRepository.findPostByPublicId(publicId);
    
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const [comments, total] = await this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.member', 'member')
      .leftJoinAndSelect('comment.replies', 'replies')
      .leftJoinAndSelect('replies.member', 'repliesMember')
      .where('comment.postId = :postId', { postId: post.id })
      .andWhere('comment.parentCommentId IS NULL')
      .orderBy('comment.createdAt', 'DESC')
      .take(limit)
      .skip((page - 1) * limit)
      .getManyAndCount();

    // 디버깅을 위한 로그
    this.logger.log('Found comments count:', comments.length);
    comments.forEach(comment => {
      this.logger.log(`Comment ID: ${comment.id}, parentCommentId: ${comment.parentCommentId}`);
    });

    return {
      comments: comments.map(comment => this.formatComment(comment)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCommentReplies(commentId: number, page: number = 1, limit: number = 10) {
    const [replies, total] = await this.commentRepository.findAndCount({
      where: { parentCommentId: commentId },
      relations: ['member'],
      order: { createdAt: 'ASC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      replies: replies.map(reply => this.formatComment(reply)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private formatComment(comment: PostComment) {
    return {
      id: comment.id,
      content: comment.content,
      isEdited: comment.isEdited,
      likeCount: comment.likeCount,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      member: {
        uuid: comment.member.uuid,
        nickname: comment.member.nickname,
        profileImage: comment.member.profileImage,
      },
      replies: comment.replies?.map(reply => ({
        id: reply.id,
        content: reply.content,
        isEdited: reply.isEdited,
        likeCount: reply.likeCount,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
        member: {
          uuid: reply.member.uuid,
          nickname: reply.member.nickname,
          profileImage: reply.member.profileImage,
        },
      })) || [],
      replyCount: comment.replies?.length || 0,
    };
  }

  private async updateCommentCount(postId: number, increment: number) {
    await this.postStatsRepository
      .createQueryBuilder()
      .update(PostStats)
      .set({
        commentCount: () => `comment_count + ${increment}`,
      })
      .where('post_id = :postId', { postId })
      .execute();
  }
}