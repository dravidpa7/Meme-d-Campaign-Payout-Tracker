import { ISubmission } from '../models/submission.model';

export interface SubmissionDto {
  id: string;
  campaignId: string;
  campaignName?: string;
  postUrl: string;
  views: number;
  eligiblePayout: number;
  allocatedPayout: number;
  flagged: boolean;
  viewsUpdatedAt: Date;
}

export const toSubmissionDto = (s: ISubmission, campaignName?: string): SubmissionDto => ({
  id: s._id.toString(),
  campaignId: s.campaignId.toString(),
  ...(campaignName !== undefined && { campaignName }),
  postUrl: s.postUrl,
  views: s.views,
  eligiblePayout: s.eligiblePayout,
  allocatedPayout: s.allocatedPayout,
  flagged: s.flagged,
  viewsUpdatedAt: s.viewsUpdatedAt,
});
