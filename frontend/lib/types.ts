export type UserRole = "brand" | "creator";
export type Platform = "Instagram" | "YouTube";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface CampaignMilestone {
  views: number;
  payout: number;
}

export interface Campaign {
  id: string;
  brandId: string;
  name: string;
  platform: Platform;
  totalBudget: number;
  remainingBudget: number;
  spent: number;
  milestones: CampaignMilestone[];
  status: "live" | "paused" | "completed";
  createdAt: string;
}

export interface Submission {
  id: string;
  campaignId: string;
  campaignName?: string;
  postUrl: string;
  views: number;
  eligiblePayout: number;
  allocatedPayout: number;
  flagged: boolean;
  viewsUpdatedAt: string;
}

export interface Earnings {
  totalEarnings: number;
  payoutCount: number;
}

export interface ActionState {
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export type FormAction = (
  previousState: ActionState,
  formData: FormData,
) => Promise<ActionState>;
