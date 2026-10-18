/**
 * Proves the stretch goals against a REAL MongoDB replica set (transactions
 * need one): simultaneous updates can never overspend a campaign, and repeated
 * updates never double-pay.
 *
 * Run with:  npm run test:db
 * Needs network access the first time (mongodb-memory-server downloads mongod).
 */
import mongoose, { Types } from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { ConflictError } from '../../src/errors/http-errors';
import { CampaignModel } from '../../src/models/campaign.model';
import { PayoutModel } from '../../src/models/payout.model';
import { SubmissionModel } from '../../src/models/submission.model';
import { campaignRepository } from '../../src/repositories/campaign.repository';
import { payoutService } from '../../src/services/payout.service';

jest.setTimeout(120_000);

const milestones = [
  { views: 10_000, payout: 500 },
  { views: 50_000, payout: 2_000 },
  { views: 100_000, payout: 5_000 },
];

let replSet: MongoMemoryReplSet;

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(replSet.getUri());
  await Promise.all([
    CampaignModel.createCollection(),
    SubmissionModel.createCollection(),
    PayoutModel.createCollection(),
  ]);
  await Promise.all([CampaignModel.init(), SubmissionModel.init(), PayoutModel.init()]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await replSet.stop();
});

const seedCampaign = (totalBudget: number) =>
  campaignRepository.create({
    brandId: new Types.ObjectId().toString(),
    name: `Campaign ${totalBudget}`,
    platform: 'Instagram',
    totalBudget,
    milestones,
  });

const seedSubmission = (campaignId: Types.ObjectId, n: number) =>
  SubmissionModel.create({
    campaignId,
    creatorId: new Types.ObjectId(),
    postUrl: `https://instagram.com/p/${campaignId.toString()}-${n}`,
  });

const ledgerTotal = async (campaignId: Types.ObjectId) => {
  const [row] = await PayoutModel.aggregate<{ total: number }>([
    { $match: { campaignId } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return row?.total ?? 0;
};

describe('concurrency', () => {
  it('never overspends: 10 simultaneous payouts of 5000 against a 3000 budget', async () => {
    const campaign = await seedCampaign(3_000);
    const subs = await Promise.all(Array.from({ length: 10 }, (_, i) => seedSubmission(campaign._id, i)));

    const results = await Promise.allSettled(subs.map((s) => payoutService.updateViews(s._id.toString(), 120_000)));
    results.forEach((r) => {
      if (r.status === 'rejected') expect(r.reason).toBeInstanceOf(ConflictError);
    });

    const fresh = await CampaignModel.findById(campaign._id).lean();
    expect(fresh!.remainingBudget).toBeGreaterThanOrEqual(0);
    expect(await ledgerTotal(campaign._id)).toBe(3_000 - fresh!.remainingBudget); // ledger == spent
    expect(fresh!.remainingBudget).toBe(0); // all budget distributed
    expect(fresh!.status).toBe('closed');
  });

  it('never double-pays: 8 simultaneous identical updates on one submission', async () => {
    const campaign = await seedCampaign(10_000);
    const sub = await seedSubmission(campaign._id, 0);

    const results = await Promise.allSettled(
      Array.from({ length: 8 }, () => payoutService.updateViews(sub._id.toString(), 60_000)),
    );
    results.forEach((r) => {
      if (r.status === 'rejected') expect(r.reason).toBeInstanceOf(ConflictError);
    });

    const freshSub = await SubmissionModel.findById(sub._id).lean();
    const freshCampaign = await CampaignModel.findById(campaign._id).lean();
    expect(freshSub!.allocatedPayout).toBe(2_000); // paid exactly once
    expect(freshCampaign!.remainingBudget).toBe(8_000);
    expect(await ledgerTotal(campaign._id)).toBe(2_000);
  });

  it('pays deltas across sequential updates and ignores a repeat', async () => {
    const campaign = await seedCampaign(10_000);
    const sub = await seedSubmission(campaign._id, 0);
    const id = sub._id.toString();

    expect((await payoutService.updateViews(id, 12_000)).paidNow).toBe(500);
    expect((await payoutService.updateViews(id, 60_000)).paidNow).toBe(1_500);
    expect((await payoutService.updateViews(id, 60_000)).paidNow).toBe(0);
    expect((await payoutService.updateViews(id, 1_000)).paidNow).toBe(0); // no clawback

    const fresh = await SubmissionModel.findById(sub._id).lean();
    expect(fresh!.allocatedPayout).toBe(2_000);
    expect(await ledgerTotal(campaign._id)).toBe(2_000);
  });
});
