import { Schema, Types, model } from 'mongoose';
import { CAMPAIGN_STATUS, CAMPAIGN_STATUS_VALUES, CampaignStatus } from '../constants/campaign-status';
import { PLATFORM_VALUES, Platform } from '../constants/platforms';
import { Milestone } from '../domain/types';

export interface ICampaign {
  _id: Types.ObjectId;
  brandId: Types.ObjectId;
  name: string;
  platform: Platform;
  totalBudget: number;
  remainingBudget: number;
  milestones: Milestone[];
  status: CampaignStatus;
  createdAt: Date;
  updatedAt: Date;
}

const integer = { validator: Number.isInteger, message: '{PATH} must be an integer' };

const milestoneSchema = new Schema<Milestone>(
  {
    views: { type: Number, required: true, min: 1, validate: integer },
    payout: { type: Number, required: true, min: 1, validate: integer },
  },
  { _id: false },
);

const campaignSchema = new Schema<ICampaign>(
  {
    brandId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    platform: { type: String, enum: PLATFORM_VALUES, required: true },
    totalBudget: { type: Number, required: true, min: 1, validate: integer },
    remainingBudget: { type: Number, required: true, min: 0, validate: integer },
    milestones: {
      type: [milestoneSchema],
      required: true,
      validate: { validator: (v: Milestone[]) => v.length > 0, message: 'At least one milestone is required' },
    },
    status: { type: String, enum: CAMPAIGN_STATUS_VALUES, default: CAMPAIGN_STATUS.LIVE, index: true },
  },
  { timestamps: true },
);

export const CampaignModel = model<ICampaign>('Campaign', campaignSchema);
