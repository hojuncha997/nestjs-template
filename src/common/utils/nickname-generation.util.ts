// src/common/utils/nickname-generation.util.ts
    // pnpm add unique-names-generator

    import { adjectives, animals } from 'unique-names-generator';
    import { uniqueNamesGenerator } from 'unique-names-generator';
    import { Config } from 'unique-names-generator';

    // 고유한 닉네임 자동 생성
    export class NicknameGenerationUtil {

    // 고유한 닉네임 생성
    static async generateUniqueNickname(
      checkExisting: (nickname: string) => Promise<boolean>,
      maxAttempts: number = 10
    ): Promise<string> {
      const config: Config = {
        dictionaries: [adjectives, animals],
        separator: '',
        style: 'capital',
        length: 2
      };
  
      // 여러 번 시도
      for (let i = 0; i < maxAttempts; i++) {
        const nickname = uniqueNamesGenerator(config);
        const exists = await checkExisting(nickname);
        
        if (!exists) {
          return nickname;
        }
      }
  
      // maxAttempts번 시도 후에도 실패하면 숫자 추가
      const baseNickname = uniqueNamesGenerator(config);
      const randomNum = Math.floor(Math.random() * 1000);
      const nickname = `${baseNickname}${randomNum}`;
      
      // 마지막 시도
      const exists = await checkExisting(nickname);
      if (!exists) {
        return nickname;
      }
  
      throw new Error('닉네임 생성 실패');
    }
  }