/**
 * End-to-end scenarios across the pure domain functions. These mirror the
 * README decisions for the cases where the brief is open.
 */
import { applyBudgetCap } from '../../../src/domain/budget-cap';
import { calculateEligiblePayout, calculatePayoutDelta } from '../../../src/domain/payout-calculator';
import { Milestone } from '../../../src/domain/types';

const ladder: Milestone[] = [
  { views: 10_000, payout: 500 },
  { views: 50_000, payout: 2_000 },
  { views: 100_000, payout: 5_000 },
];

/** Mirrors what payout.service does with an in-memory campaign + submission. */
function applyViewUpdate(
  state: { allocated: number; remainingBudget: number },
  newViews: number,
) {
  const eligible = calculateEligiblePayout(newViews, ladder);
  const delta = calculatePayoutDelta(eligible, state.allocated);
  const { payable } = applyBudgetCap(delta, state.remainingBudget);
  return {
    eligible,
    paid: payable,
    state: {
      allocated: state.allocated + payable,
      remainingBudget: state.remainingBudget - payable,
    },
  };
}

describe('payout scenarios', () => {
  it('pays deltas as a post climbs milestones over several updates', () => {
    let state = { allocated: 0, remainingBudget: 10_000 };

    const a = applyViewUpdate(state, 12_000);
    expect(a.paid).toBe(500);
    state = a.state;

    const b = applyViewUpdate(state, 60_000);
    expect(b.paid).toBe(1_500); // 2000 - 500, not 2000
    state = b.state;

    expect(state.allocated).toBe(2_000);
    expect(state.remainingBudget).toBe(8_000);
  });

  it('pays one milestone amount when two are crossed in a single update', () => {
    const r = applyViewUpdate({ allocated: 0, remainingBudget: 10_000 }, 60_000);
    expect(r.paid).toBe(2_000);
  });

  it('never double-pays when the same update is repeated', () => {
    let state = { allocated: 0, remainingBudget: 10_000 };
    for (let i = 0; i < 5; i++) {
      state = applyViewUpdate(state, 60_000).state;
    }
    expect(state.allocated).toBe(2_000);
    expect(state.remainingBudget).toBe(8_000);
  });

  it('does not claw back when views decrease', () => {
    let state = { allocated: 0, remainingBudget: 10_000 };
    state = applyViewUpdate(state, 60_000).state;
    const after = applyViewUpdate(state, 5_000);
    expect(after.paid).toBe(0);
    expect(after.state.allocated).toBe(2_000);
    expect(after.state.remainingBudget).toBe(8_000);
  });

  it('pays a partial amount when the budget runs out mid-payout', () => {
    const r = applyViewUpdate({ allocated: 2_000, remainingBudget: 1_000 }, 120_000);
    // eligible 5000, owed 3000, only 1000 left
    expect(r.eligible).toBe(5_000);
    expect(r.paid).toBe(1_000);
    expect(r.state.remainingBudget).toBe(0);
    expect(r.state.allocated).toBe(3_000);
  });

  it('pays the remainder later only if budget is still available (it is not)', () => {
    let state = { allocated: 2_000, remainingBudget: 1_000 };
    state = applyViewUpdate(state, 120_000).state;
    const again = applyViewUpdate(state, 150_000);
    expect(again.paid).toBe(0);
    expect(again.state.remainingBudget).toBe(0);
  });

  it('total paid across many submissions never exceeds the campaign budget', () => {
    const total = 5_000;
    let remaining = total;
    let paidSum = 0;
    const submissions = [120_000, 120_000, 60_000, 15_000, 200_000];

    for (const views of submissions) {
      const r = applyViewUpdate({ allocated: 0, remainingBudget: remaining }, views);
      remaining = r.state.remainingBudget;
      paidSum += r.paid;
    }

    expect(paidSum).toBeLessThanOrEqual(total);
    expect(paidSum + remaining).toBe(total);
    expect(remaining).toBeGreaterThanOrEqual(0);
  });
});
