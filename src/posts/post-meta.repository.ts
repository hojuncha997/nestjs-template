import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostMeta } from './entities/post-meta.entity';

@Injectable()
export class PostMetaRepository extends Repository<PostMeta> {
    constructor(
        @InjectRepository(PostMeta)
        private readonly repository: Repository<PostMeta>
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
} 