/**
 * Dev seed: 5 users, 2 campaigns, 5 submissions, 8 ledger rows (budget numbers
 * are consistent with the ledger). Run with:  npm run seed
 * All seeded accounts use the password  Password123!
 */
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { CampaignModel } from '../src/models/campaign.model';
import { PayoutModel } from '../src/models/payout.model';
import { SubmissionModel } from '../src/models/submission.model';
import { UserModel } from '../src/models/user.model';
import { hashPassword } from '../src/utils/password';
import { formatRupees } from '../src/utils/money';

const day = (d: string) => new Date(`2026-${d}T10:00:00.000Z`);

async function seed(): Promise<void> {
  await connectDatabase();
  await Promise.all([UserModel, CampaignModel, SubmissionModel, PayoutModel].map((m) => m.deleteMany({})));
  await Promise.all([UserModel, CampaignModel, SubmissionModel, PayoutModel].map((m) => m.syncIndexes()));

  const passwordHash = await hashPassword('Password123!');
  const [brand1, brand2, arjun, priya, karthik] = await UserModel.create([
    { name: 'Meme Brand', email: 'brand@example.com', passwordHash, role: 'brand' },
    { name: 'Hype Co', email: 'hype@example.com', passwordHash, role: 'brand' },
    { name: 'Arjun', email: 'arjun@example.com', passwordHash, role: 'creator' },
    { name: 'Priya', email: 'priya@example.com', passwordHash, role: 'creator' },
    { name: 'Karthik', email: 'karthik@example.com', passwordHash, role: 'creator' },
  ]);

  // Campaign 1 is fully spent (closed): shows the budget cap. Campaign 2 is live with 8,200 left.
  const [camp1, camp2] = await CampaignModel.create([
    {
      brandId: brand1!._id, name: 'Summer Meme Promo', platform: 'Instagram',
      totalBudget: 5_000, remainingBudget: 0, status: 'closed',
      milestones: [{ views: 10_000, payout: 500 }, { views: 50_000, payout: 2_000 }, { views: 100_000, payout: 5_000 }],
    },
    {
      brandId: brand2!._id, name: 'YouTube Shorts Push', platform: 'YouTube',
      totalBudget: 10_000, remainingBudget: 8_200, status: 'live',
      milestones: [{ views: 5_000, payout: 300 }, { views: 25_000, payout: 1_500 }, { views: 100_000, payout: 6_000 }],
    },
  ]);

  const [s1, s2, s3, s4] = await SubmissionModel.create([
    { campaignId: camp1!._id, creatorId: arjun!._id, postUrl: 'https://instagram.com/p/exampleA', views: 60_000, eligiblePayout: 2_000, allocatedPayout: 2_000, viewsUpdatedAt: day('10-05') },
    // Partial: eligible 5000 but only 3000 allocated because the budget ran out.
    { campaignId: camp1!._id, creatorId: priya!._id, postUrl: 'https://instagram.com/p/exampleB', views: 120_000, eligiblePayout: 5_000, allocatedPayout: 3_000, viewsUpdatedAt: day('10-08') },
    { campaignId: camp2!._id, creatorId: karthik!._id, postUrl: 'https://youtube.com/shorts/exampleC', views: 30_000, eligiblePayout: 1_500, allocatedPayout: 1_500, viewsUpdatedAt: day('10-11') },
    { campaignId: camp2!._id, creatorId: arjun!._id, postUrl: 'https://youtube.com/shorts/exampleD', views: 8_000, eligiblePayout: 300, allocatedPayout: 300, flagged: true, viewsUpdatedAt: day('10-10') },
    { campaignId: camp2!._id, creatorId: priya!._id, postUrl: 'https://youtube.com/shorts/exampleE', views: 2_000, viewsUpdatedAt: day('10-12') },
  ]);

  const row = (s: typeof s1, c: typeof camp1, amount: number, at: string) => ({
    submissionId: s!._id, campaignId: c!._id, creatorId: s!.creatorId, amount, createdAt: day(at),
  });
  await PayoutModel.create([
    row(s1, camp1, 500, '10-01'), row(s1, camp1, 1_500, '10-05'),
    row(s2, camp1, 500, '10-02'), row(s2, camp1, 1_500, '10-04'), row(s2, camp1, 1_000, '10-08'),
    row(s3, camp2, 300, '10-09'), row(s3, camp2, 1_200, '10-11'),
    row(s4, camp2, 300, '10-10'),
  ]);

  console.log(`Seeded. Campaign 1 spent ${formatRupees(5_000)} (closed), campaign 2 spent ${formatRupees(1_800)}.`);
  console.log('Login with any seeded email and the password: Password123!');
  console.log('Submission id for PATCH /views demo:', s5Id(await SubmissionModel.findOne({ postUrl: /exampleE/ })));
}

const s5Id = (s: { _id: mongoose.Types.ObjectId } | null) => s?._id.toString();

seed()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());
