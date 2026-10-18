import { CampaignStatus } from '../constants/campaign-status';
import { Platform } from '../constants/platforms';
import { Milestone } from '../domain/types';
import { ICampaign } from '../models/campaign.model';

export interface CampaignDto {
  id: string;
  brandId: string;
  name: string;
  platform: Platform;
  totalBudget: number;
  remainingBudget: number;
  spent: number;
  milestones: Milestone[];
  status: CampaignStatus;
  createdAt: Date;
}

export const toCampaignDto = (c: ICampaign): CampaignDto => ({
  id: c._id.toString(),
  brandId: c.brandId.toString(),
  name: c.name,
  platform: c.platform,
  totalBudget: c.totalBudget,
  remainingBudget: c.remainingBudget,
  spent: c.totalBudget - c.remainingBudget,
  milestones: [...c.milestones].sort((a, b) => a.views - b.views),
  status: c.status,
  createdAt: c.createdAt,
});
