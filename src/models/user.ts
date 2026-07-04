export type UserRole = 'customer' | 'runner';

export interface UserProfile {
  displayName: string;
  phone: string;
  collegeId: string;
  hostelBlock: string;
  upiId: string;
  isVerified: boolean;
  totalJobsDone?: number;
  totalEarnings?: number;
}
