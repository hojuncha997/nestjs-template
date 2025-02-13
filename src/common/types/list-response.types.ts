// list-response.types.ts
// 경로: src/common/types/list-response.types.ts

export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    // 나중에 추가될 수 있는 필드들
    // hasNextPage?: boolean;
    // hasPreviousPage?: boolean;
    // lastPage?: number;
  }
  
  export interface ListResponse<T> {
    data: T[];
    meta: PaginationMeta;
    // 나중에 추가될 수 있는 필드들
    // links?: {
    //   first: string;
    //   last: string;
    //   prev: string | null;
    //   next: string | null;
    // };
  }