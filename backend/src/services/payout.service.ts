import { applyBudgetCap } from '../domain/budget-cap';
import { calculateEligiblePayout, calculatePayoutDelta } from '../domain/payout-calculator';
import { ConflictError, NotFoundError } from '../errors/http-errors';
import { campaignRepository } from '../repositories/campaign.repository';
import { payoutRepository } from '../repositories/payout.repository';
import { submissionRepository } from '../repositories/submission.repository';
import { withTransaction } from '../utils/transaction';
import { cacheService } from './cache.service';
import { fraudService } from './fraud.service';

export interface ViewUpdateResult {
  submissionId: string;
  views: number;
  eligiblePayout: number;
  allocatedPayout: number;
  /** Rupees paid by THIS update (0 on repeats). */
  paidNow: number;
  /** True when the budget could not cover the full amount owed. */
  isPartial: boolean;
  flagged: boolean;
}

export const payoutService = {
  /**
   * PATCH /submissions/:id/views flow. Everything below runs in one transaction:
   *   1. read submission + campaign
   *   2. eligible = highest milestone crossed; delta = eligible - already allocated
   *   3. atomically deduct from the campaign budget (capped at what is left)
   *   4. guarded submission update (fails if someone else paid in the meantime)
   *   5. append a PAYOUTS ledger row
   * If any step throws, the whole thing rolls back, so budget, submission and
   * ledger can never disagree. On a write conflict the driver retries the
   * callback, which re-reads fresh state, so repeats compute delta = 0.
   */
  async updateViews(submissionId: string, newViews: number, now: Date = new Date()): Promise<ViewUpdateResult> {
    const result = await withTransaction(async (session): Promise<ViewUpdateResult> => {
      const submission = await submissionRepository.findById(submissionId, session);
      if (!submission) throw new NotFoundError('Submission not found');

      const campaign = await campaignRepository.findById(submission.campaignId, session);
      if (!campaign) throw new NotFoundError('Campaign not found');

      const eligible = calculateEligiblePayout(newViews, campaign.milestones);
      const delta = calculatePayoutDelta(eligible, submission.allocatedPayout);

      // Only touch the campaign document when there is actually money to pay.
      const remainingBefore = delta > 0 ? await campaignRepository.deductBudgetUpTo(campaign._id, delta, session) : 0;
      const cap = applyBudgetCap(delta, remainingBefore);

      // Guard against clock skew so the spike detector never sees time going backwards.
      const at = now.getTime() < submission.viewsUpdatedAt.getTime() ? submission.viewsUpdatedAt : now;
      const spike = fraudService.evaluate(
        { views: submission.views, at: submission.viewsUpdatedAt },
        { views: newViews, at },
      );

      const flagged = submission.flagged || spike.flagged; // once flagged, stays flagged
      const eligiblePayout = Math.max(submission.eligiblePayout, eligible); // never drops: no clawback

      const updated = await submissionRepository.applyViewUpdate(
        {
          id: submission._id,
          expectedAllocatedPayout: submission.allocatedPayout,
          views: newViews,
          eligiblePayout,
          paid: cap.payable,
          flagged,
          viewsUpdatedAt: at,
        },
        session,
      );
      if (!updated) throw new ConflictError('Submission was modified concurrently, please retry');

      if (cap.payable > 0) {
        await payoutRepository.create(
          {
            submissionId: submission._id,
            campaignId: campaign._id,
            creatorId: submission.creatorId,
            amount: cap.payable,
          },
          session,
        );
      }

      return {
        submissionId: submission._id.toString(),
        views: newViews,
        eligiblePayout,
        allocatedPayout: submission.allocatedPayout + cap.payable,
        paidNow: cap.payable,
        isPartial: cap.isPartial,
        flagged,
      };
    });

    // Cache invalidation happens after commit: remainingBudget in the live list is now stale.
    if (result.paidNow > 0) await cacheService.invalidateLiveCampaigns();
    return result;
  },
};
