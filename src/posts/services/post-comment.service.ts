import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostComment } from '../entities/post-comment.entity';
import { CommentEditHistory } from '../entities/comment-edit-history.entity';
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
    @InjectRepository(CommentEditHistory)
    private readonly commentEditHistoryRepository: Repository<CommentEditHistory>,
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

    // Store edit history before updating
    await this.commentEditHistoryRepository.save({
      commentId: comment.id,
      previousContent: comment.content,
      editedById: member.id,
    });

    comment.content = updateCommentDto.content;
    comment.isEdited = true;

    return await this.commentRepository.save(comment);
  }

  async deleteComment(commentId: number, member: Member): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['replies'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.memberId !== member.id && member.role !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own comments');
    }

    // 모든 삭제를 isDeleted 플래그로 처리 (일관성과 추적성을 위해)
    comment.isDeleted = true;
    await this.commentRepository.save(comment);
    
    // 최상위 댓글이고 대댓글이 없는 경우만 댓글 수에서 차감
    // 대댓글이 있으면 구조 유지를 위해 카운트도 유지
    if (!comment.parentCommentId && (!comment.replies || comment.replies.length === 0)) {
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

    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.member', 'member')
      .leftJoinAndSelect('comment.replies', 'replies')
      .leftJoinAndSelect('replies.member', 'repliesMember')
      .where('comment.postId = :postId', { postId: post.id })
      .andWhere('comment.parentCommentId IS NULL');

    // 전체 댓글 가져오기 (필터링은 메모리에서)
    const allComments = await queryBuilder
      .orderBy('comment.createdAt', 'DESC')
      .getMany();

    // 삭제된 댓글 중 살아있는 대댓글이 없는 것은 필터링
    const filteredComments = allComments.filter(comment => {
      if (!comment.isDeleted) return true;
      
      // 삭제된 댓글이면 살아있는 대댓글이 있는지 확인
      const hasActiveReplies = comment.replies?.some(reply => !reply.isDeleted);
      return hasActiveReplies;
    });

    // 페이지네이션 적용
    const paginatedComments = filteredComments.slice((page - 1) * limit, page * limit);
    const total = filteredComments.length;

    return {
      comments: paginatedComments.map(comment => this.formatComment(comment)),
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
    const isDeleted = comment.isDeleted || false;
    
    return {
      id: comment.id,
      // 삭제된 댓글은 내용을 서버에서 숨김
      content: isDeleted ? null : comment.content,
      isEdited: isDeleted ? false : comment.isEdited,
      isDeleted,
      // 삭제된 댓글은 좋아요 수도 숨김
      likeCount: isDeleted ? 0 : comment.likeCount,
      // 삭제된 댓글은 시간 정보도 숨김
      createdAt: isDeleted ? null : comment.createdAt,
      updatedAt: isDeleted ? null : comment.updatedAt,
      member: isDeleted ? {
        // 삭제된 댓글은 작성자 정보도 제한적으로 제공
        uuid: null,
        nickname: null,
        profileImage: null,
      } : {
        uuid: comment.member.uuid,
        nickname: comment.member.nickname,
        profileImage: comment.member.profileImage,
      },
      replies: comment.replies?.map(reply => {
        const replyDeleted = reply.isDeleted || false;
        return {
          id: reply.id,
          content: replyDeleted ? null : reply.content,
          isEdited: replyDeleted ? false : reply.isEdited,
          isDeleted: replyDeleted,
          // 삭제된 대댓글도 좋아요 수 숨김
          likeCount: replyDeleted ? 0 : reply.likeCount,
          // 삭제된 대댓글은 시간 정보도 숨김
          createdAt: replyDeleted ? null : reply.createdAt,
          updatedAt: replyDeleted ? null : reply.updatedAt,
          member: replyDeleted ? {
            uuid: null,
            nickname: null,
            profileImage: null,
          } : {
            uuid: reply.member.uuid,
            nickname: reply.member.nickname,
            profileImage: reply.member.profileImage,
          },
        };
      }) || [],
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