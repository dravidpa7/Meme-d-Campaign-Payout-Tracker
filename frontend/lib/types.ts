export type Role = 'brand' | 'creator';
export type Platform = 'Instagram' | 'YouTube';

export interface User { id: string; name: string; email: string; role: Role }
export interface Milestone { views: number; payout: number }
export interface Campaign {
  id: string; name: string; platform: Platform;
  totalBudget: number; remainingBudget: number; spent: number;
  milestones: Milestone[]; status: 'live' | 'closed';
}
export interface Submission {
  id: string; campaignId: string; campaignName?: string; postUrl: string;
  views: number; eligiblePayout: number; allocatedPayout: number; flagged: boolean;
}
export interface Earnings { totalEarnings: number; payoutCount: number }
export interface AuthResult { user: User; token: string }