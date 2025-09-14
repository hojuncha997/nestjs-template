//src/posts/posts.module.ts

import { PostsController } from './posts.controller';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { PostsService } from './posts.service';
import { PostsRepository } from './posts.repository';
import { PostMapper } from './mappers/post.mapper';
import { MembersModule } from '../members/members.module';
import { PostRelationRepository } from './post-relation.repository';
import { PostStats } from './entities/post-stats.entity';
import { PostStatsRepository } from './post-stats.repository';
import { PostMetaRepository } from './post-meta.repository';
import { PostMeta } from './entities/post-meta.entity';
import { CategoryModule } from '@category/category.module';
import { PostLike } from './entities/post-like.entity';
import { PostLikeService } from './services/post-like.service';
import { PostComment } from './entities/post-comment.entity';
import { CommentEditHistory } from './entities/comment-edit-history.entity';
import { PostCommentService } from './services/post-comment.service';
import { NotificationsModule } from '../notifications/notifications.module';


@Module({
    imports: [
        // TypeOrmModule.forFeature()는 특정 모듈에서 사용할 엔티티들의 Repository를 등록하기 위한 설정
        // 이 설정이 있어야 모듈 내에서 @InjectRepository() 데코레이터를 사용할 수 있음
        // 즉, forFeature()는 지정된 엔티티들([Post, PostStats, PostMeta])에 대한 Repository를 현재 모듈 스코프에서 사용할 수 있게 등록
        // TypeORM의 Repository 패턴을 NestJS의 DI(의존성 주입) 시스템과 연결
        // 이를 통해 우리는 엔티티에 대한 데이터베이스 작업을 Repository 패턴으로 수행할 수 있음
        TypeOrmModule.forFeature([Post, PostStats, PostMeta, PostLike, PostComment, CommentEditHistory]),
        MembersModule,
        CategoryModule,
        NotificationsModule, // 알림 모듈 추가 - PostCommentService에서 알림 생성 시 필요
    ],
    providers: [
        PostsService,
        PostsRepository,
        PostMapper,
        PostRelationRepository,
        PostStatsRepository,
        PostMetaRepository,
        PostLikeService,
        PostCommentService,
    ],
    controllers: [PostsController], 
    exports: [PostsService],
})
export class PostsModule {}