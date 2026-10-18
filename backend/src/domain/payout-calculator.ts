import { DomainError } from './domain-error';
import { Milestone } from './types';

/** Returns a copy of the milestones sorted by view threshold, ascending. */
export function sortMilestones(milestones: readonly Milestone[]): Milestone[] {
  return [...milestones].sort((a, b) => a.views - b.views);
}

/**
 * Validates a milestone ladder at campaign creation time.
 * Rules: non-empty, positive integers, thresholds strictly increasing,
 * payouts strictly increasing (a higher milestone must pay more).
 */
export function validateMilestones(milestones: readonly Milestone[]): void {
  if (!Array.isArray(milestones) || milestones.length === 0) {
    throw new DomainError('INVALID_MILESTONES', 'At least one milestone is required');
  }

  for (const m of milestones) {
    if (!Number.isInteger(m.views) || m.views <= 0) {
      throw new DomainError('INVALID_MILESTONES', 'Milestone views must be a positive integer');
    }
    if (!Number.isInteger(m.payout) || m.payout <= 0) {
      throw new DomainError('INVALID_MILESTONES', 'Milestone payout must be a positive integer');
    }
  }

  const sorted = sortMilestones(milestones);
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const curr = sorted[i]!;
    if (curr.views === prev.views) {
      throw new DomainError('INVALID_MILESTONES', 'Milestone view thresholds must be unique');
    }
    if (curr.payout <= prev.payout) {
      throw new DomainError('INVALID_MILESTONES', 'Milestone payouts must strictly increase with views');
    }
  }
}

/**
 * Payout a post is eligible for at a given view count: the payout of the
 * HIGHEST milestone crossed (views >= threshold). Milestones are not summed,
 * so crossing several in one update still yields a single milestone's amount.
 * Returns 0 when no milestone has been crossed.
 */
export function calculateEligiblePayout(views: number, milestones: readonly Milestone[]): number {
  if (!Number.isFinite(views) || !Number.isInteger(views) || views < 0) {
    throw new DomainError('INVALID_VIEWS', 'Views must be a non-negative integer');
  }

  let eligible = 0;
  for (const m of sortMilestones(milestones)) {
    if (views >= m.views) {
      eligible = m.payout;
    } else {
      break;
    }
  }
  return eligible;
}

/**
 * Amount still owed for a submission: eligible minus what was already allocated.
 * Never negative, which gives us idempotency (repeating an update owes 0)
 * and means a views decrease never claws back money.
 */
export function calculatePayoutDelta(eligiblePayout: number, allocatedPayout: number): number {
  if (!Number.isInteger(eligiblePayout) || eligiblePayout < 0) {
    throw new DomainError('INVALID_AMOUNT', 'Eligible payout must be a non-negative integer');
  }
  if (!Number.isInteger(allocatedPayout) || allocatedPayout < 0) {
    throw new DomainError('INVALID_AMOUNT', 'Allocated payout must be a non-negative integer');
  }
  return Math.max(0, eligiblePayout - allocatedPayout);
}
