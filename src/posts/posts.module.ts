//src/posts/posts.module.ts

import { PostsController } from './posts.controller';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { PostsService } from './posts.service';
import { PostsRepository } from './posts.repository';
import { PostMapper } from './mappers/post.mapper';

@Module({
    imports: [TypeOrmModule.forFeature([Post])],
    providers: [PostsService, PostsRepository, PostMapper],
    controllers: [PostsController],
    // exports: [PostsService],
})
export class PostsModule {}