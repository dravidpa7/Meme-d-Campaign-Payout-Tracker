import { ClientSession, Types } from 'mongoose';
import { CAMPAIGN_STATUS } from '../constants/campaign-status';
import { Platform } from '../constants/platforms';
import { Milestone } from '../domain/types';
import { CampaignModel, ICampaign } from '../models/campaign.model';

export interface CreateCampaignData {
  brandId: string;
  name: string;
  platform: Platform;
  totalBudget: number;
  milestones: Milestone[];
}

export const campaignRepository = {
  async create(data: CreateCampaignData): Promise<ICampaign> {
    const doc = await CampaignModel.create({
      ...data,
      remainingBudget: data.totalBudget,
      status: CAMPAIGN_STATUS.LIVE,
    });
    return doc.toObject() as ICampaign;
  },

  findById(id: string | Types.ObjectId, session?: ClientSession): Promise<ICampaign | null> {
    return CampaignModel.findById(id).session(session ?? null).lean<ICampaign>().exec();
  },

  findByIds(ids: Types.ObjectId[]): Promise<ICampaign[]> {
    return CampaignModel.find({ _id: { $in: ids } }).lean<ICampaign[]>().exec();
  },

  findLive(): Promise<ICampaign[]> {
    return CampaignModel.find({ status: CAMPAIGN_STATUS.LIVE }).sort({ createdAt: -1 }).lean<ICampaign[]>().exec();
  },

  findByBrandId(brandId: string): Promise<ICampaign[]> {
    return CampaignModel.find({ brandId }).sort({ createdAt: -1 }).lean<ICampaign[]>().exec();
  },

  /**
   * Atomically takes up to `requested` rupees from the campaign budget in ONE
   * database operation (no read-then-write race). The budget can never go below
   * zero, and the campaign is closed when it reaches zero.
   *
   * Returns the budget that was available *before* the deduction (0 if the
   * campaign had nothing left), so the caller can compute exactly what was
   * paid with applyBudgetCap(requested, remainingBefore).
   */
  async deductBudgetUpTo(campaignId: Types.ObjectId, requested: number, session?: ClientSession): Promise<number> {
    const before = await CampaignModel.findOneAndUpdate(
      { _id: campaignId, remainingBudget: { $gt: 0 } },
      [
        { $set: { remainingBudget: { $max: [0, { $subtract: ['$remainingBudget', requested] }] } } },
        { $set: { status: { $cond: [{ $eq: ['$remainingBudget', 0] }, CAMPAIGN_STATUS.CLOSED, '$status'] } } },
      ],
      { returnDocument: 'before', projection: { remainingBudget: 1 }, session, updatePipeline: true },
    )
      .lean<Pick<ICampaign, '_id' | 'remainingBudget'>>()
      .exec();

    return before?.remainingBudget ?? 0;
  },
};
