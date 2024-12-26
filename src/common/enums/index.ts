// src/common/enums/index.ts
// 공통 열거형 정의. 한 번에 가져와 사용할 수 있도록 모듈로 정의

// Node.js에서는 파일의 이름이 index인 경우, 
// 디렉토리를 임포트 할 때 index파일을 찾아보기 때문에 파일명을 생략가능함.
// 따라서 경로 끝에 index를 붙이지 않아도 @common/enums 이렇게 사용할 수 있음.

export * from './auth-provider.enum';
export * from './role.enum';
export * from './notification.enum';
export * from './language.enum';
export * from './time-zone.enums';
export * from './theme.enum';
export * from './member-status.enum';