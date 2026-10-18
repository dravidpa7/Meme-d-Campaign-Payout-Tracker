import { Types } from 'mongoose';
import { ConflictError, NotFoundError } from '../../../src/errors/http-errors';
import { payoutService } from '../../../src/services/payout.service';
import { campaignRepository } from '../../../src/repositories/campaign.repository';
import { payoutRepository } from '../../../src/repositories/payout.repository';
import { submissionRepository } from '../../../src/repositories/submission.repository';
import { cacheService } from '../../../src/services/cache.service';

// Mock every I/O boundary so only the orchestration logic is under test.
jest.mock('../../../src/repositories/campaign.repository', () => ({
  campaignRepository: { findById: jest.fn(), deductBudgetUpTo: jest.fn() },
}));
jest.mock('../../../src/repositories/submission.repository', () => ({
  submissionRepository: { findById: jest.fn(), applyViewUpdate: jest.fn() },
}));
jest.mock('../../../src/repositories/payout.repository', () => ({
  payoutRepository: { create: jest.fn() },
}));
jest.mock('../../../src/services/cache.service', () => ({
  cacheService: { invalidateLiveCampaigns: jest.fn() },
}));
jest.mock('../../../src/utils/transaction', () => ({
  withTransaction: <T>(fn: (session: unknown) => Promise<T>) => fn({ fake: 'session' }),
}));

const campaigns = jest.mocked(campaignRepository);
const submissions = jest.mocked(submissionRepository);
const payouts = jest.mocked(payoutRepository);
const cache = jest.mocked(cacheService);

const campaignId = new Types.ObjectId();
const creatorId = new Types.ObjectId();
const submissionId = new Types.ObjectId();
const t0 = new Date('2026-10-14T10:00:00.000Z');
const hoursLater = (h: number) => new Date(t0.getTime() + h * 3_600_000);

const campaign = {
  _id: campaignId,
  milestones: [
    { views: 10_000, payout: 500 },
    { views: 50_000, payout: 2_000 },
    { views: 100_000, payout: 5_000 },
  ],
} as never;

function givenSubmission(overrides: Record<string, unknown> = {}) {
  submissions.findById.mockResolvedValue({
    _id: submissionId,
    campaignId,
    creatorId,
    views: 0,
    eligiblePayout: 0,
    allocatedPayout: 0,
    flagged: false,
    viewsUpdatedAt: t0,
    ...overrides,
  } as never);
}

beforeEach(() => {
  jest.resetAllMocks();
  campaigns.findById.mockResolvedValue(campaign);
  submissions.applyViewUpdate.mockResolvedValue(true);
});

