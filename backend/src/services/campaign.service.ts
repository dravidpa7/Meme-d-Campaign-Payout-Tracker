import { Platform } from '../constants/platforms';
import { CampaignDto, toCampaignDto } from '../dtos/campaign.dto';
import { Milestone } from '../domain/types';
import { validateMilestones } from '../domain/payout-calculator';
import { campaignRepository } from '../repositories/campaign.repository';
import { cacheService } from './cache.service';

export interface CreateCampaignInput {
  name: string;
  platform: Platform;
  totalBudget: number;
  milestones: Milestone[];
}

export const campaignService = {
  async create(brandId: string, input: CreateCampaignInput): Promise<CampaignDto> {
    // Throws DomainError (mapped to HTTP 400) if the ladder is invalid.
    validateMilestones(input.milestones);

    const campaign = await campaignRepository.create({ brandId, ...input });
    await cacheService.invalidateLiveCampaigns();
    return toCampaignDto(campaign);
  },

  async listLive(): Promise<CampaignDto[]> {
    const cached = await cacheService.getLiveCampaigns<CampaignDto[]>();
    if (cached) return cached;

    const dtos = (await campaignRepository.findLive()).map(toCampaignDto);
    await cacheService.setLiveCampaigns(dtos);
    return dtos;
  },

  /** Brand dashboard: each campaign with spent vs remaining budget. */
  async listForBrand(brandId: string): Promise<CampaignDto[]> {
    return (await campaignRepository.findByBrandId(brandId)).map(toCampaignDto);
  },
};
