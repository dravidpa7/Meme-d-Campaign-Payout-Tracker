/** Money is stored as integer rupees. Never use floats for currency. */
export function isValidAmount(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

export function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}