describe('payoutService.updateViews', () => {
  it('pays the full delta on the first milestone and writes a ledger row', async () => {
    givenSubmission();
    campaigns.deductBudgetUpTo.mockResolvedValue(10_000);

    const r = await payoutService.updateViews(submissionId.toString(), 12_000, hoursLater(48));

    expect(campaigns.deductBudgetUpTo).toHaveBeenCalledWith(campaignId, 500, expect.anything());
    expect(submissions.applyViewUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ views: 12_000, eligiblePayout: 500, paid: 500, expectedAllocatedPayout: 0 }),
      expect.anything(),
    );
    expect(payouts.create).toHaveBeenCalledWith(
      { submissionId, campaignId, creatorId, amount: 500 },
      expect.anything(),
    );
    expect(r).toMatchObject({ paidNow: 500, allocatedPayout: 500, isPartial: false });
    expect(cache.invalidateLiveCampaigns).toHaveBeenCalledTimes(1);
  });

  it('pays only the difference when climbing to a higher milestone', async () => {
    givenSubmission({ views: 12_000, eligiblePayout: 500, allocatedPayout: 500 });
    campaigns.deductBudgetUpTo.mockResolvedValue(9_500);

    const r = await payoutService.updateViews(submissionId.toString(), 60_000, hoursLater(48));

    expect(campaigns.deductBudgetUpTo).toHaveBeenCalledWith(campaignId, 1_500, expect.anything());
    expect(r).toMatchObject({ paidNow: 1_500, allocatedPayout: 2_000, eligiblePayout: 2_000 });
  });

  it('does not touch the budget or ledger on a repeated update (idempotent)', async () => {
    givenSubmission({ views: 60_000, eligiblePayout: 2_000, allocatedPayout: 2_000 });

    const r = await payoutService.updateViews(submissionId.toString(), 60_000, hoursLater(48));

    expect(campaigns.deductBudgetUpTo).not.toHaveBeenCalled();
    expect(payouts.create).not.toHaveBeenCalled();
    expect(cache.invalidateLiveCampaigns).not.toHaveBeenCalled();
    expect(r).toMatchObject({ paidNow: 0, allocatedPayout: 2_000 });
  });

  it('keeps the money and eligiblePayout when views decrease (no clawback)', async () => {
    givenSubmission({ views: 60_000, eligiblePayout: 2_000, allocatedPayout: 2_000 });

    const r = await payoutService.updateViews(submissionId.toString(), 5_000, hoursLater(48));

    expect(submissions.applyViewUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ views: 5_000, eligiblePayout: 2_000, paid: 0 }),
      expect.anything(),
    );
    expect(r).toMatchObject({ paidNow: 0, allocatedPayout: 2_000, eligiblePayout: 2_000 });
  });

  it('pays a partial amount when the budget runs out mid-payout', async () => {
    givenSubmission({ views: 60_000, eligiblePayout: 2_000, allocatedPayout: 2_000 });
    campaigns.deductBudgetUpTo.mockResolvedValue(1_000); // owed 3000, only 1000 left

    const r = await payoutService.updateViews(submissionId.toString(), 120_000, hoursLater(48));

    expect(r).toMatchObject({ paidNow: 1_000, isPartial: true, allocatedPayout: 3_000, eligiblePayout: 5_000 });
    expect(payouts.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 1_000 }), expect.anything());
  });

  it('pays nothing and writes no ledger row when the budget is already empty', async () => {
    givenSubmission();
    campaigns.deductBudgetUpTo.mockResolvedValue(0);

    const r = await payoutService.updateViews(submissionId.toString(), 120_000, hoursLater(48));

    expect(r).toMatchObject({ paidNow: 0, isPartial: true, allocatedPayout: 0 });
    expect(payouts.create).not.toHaveBeenCalled();
    expect(cache.invalidateLiveCampaigns).not.toHaveBeenCalled();
  });

  it('flags a submission whose views spike unusually fast', async () => {
    givenSubmission({ views: 0, viewsUpdatedAt: t0 });
    campaigns.deductBudgetUpTo.mockResolvedValue(10_000);

    const r = await payoutService.updateViews(submissionId.toString(), 100_000, hoursLater(1));

    expect(r.flagged).toBe(true);
    expect(submissions.applyViewUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ flagged: true }),
      expect.anything(),
    );
  });

  it('does not flag organic growth, and keeps an existing flag', async () => {
    givenSubmission({ views: 0, viewsUpdatedAt: t0 });
    campaigns.deductBudgetUpTo.mockResolvedValue(10_000);
    expect((await payoutService.updateViews(submissionId.toString(), 12_000, hoursLater(48))).flagged).toBe(false);

    givenSubmission({ flagged: true, views: 12_000, viewsUpdatedAt: t0 });
    expect((await payoutService.updateViews(submissionId.toString(), 12_001, hoursLater(48))).flagged).toBe(true);
  });

  it('survives clock skew (now earlier than last update) without throwing', async () => {
    givenSubmission({ viewsUpdatedAt: hoursLater(5) });
    campaigns.deductBudgetUpTo.mockResolvedValue(10_000);

    await expect(payoutService.updateViews(submissionId.toString(), 12_000, t0)).resolves.toBeDefined();
  });

  it('throws Conflict (rolling back the transaction) when the guarded update matches nothing', async () => {
    givenSubmission();
    campaigns.deductBudgetUpTo.mockResolvedValue(10_000);
    submissions.applyViewUpdate.mockResolvedValue(false);

    await expect(payoutService.updateViews(submissionId.toString(), 12_000, hoursLater(48))).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect(payouts.create).not.toHaveBeenCalled();
  });

  it('throws NotFound when the submission does not exist', async () => {
    submissions.findById.mockResolvedValue(null);
    await expect(payoutService.updateViews(submissionId.toString(), 1, t0)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws NotFound when the campaign does not exist', async () => {
    givenSubmission();
    campaigns.findById.mockResolvedValue(null);
    await expect(payoutService.updateViews(submissionId.toString(), 1, t0)).rejects.toBeInstanceOf(NotFoundError);
  });
});
