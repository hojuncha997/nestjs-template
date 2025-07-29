// auth-provider.enum.ts
// 경로: src/common/enums/auth-provider.enum.ts

export enum AuthProvider {
  LOCAL = 'email',
  GOOGLE = 'google',
  KAKAO = 'kakao',
  NAVER = 'naver'
} 

export enum AuthProviderUrl {
  GOOGLE = 'https://accounts.google.com/o/oauth2/auth',
  KAKAO = 'https://kauth.kakao.com/oauth/authorize',
  NAVER = 'https://nid.naver.com/oauth2.0/authorize'
}