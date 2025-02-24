import * as crypto from 'crypto';

export class EmailUtil {
// 비밀번호처럼 운영자도 모르게 암호화(단방향)하는 경우라면 bycrypt만 사용해도 된다.
// 그러나 이메일처럼 복호화가 필요한 경우(양방향)에는 직접 암호화 key와 salt를 설정해야 한다.
  // private static readonly SALT = process.env.EMAIL_ENCRYPTION_SALT;
  // private static readonly KEY = process.env.EMAIL_ENCRYPTION_KEY;

  private static getEncryptionConfig() {
    const key = process.env.EMAIL_ENCRYPTION_KEY;
    const salt = process.env.EMAIL_ENCRYPTION_SALT;

    if (!key || !salt) {
      throw new Error('Encryption configuration missing');
    }

    const derivedKey = crypto.scryptSync(key, salt, 32);
    return { key, salt, derivedKey };
  }

  // 이메일 해싱
  // 스테틱 메서드는 클래스가 로드 될 때 한 번만 초기화 되기 때문에 환경변수가 로드 되기 전에 초기화 될 수 있다.
  // 따라서 일단은 메서드 내부에서 환경변수를 로드하도록 한다.
  static hashEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      throw new Error('Invalid email input');
    }

    const { key, salt } = this.getEncryptionConfig();

    return crypto
      .createHash('sha256')
      .update(email.toLowerCase())
      .digest('hex');
  }

  // 이메일 암호화
  static encryptEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      throw new Error('Invalid email input');
    }

    const { derivedKey } = this.getEncryptionConfig();

    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', derivedKey, iv);
      
      let encrypted = cipher.update(email, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return `${iv.toString('hex')}:${encrypted}`;
    } catch (error) {
      throw new Error('Failed to encrypt email');
    }
  }

  // 암호화된 이메일 복호화
  static decryptEmail(encryptedEmail: string): string {
    if (!encryptedEmail || typeof encryptedEmail !== 'string') {
      throw new Error('Invalid encrypted email input');
    }

    const { derivedKey } = this.getEncryptionConfig();

    try {
      const [ivHex, encrypted] = encryptedEmail.split(':');
      if (!ivHex || !encrypted) {
        throw new Error('Invalid encrypted email format');
      }

      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, iv);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      throw new Error('Failed to decrypt email');
    }
  }
}

// // src/common/utils/email-encryption.util.ts
// import * as crypto from 'crypto';

// export class EmailUtil {
//   // 이메일 해싱
//   static hashEmail(email: string): string {
//     return crypto
//       .createHash('sha256')
//       .update(email.toLowerCase())  // 소문자로 변환 후 해싱
//       .digest('hex');
//   }

//   // 이메일 암호화 (양방향)
//   static encryptEmail(email: string): string {
//     const key = crypto.scryptSync(process.env.EMAIL_ENCRYPTION_KEY, 'salt', 32);
//     const iv = crypto.randomBytes(16);
//     const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
//     let encrypted = cipher.update(email, 'utf8', 'hex');
//     encrypted += cipher.final('hex');
//     return iv.toString('hex') + ':' + encrypted;
//   }

//   // 이메일 복호화
//   static decryptEmail(encryptedEmail: string): string {
//     const [ivHex, encrypted] = encryptedEmail.split(':');
//     const key = crypto.scryptSync(process.env.EMAIL_ENCRYPTION_KEY, 'salt', 32);
//     const iv = Buffer.from(ivHex, 'hex');
//     const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
//     let decrypted = decipher.update(encrypted, 'hex', 'utf8');
//     decrypted += decipher.final('utf8');
//     return decrypted;
//   }
// }