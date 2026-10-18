import { applyBudgetCap } from '../../../src/domain/budget-cap';
import { DomainError } from '../../../src/domain/domain-error';

describe('applyBudgetCap', () => {
  it('pays the full amount when the budget is plentiful', () => {
    expect(applyBudgetCap(500, 5_000)).toEqual({
      payable: 500,
      shortfall: 0,
      isPartial: false,
      exhaustsBudget: false,
    });
  });

  it('pays in full and exhausts the budget when the amount equals remaining', () => {
    expect(applyBudgetCap(1_000, 1_000)).toEqual({
      payable: 1_000,
      shortfall: 0,
      isPartial: false,
      exhaustsBudget: true,
    });
  });

  it('pays only what is left when the budget runs out mid-payout', () => {
    expect(applyBudgetCap(5_000, 3_000)).toEqual({
      payable: 3_000,
      shortfall: 2_000,
      isPartial: true,
      exhaustsBudget: true,
    });
  });

  it('pays nothing when the budget is already zero', () => {
    expect(applyBudgetCap(500, 0)).toEqual({
      payable: 0,
      shortfall: 500,
      isPartial: true,
      exhaustsBudget: true,
    });
  });

  it('pays nothing and is not partial when nothing is requested', () => {
    expect(applyBudgetCap(0, 1_000)).toEqual({
      payable: 0,
      shortfall: 0,
      isPartial: false,
      exhaustsBudget: false,
    });
  });

  it('never pays more than the remaining budget (property check)', () => {
    for (let requested = 0; requested <= 200; requested += 7) {
      for (let remaining = 0; remaining <= 200; remaining += 11) {
        const r = applyBudgetCap(requested, remaining);
        expect(r.payable).toBeLessThanOrEqual(remaining);
        expect(r.payable).toBeLessThanOrEqual(requested);
        expect(r.payable + r.shortfall).toBe(requested);
      }
    }
  });

  it.each([
    [-1, 100],
    [1.5, 100],
    [100, -1],
    [100, 2.5],
  ])('rejects invalid input: requested=%p remaining=%p', (requested, remaining) => {
    expect(() => applyBudgetCap(requested, remaining)).toThrow(DomainError);
  });
});
