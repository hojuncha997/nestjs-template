import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostLike } from '../entities/post-like.entity';
import { PostStats } from '../entities/post-stats.entity';
import { PostsRepository } from '../posts.repository';
import { Member } from '@members/entities/member.entity';

@Injectable()
export class PostLikeService {
  private readonly logger = new Logger(PostLikeService.name);

  constructor(
    @InjectRepository(PostLike)
    private readonly postLikeRepository: Repository<PostLike>,
    @InjectRepository(PostStats)
    private readonly postStatsRepository: Repository<PostStats>,
    private readonly postsRepository: PostsRepository,
  ) {}

  async toggleLike(publicId: string, member: Member): Promise<{ isLiked: boolean; likeCount: number }> {
    const post = await this.postsRepository.findPostByPublicId(publicId);
    
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existingLike = await this.postLikeRepository.findOne({
      where: {
        postId: post.id,
        memberId: member.id,
      },
    });

    let isLiked: boolean;

    if (existingLike) {
      await this.postLikeRepository.remove(existingLike);
      await this.updateLikeCount(post.id, -1);
      isLiked = false;
    } else {
      await this.postLikeRepository.save({
        postId: post.id,
        memberId: member.id,
      });
      await this.updateLikeCount(post.id, 1);
      isLiked = true;
    }

    const stats = await this.postStatsRepository.findOne({
      where: { postId: post.id },
    });

    return {
      isLiked,
      likeCount: stats?.likeCount || 0,
    };
  }

  async checkUserLiked(publicId: string, memberId: number): Promise<boolean> {
    const post = await this.postsRepository.findPostByPublicId(publicId);
    
    if (!post) {
      return false;
    }

    const like = await this.postLikeRepository.findOne({
      where: {
        postId: post.id,
        memberId: memberId,
      },
    });

    return !!like;
  }

  async getLikesByPost(publicId: string, limit: number = 10, offset: number = 0) {
    const post = await this.postsRepository.findPostByPublicId(publicId);
    
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const [likes, total] = await this.postLikeRepository.findAndCount({
      where: { postId: post.id },
      relations: ['member'],
      select: {
        id: true,
        createdAt: true,
        member: {
          uuid: true,
          nickname: true,
          profileImage: true,
        },
      },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      likes: likes.map(like => ({
        id: like.id,
        createdAt: like.createdAt,
        member: {
          uuid: like.member.uuid,
          nickname: like.member.nickname,
          profileImage: like.member.profileImage,
        },
      })),
      total,
    };
  }

  private async updateLikeCount(postId: number, increment: number) {
    await this.postStatsRepository
      .createQueryBuilder()
      .update(PostStats)
      .set({
        likeCount: () => `like_count + ${increment}`,
      })
      .where('post_id = :postId', { postId })
      .execute();
  }
}