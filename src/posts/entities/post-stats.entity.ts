// src/posts/entities/post-stats.entity.ts

import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Post } from './post.entity';

@Entity('post_stats')
export class PostStats {
    /*
    @PrimaryColumn() : 이 필드는 테이블의 기본 키로 사용된다.
    @JoinColumn({ name: 'postId' }) : 이 필드는 Post 테이블의 id를 참조하는 외래 키 역할을 한다.

    postId는 기본키이면서 외래키 역할을 하므로 엔티티에는 두 데코레이터가 모두 필요하다.
    만약 이 주키 필드 작성을 생략하면 typeOrm이 주키(기본키)를 자동으로 인식하지 못하고 오류가 발생할 수 있다.
    */
    @PrimaryColumn()
    postId: number;

 

    /*
    이 필드는 실제 db의 컬럼으로 만들어지지 않는 가상의 필드이다. 주키에 대한 외래키 매핑을 위해 사용된다.
    디비에 실제로 생성되는 컬럼은 이 테이블의 주키인 postId 컬럼이다. 그런데 여기서 주키는 동시에 외래키 역할을 해야하기 때문에,
    이 가상의 필드인 post를 만들어 주키와의 매핑을 해주는 것이다.

    소스 코드에서는 아래와 같이 사용할 수 있다.

    const postStats = await postStatsRepository.findOne({
        where: { postId: 1 },
        relations: ['post']  // 이렇게 post 관계를 불러올 수 있음
    });
    console.log(postStats.post.title);  // Post의 데이터에 접근 가능
    --------------------------------

    () => Post는 순환 참조를 피하기 위한 지연 로딩(lazy loading) 패턴
    { onDelete: 'CASCADE' } : Post가 삭제되면 연결된 PostStats도 자동 삭제
    @JoinColumn({ name: 'postId' }) : PostStats 테이블에 'postId'라는 이름의 외래 키 컬럼 생성
    */
    @OneToOne(() => Post, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'postId' }) // "Post의 id를 참조하는 PostStats 테이블의 컬럼명을 postId로 하겠다"라는 의미
    post: Post;
       /*
        결과적으로 생성되는 테이블 구조:
        CREATE TABLE post_stats (
            postId integer PRIMARY KEY,  -- 동시에 외래 키
            ... other columns ...,
            CONSTRAINT fk_post 
                FOREIGN KEY (postId) 
                REFERENCES post(id) 
                ON DELETE CASCADE
        );
    */

    @Column({type: 'integer', default: 0})
    viewCount: number;

    @Column({type: 'integer', default: 0})
    likeCount: number;

    @Column({type: 'integer', default: 0})
    commentCount: number;

    @Column({type: 'integer', default: 0})
    viewTimeInSeconds: number;
}
