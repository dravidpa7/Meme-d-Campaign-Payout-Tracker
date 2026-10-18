import { Schema, Types, model } from 'mongoose';

export interface ISubmission {
  _id: Types.ObjectId;
  campaignId: Types.ObjectId;
  creatorId: Types.ObjectId;
  postUrl: string;
  views: number;
  /** Highest milestone payout ever crossed. Never decreases. */
  eligiblePayout: number;
  /** Running total actually paid out (may be < eligiblePayout if the budget ran out). */
  allocatedPayout: number;
  flagged: boolean;
  viewsUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const submissionSchema = new Schema<ISubmission>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    postUrl: { type: String, required: true, trim: true },
    views: { type: Number, default: 0, min: 0 },
    eligiblePayout: { type: Number, default: 0, min: 0 },
    allocatedPayout: { type: Number, default: 0, min: 0 },
    flagged: { type: Boolean, default: false },
    viewsUpdatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// The same post cannot be submitted twice to one campaign.
submissionSchema.index({ campaignId: 1, postUrl: 1 }, { unique: true });

export const SubmissionModel = model<ISubmission>('Submission', submissionSchema);
