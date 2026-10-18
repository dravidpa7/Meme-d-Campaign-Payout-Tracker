import {
  calculateEligiblePayout,
  calculatePayoutDelta,
  sortMilestones,
  validateMilestones,
} from '../../../src/domain/payout-calculator';
import { DomainError } from '../../../src/domain/domain-error';
import { Milestone } from '../../../src/domain/types';

const ladder: Milestone[] = [
  { views: 10_000, payout: 500 },
  { views: 50_000, payout: 2_000 },
  { views: 100_000, payout: 5_000 },
];

describe('calculateEligiblePayout', () => {
  it('returns 0 for zero views', () => {
    expect(calculateEligiblePayout(0, ladder)).toBe(0);
  });

  it('returns 0 just below the first milestone', () => {
    expect(calculateEligiblePayout(9_999, ladder)).toBe(0);
  });

  it('pays the first milestone exactly at its threshold (inclusive)', () => {
    expect(calculateEligiblePayout(10_000, ladder)).toBe(500);
  });

  it('keeps the lower payout between milestones', () => {
    expect(calculateEligiblePayout(49_999, ladder)).toBe(500);
  });

  it('pays the highest milestone crossed', () => {
    expect(calculateEligiblePayout(60_000, ladder)).toBe(2_000);
  });

  it('pays the top milestone at and beyond its threshold', () => {
    expect(calculateEligiblePayout(100_000, ladder)).toBe(5_000);
    expect(calculateEligiblePayout(5_000_000, ladder)).toBe(5_000);
  });

  it('does not sum milestones when several are crossed at once', () => {
    // 0 -> 120k in one update must give 5000, not 500 + 2000 + 5000
    expect(calculateEligiblePayout(120_000, ladder)).toBe(5_000);
  });

  it('works when milestones are supplied unsorted', () => {
    const shuffled = [ladder[2]!, ladder[0]!, ladder[1]!];
    expect(calculateEligiblePayout(60_000, shuffled)).toBe(2_000);
  });

  it('does not mutate the input array', () => {
    const shuffled = [ladder[2]!, ladder[0]!, ladder[1]!];
    const copy = [...shuffled];
    calculateEligiblePayout(60_000, shuffled);
    expect(shuffled).toEqual(copy);
  });

  it('returns 0 for an empty ladder', () => {
    expect(calculateEligiblePayout(1_000_000, [])).toBe(0);
  });

  it.each([-1, 1.5, NaN, Infinity])('rejects invalid views: %p', (bad) => {
    expect(() => calculateEligiblePayout(bad, ladder)).toThrow(DomainError);
  });
});

describe('calculatePayoutDelta', () => {
  it('returns the full eligible amount on first payout', () => {
    expect(calculatePayoutDelta(500, 0)).toBe(500);
  });

  it('returns only the difference when climbing a milestone', () => {
    expect(calculatePayoutDelta(2_000, 500)).toBe(1_500);
  });

  it('returns 0 when nothing new is owed (idempotent repeat)', () => {
    expect(calculatePayoutDelta(2_000, 2_000)).toBe(0);
  });

  it('never goes negative when allocated exceeds eligible (views dropped)', () => {
    expect(calculatePayoutDelta(500, 2_000)).toBe(0);
  });

  it('returns 0 when both are zero', () => {
    expect(calculatePayoutDelta(0, 0)).toBe(0);
  });

  it.each([
    [-1, 0],
    [1.5, 0],
    [0, -1],
    [0, 2.5],
  ])('rejects invalid amounts: eligible=%p allocated=%p', (eligible, allocated) => {
    expect(() => calculatePayoutDelta(eligible, allocated)).toThrow(DomainError);
  });
});

describe('sortMilestones', () => {
  it('sorts ascending by views without mutating the input', () => {
    const input = [ladder[2]!, ladder[0]!, ladder[1]!];
    const sorted = sortMilestones(input);
    expect(sorted.map((m) => m.views)).toEqual([10_000, 50_000, 100_000]);
    expect(input[0]!.views).toBe(100_000);
  });
});

describe('validateMilestones', () => {
  it('accepts a valid ladder', () => {
    expect(() => validateMilestones(ladder)).not.toThrow();
  });

  it('accepts a valid ladder in any order', () => {
    expect(() => validateMilestones([ladder[1]!, ladder[2]!, ladder[0]!])).not.toThrow();
  });

  it('accepts a single milestone', () => {
    expect(() => validateMilestones([{ views: 1_000, payout: 100 }])).not.toThrow();
  });

  it('rejects an empty ladder', () => {
    expect(() => validateMilestones([])).toThrow(DomainError);
  });

  it('rejects a non-array value', () => {
    expect(() => validateMilestones(undefined as unknown as Milestone[])).toThrow(DomainError);
  });

  it('rejects duplicate thresholds', () => {
    expect(() =>
      validateMilestones([
        { views: 10_000, payout: 500 },
        { views: 10_000, payout: 900 },
      ]),
    ).toThrow('unique');
  });

  it('rejects payouts that do not strictly increase', () => {
    expect(() =>
      validateMilestones([
        { views: 10_000, payout: 500 },
        { views: 50_000, payout: 500 },
      ]),
    ).toThrow('strictly increase');
  });

  it('rejects a higher threshold that pays less', () => {
    expect(() =>
      validateMilestones([
        { views: 10_000, payout: 2_000 },
        { views: 50_000, payout: 500 },
      ]),
    ).toThrow(DomainError);
  });

  it.each([0, -10, 1.5])('rejects invalid view threshold: %p', (views) => {
    expect(() => validateMilestones([{ views, payout: 100 }])).toThrow(DomainError);
  });

  it.each([0, -10, 1.5])('rejects invalid payout: %p', (payout) => {
    expect(() => validateMilestones([{ views: 1_000, payout }])).toThrow(DomainError);
  });
});
