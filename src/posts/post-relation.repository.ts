// src/posts/post-relation.repository.ts
// 게시글 관계 리포지토리. CRUD는 PostsRepository에서 처리하고 여기서는 하지 않음
// 게시글 관계 엔티티를 관리하는 리포지토리

import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PostRelation } from './entities/post-relation.entity';

@Injectable()
export class PostRelationRepository extends Repository<PostRelation> {
    constructor(private dataSource: DataSource) {
        super(PostRelation, dataSource.createEntityManager());
    }
} 