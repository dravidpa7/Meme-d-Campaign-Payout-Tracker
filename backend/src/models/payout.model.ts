import { Schema, Types, model } from 'mongoose';

/** Append-only ledger row. `amount` is the DELTA paid by this event, not a running total. */
export interface IPayout {
  _id: Types.ObjectId;
  submissionId: Types.ObjectId;
  campaignId: Types.ObjectId;
  creatorId: Types.ObjectId;
  amount: number;
  createdAt: Date;
}

const payoutSchema = new Schema<IPayout>(
  {
    submissionId: { type: Schema.Types.ObjectId, ref: 'Submission', required: true, index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 1, validate: { validator: Number.isInteger } },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const PayoutModel = model<IPayout>('Payout', payoutSchema);
