/** One rung of the payout ladder: crossing `views` earns `payout` (integer rupees). */
export interface Milestone {
  views: number;
  payout: number;
}
