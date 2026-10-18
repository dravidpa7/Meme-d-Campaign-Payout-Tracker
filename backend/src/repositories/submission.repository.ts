import { ClientSession, Types } from 'mongoose';
import { ISubmission, SubmissionModel } from '../models/submission.model';

export interface CreateSubmissionData {
  campaignId: string;
  creatorId: string;
  postUrl: string;
}

export interface ApplyViewUpdateData {
  id: Types.ObjectId;
  /** The allocatedPayout the caller read. The write only succeeds if it is unchanged. */
  expectedAllocatedPayout: number;
  views: number;
  eligiblePayout: number;
  /** Rupees actually paid by this update (>= 0). Added to allocatedPayout. */
  paid: number;
  flagged: boolean;
  viewsUpdatedAt: Date;
}

export const submissionRepository = {
  async create(data: CreateSubmissionData): Promise<ISubmission> {
    const doc = await SubmissionModel.create(data);
    return doc.toObject() as ISubmission;
  },

  findById(id: string, session?: ClientSession): Promise<ISubmission | null> {
    return SubmissionModel.findById(id).session(session ?? null).lean<ISubmission>().exec();
  },

  findByCreatorId(creatorId: string): Promise<ISubmission[]> {
    return SubmissionModel.find({ creatorId }).sort({ createdAt: -1 }).lean<ISubmission[]>().exec();
  },

  /**
   * Guarded update: matches only if allocatedPayout still equals the value the
   * caller read. If another request paid in between, nothing matches and this
   * returns false, so the same delta can never be paid twice.
   */
  async applyViewUpdate(data: ApplyViewUpdateData, session?: ClientSession): Promise<boolean> {
    const result = await SubmissionModel.updateOne(
      { _id: data.id, allocatedPayout: data.expectedAllocatedPayout },
      {
        $set: {
          views: data.views,
          eligiblePayout: data.eligiblePayout,
          flagged: data.flagged,
          viewsUpdatedAt: data.viewsUpdatedAt,
        },
        $inc: { allocatedPayout: data.paid },
      },
      { session },
    ).exec();

    return result.matchedCount === 1;
  },
};
