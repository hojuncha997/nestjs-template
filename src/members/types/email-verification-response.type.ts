
import { MemberStatus } from '@common/enums';

export interface EmailVerificationResponse {
  email: string;
  verified: boolean;
  verifiedAt: Date;
  status: MemberStatus;
}