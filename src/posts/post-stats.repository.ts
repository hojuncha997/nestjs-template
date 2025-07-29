import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostStats } from './entities/post-stats.entity';

@Injectable()
export class PostStatsRepository extends Repository<PostStats> {
    constructor(
        @InjectRepository(PostStats)
        private readonly repository: Repository<PostStats>
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
} 

/*
 Repository 클래스를 상속받았기 때문에 기본적인 CRUD 메서드들을 모두 사용할 수 있다.

 TypeORM의 Repository 클래스에서 상속받은 주요 메서드들:

find()
findOne()
save()
update()
delete()
increment()
decrement()
createQueryBuilder()
등

별도의 메서드를 정의하지 않아도, TypeORM Repository의 모든 기본 기능을 사용할 수 있다. 
나중에 특별한 쿼리나 비즈니스 로직이 필요할 때 커스텀 메서드를 추가하면 된다.


*/  