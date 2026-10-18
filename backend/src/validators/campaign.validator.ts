import { z } from 'zod';
import { PLATFORM_VALUES } from '../constants/platforms';

const positiveInt = z.number().int().positive();

export const createCampaignSchema = z.object({
  name: z.string().trim().min(2).max(100),
  platform: z.enum(PLATFORM_VALUES),
  totalBudget: positiveInt,
  // Ordering / uniqueness rules are enforced by domain.validateMilestones in the service.
  milestones: z.array(z.object({ views: positiveInt, payout: positiveInt })).min(1).max(20),
});

export type CreateCampaignBody = z.infer<typeof createCampaignSchema>;
