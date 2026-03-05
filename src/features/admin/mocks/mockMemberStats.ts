export interface MonthlyMemberStat {
  month: string
  signups: number
  withdrawals: number
}

export interface WithdrawalReasonStat {
  reason: string
  count: number
}

export const mockWithdrawalReasons: WithdrawalReasonStat[] = [
  { reason: 'SERVICE_DISSATISFACTION', count: 8 },
  { reason: 'PRIVACY_CONCERN', count: 6 },
  { reason: 'LOW_USAGE', count: 7 },
  { reason: 'COMPETITOR', count: 5 },
  { reason: 'OTHER', count: 4 },
]

export interface MonthlyWithdrawalReasonStat {
  month: string
  SERVICE_DISSATISFACTION: number
  PRIVACY_CONCERN: number
  LOW_USAGE: number
  COMPETITOR: number
  OTHER: number
}

export const mockMonthlyWithdrawalReasons: MonthlyWithdrawalReasonStat[] = [
  { month: '2025-04', SERVICE_DISSATISFACTION: 3, PRIVACY_CONCERN: 1, LOW_USAGE: 2, COMPETITOR: 1, OTHER: 1 },
  { month: '2025-05', SERVICE_DISSATISFACTION: 4, PRIVACY_CONCERN: 2, LOW_USAGE: 3, COMPETITOR: 2, OTHER: 1 },
  { month: '2025-06', SERVICE_DISSATISFACTION: 2, PRIVACY_CONCERN: 1, LOW_USAGE: 1, COMPETITOR: 1, OTHER: 1 },
  { month: '2025-07', SERVICE_DISSATISFACTION: 5, PRIVACY_CONCERN: 3, LOW_USAGE: 3, COMPETITOR: 2, OTHER: 2 },
  { month: '2025-08', SERVICE_DISSATISFACTION: 3, PRIVACY_CONCERN: 2, LOW_USAGE: 2, COMPETITOR: 2, OTHER: 1 },
  { month: '2025-09', SERVICE_DISSATISFACTION: 6, PRIVACY_CONCERN: 3, LOW_USAGE: 4, COMPETITOR: 3, OTHER: 2 },
  { month: '2025-10', SERVICE_DISSATISFACTION: 4, PRIVACY_CONCERN: 3, LOW_USAGE: 3, COMPETITOR: 2, OTHER: 2 },
  { month: '2025-11', SERVICE_DISSATISFACTION: 6, PRIVACY_CONCERN: 4, LOW_USAGE: 5, COMPETITOR: 3, OTHER: 2 },
  { month: '2025-12', SERVICE_DISSATISFACTION: 7, PRIVACY_CONCERN: 4, LOW_USAGE: 5, COMPETITOR: 3, OTHER: 3 },
  { month: '2026-01', SERVICE_DISSATISFACTION: 5, PRIVACY_CONCERN: 3, LOW_USAGE: 4, COMPETITOR: 2, OTHER: 2 },
  { month: '2026-02', SERVICE_DISSATISFACTION: 6, PRIVACY_CONCERN: 3, LOW_USAGE: 4, COMPETITOR: 3, OTHER: 3 },
  { month: '2026-03', SERVICE_DISSATISFACTION: 4, PRIVACY_CONCERN: 2, LOW_USAGE: 3, COMPETITOR: 2, OTHER: 2 },
]

export const mockMemberStats: MonthlyMemberStat[] = [
  { month: '2025-04', signups: 120, withdrawals: 8 },
  { month: '2025-05', signups: 135, withdrawals: 12 },
  { month: '2025-06', signups: 98, withdrawals: 6 },
  { month: '2025-07', signups: 142, withdrawals: 15 },
  { month: '2025-08', signups: 160, withdrawals: 10 },
  { month: '2025-09', signups: 175, withdrawals: 18 },
  { month: '2025-10', signups: 155, withdrawals: 14 },
  { month: '2025-11', signups: 190, withdrawals: 20 },
  { month: '2025-12', signups: 210, withdrawals: 22 },
  { month: '2026-01', signups: 185, withdrawals: 16 },
  { month: '2026-02', signups: 200, withdrawals: 19 },
  { month: '2026-03', signups: 225, withdrawals: 13 },
]
