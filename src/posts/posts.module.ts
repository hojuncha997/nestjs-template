//src/posts/posts.module.ts

import { PostsController } from './posts.controller';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { PostsService } from './posts.service';
import { PostsRepository } from './posts.repository';

@Module({
    imports: [TypeOrmModule.forFeature([Post])],
    providers: [PostsService, PostsRepository],
    controllers: [PostsController],
    // exports: [PostsService],
})
export class PostsModule {}