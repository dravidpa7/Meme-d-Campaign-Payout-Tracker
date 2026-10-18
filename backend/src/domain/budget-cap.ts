import { DomainError } from './domain-error';

export interface BudgetCapResult {
  /** What can actually be paid now: min(requested, remainingBudget). */
  payable: number;
  /** Part of the request the budget could not cover. */
  shortfall: number;
  /** True when payable < requested. */
  isPartial: boolean;
  /** True when the campaign has nothing left after this payout. */
  exhaustsBudget: boolean;
}

/**
 * Enforces the campaign budget cap. Policy: when the budget cannot cover the
 * full amount, pay whatever is left (partial payout) rather than rejecting.
 * Total payouts can therefore never exceed the campaign budget.
 */
export function applyBudgetCap(requested: number, remainingBudget: number): BudgetCapResult {
  if (!Number.isInteger(requested) || requested < 0) {
    throw new DomainError('INVALID_AMOUNT', 'Requested payout must be a non-negative integer');
  }
  if (!Number.isInteger(remainingBudget) || remainingBudget < 0) {
    throw new DomainError('INVALID_AMOUNT', 'Remaining budget must be a non-negative integer');
  }

  const payable = Math.min(requested, remainingBudget);
  return {
    payable,
    shortfall: requested - payable,
    isPartial: payable < requested,
    exhaustsBudget: remainingBudget - payable === 0,
  };
}
