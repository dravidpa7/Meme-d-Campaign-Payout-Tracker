import { PLATFORM_HOSTS } from '../constants/platforms';
import { CAMPAIGN_STATUS } from '../constants/campaign-status';
import { SubmissionDto, toSubmissionDto } from '../dtos/submission.dto';
import { BadRequestError, ConflictError, NotFoundError } from '../errors/http-errors';
import { campaignRepository } from '../repositories/campaign.repository';
import { submissionRepository } from '../repositories/submission.repository';

const DUPLICATE_KEY_CODE = 11000;

export const submissionService = {
  async submitPost(creatorId: string, input: { campaignId: string; postUrl: string }): Promise<SubmissionDto> {
    const campaign = await campaignRepository.findById(input.campaignId);
    if (!campaign) throw new NotFoundError('Campaign not found');
    if (campaign.status !== CAMPAIGN_STATUS.LIVE) throw new BadRequestError('Campaign is not live');

    const host = new URL(input.postUrl).hostname.toLowerCase();
    if (!PLATFORM_HOSTS[campaign.platform].includes(host)) {
      throw new BadRequestError(`Post URL must be a ${campaign.platform} link`);
    }

    try {
      const submission = await submissionRepository.create({
        campaignId: input.campaignId,
        creatorId,
        postUrl: input.postUrl,
      });
      return toSubmissionDto(submission, campaign.name);
    } catch (err) {
      if ((err as { code?: number }).code === DUPLICATE_KEY_CODE) {
        throw new ConflictError('This post was already submitted to this campaign');
      }
      throw err;
    }
  },

  async listMine(creatorId: string): Promise<SubmissionDto[]> {
    const submissions = await submissionRepository.findByCreatorId(creatorId);
    const campaigns = await campaignRepository.findByIds([...new Set(submissions.map((s) => s.campaignId))]);
    const names = new Map(campaigns.map((c) => [c._id.toString(), c.name]));

    return submissions.map((s) => toSubmissionDto(s, names.get(s.campaignId.toString())));
  },
};
