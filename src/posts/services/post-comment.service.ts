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

  /**
   * 댓글 작성
   * 
   * 비밀 댓글 처리:
   * - 사용자가 isSecret: true로 설정하면 비밀 댓글로 저장
   * - 답글도 독립적으로 비밀 설정 가능
   * - 프론트엔드에서 부모 댓글이 비밀이면 답글도 기본적으로 비밀로 설정 (UX 개선)
   * 
   * @param publicId - 포스트 공개 ID
   * @param createCommentDto - 댓글 생성 DTO (content, parentCommentId, isSecret 포함)
   * @param member - 현재 로그인한 사용자
   */
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
      isSecret: createCommentDto.isSecret || false, // 비밀 댓글 설정
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

  /**
   * 포스트의 댓글 목록 조회
   * 
   * 비밀 댓글 처리 로직:
   * 1. 모든 댓글을 DB에서 가져옴 (비밀 댓글 포함)
   * 2. formatComment에서 권한에 따라 내용을 숨김 처리
   * 3. 비밀 댓글도 목록에는 표시되지만 권한 없으면 내용은 null로 전송
   * 
   * 권한 체크는 formatComment 메서드에서 수행:
   * - 로그인하지 않은 사용자: 일반 댓글만 내용 볼 수 있음
   * - 로그인한 사용자: 권한에 따라 비밀 댓글 내용 표시
   * 
   * @param publicId - 포스트 공개 ID
   * @param page - 페이지 번호
   * @param limit - 페이지당 댓글 수
   * @param currentUser - 현재 로그인한 사용자 (없으면 undefined)
   */
  async getCommentsByPost(
    publicId: string,
    page: number = 1,
    limit: number = 20,
    currentUser?: Member
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

    // 전체 댓글 가져오기 (비밀 댓글도 포함)
    const allComments = await queryBuilder
      .orderBy('comment.createdAt', 'DESC')
      .getMany();

    // 삭제된 댓글 중 살아있는 대댓글이 없는 것은 필터링
    // (삭제된 댓글도 대댓글이 있으면 구조 유지를 위해 표시)
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
      // formatComment에서 비밀 댓글 권한 검증 및 내용 숨김 처리
      comments: paginatedComments.map(comment => this.formatComment(comment, currentUser, post.author)),
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

  /**
   * 비밀 댓글 열람 권한 검증
   * 
   * 비밀 댓글을 볼 수 있는 조건:
   * 1. 비밀 댓글이 아닌 경우 → 모두 열람 가능
   * 2. 로그인하지 않은 경우 → 열람 불가
   * 3. 댓글 작성자 본인 → 열람 가능
   * 4. 포스트 작성자 → 열람 가능
   * 5. 관리자(ADMIN) → 열람 가능
   * 6. 부모 댓글 작성자 (답글인 경우) → 열람 가능
   * 
   * @param comment - 검증할 댓글
   * @param currentUser - 현재 로그인한 사용자 (없으면 undefined)
   * @param postAuthor - 포스트 작성자 정보
   * @param parentComment - 부모 댓글 (답글인 경우)
   * @returns 열람 가능 여부
   */
  private isAbleToViewSecretComment(
    comment: PostComment, 
    currentUser?: Member, 
    postAuthor?: Member,
    parentComment?: PostComment
  ): boolean {
    // 비밀 댓글이 아니면 누구나 볼 수 있음
    if (!comment.isSecret) return true;
    
    // 로그인하지 않았으면 비밀 댓글 볼 수 없음
    if (!currentUser) return false;
    
    // 댓글 작성자 본인은 항상 볼 수 있음
    if (comment.memberId === currentUser.id) return true;
    
    // 포스트 작성자도 볼 수 있음
    if (postAuthor && postAuthor.id === currentUser.id) return true;
    
    // 관리자는 모든 비밀 댓글을 볼 수 있음
    if (currentUser.role === 'ADMIN') return true;
    
    // 답글인 경우, 부모 댓글 작성자도 볼 수 있음 (대화 맥락 유지)
    if (parentComment && parentComment.memberId === currentUser.id) return true;
    
    return false;
  }

  /**
   * 댓글 데이터 포맷팅 (클라이언트로 전송할 형태로 변환)
   * 
   * 주요 처리 사항:
   * 1. 삭제된 댓글 처리 - 내용과 작성자 정보 숨김
   * 2. 비밀 댓글 처리 - 권한 없는 사용자에게는 내용 숨김
   * 3. 대댓글 재귀적 처리
   * 
   * shouldHideContent가 true인 경우:
   * - content를 null로 설정
   * - 작성자 정보를 숨김
   * - 좋아요 수, 수정 여부, 시간 정보 등을 숨김
   */
  private formatComment(comment: PostComment, currentUser?: Member, postAuthor?: Member, parentComment?: PostComment) {
    const isDeleted = comment.isDeleted || false;
    const canViewSecret = this.isAbleToViewSecretComment(comment, currentUser, postAuthor, parentComment);
    
    // 내용을 숨겨야 하는 경우:
    // 1. 삭제된 댓글
    // 2. 비밀 댓글인데 볼 권한이 없는 경우
    const shouldHideContent = isDeleted || (comment.isSecret && !canViewSecret);
    
    return {
      id: comment.id,
      // 삭제된 댓글이거나 비밀 댓글(권한 없음)은 내용을 서버에서 숨김
      content: shouldHideContent ? null : comment.content,
      isEdited: shouldHideContent ? false : comment.isEdited,
      isDeleted,
      isSecret: comment.isSecret,
      // 삭제된 댓글이거나 비밀 댓글(권한 없음)은 좋아요 수도 숨김
      likeCount: shouldHideContent ? 0 : comment.likeCount,
      // 삭제된 댓글이거나 비밀 댓글(권한 없음)은 시간 정보도 숨김
      createdAt: shouldHideContent ? null : comment.createdAt,
      updatedAt: shouldHideContent ? null : comment.updatedAt,
      member: shouldHideContent ? {
        // 삭제된 댓글이거나 비밀 댓글(권한 없음)은 작성자 정보도 제한적으로 제공
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
        // 답글의 경우, 부모 댓글(comment)을 전달하여 원 댓글 작성자도 볼 수 있게 함
        const canViewReplySecret = this.isAbleToViewSecretComment(reply, currentUser, postAuthor, comment);
        const shouldHideReplyContent = replyDeleted || (reply.isSecret && !canViewReplySecret);
        return {
          id: reply.id,
          content: shouldHideReplyContent ? null : reply.content,
          isEdited: shouldHideReplyContent ? false : reply.isEdited,
          isDeleted: replyDeleted,
          isSecret: reply.isSecret,
          // 삭제된 대댓글이거나 비밀 댓글(권한 없음)도 좋아요 수 숨김
          likeCount: shouldHideReplyContent ? 0 : reply.likeCount,
          // 삭제된 대댓글이거나 비밀 댓글(권한 없음)은 시간 정보도 숨김
          createdAt: shouldHideReplyContent ? null : reply.createdAt,
          updatedAt: shouldHideReplyContent ? null : reply.updatedAt,
          member: shouldHideReplyContent ? {
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