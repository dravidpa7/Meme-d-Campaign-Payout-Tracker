import { ClientSession, Types } from 'mongoose';
import { IPayout, PayoutModel } from '../models/payout.model';

export interface CreatePayoutData {
  submissionId: Types.ObjectId;
  campaignId: Types.ObjectId;
  creatorId: Types.ObjectId;
  amount: number;
}

export interface EarningsTotals {
  totalEarnings: number;
  payoutCount: number;
}

export const payoutRepository = {
  async create(data: CreatePayoutData, session?: ClientSession): Promise<IPayout> {
    const [doc] = await PayoutModel.create([data], { session });
    return doc!.toObject() as IPayout;
  },

  async totalsByCreator(creatorId: string): Promise<EarningsTotals> {
    const [row] = await PayoutModel.aggregate<{ total: number; count: number }>([
      { $match: { creatorId: new Types.ObjectId(creatorId) } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);
    return { totalEarnings: row?.total ?? 0, payoutCount: row?.count ?? 0 };
  },
};
