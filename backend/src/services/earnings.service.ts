import { payoutRepository } from '../repositories/payout.repository';

export interface EarningsDto {
  totalEarnings: number;
  payoutCount: number;
}

export const earningsService = {
  getForCreator(creatorId: string): Promise<EarningsDto> {
    return payoutRepository.totalsByCreator(creatorId);
  },
};
