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

@Module({
    imports: [
        TypeOrmModule.forFeature([Post]),
        MembersModule,
    ],
    providers: [
        PostsService,
        PostsRepository,
        PostMapper,
        PostRelationRepository
    ],
    controllers: [PostsController], 
    // exports: [PostsService],
})
export class PostsModule {}