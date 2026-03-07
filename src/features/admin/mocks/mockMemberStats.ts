import type { MemberTrendStat, WithdrawalReasonStat } from '../types/adminApi'

export type { MemberTrendStat, WithdrawalReasonStat }

export interface MonthlyWithdrawalReasonStat {
  month: string
  SERVICE_DISSATISFACTION: number
  PRIVACY_CONCERN: number
  LOW_USAGE: number
  COMPETITOR: number
  OTHER: number
}

export const mockWithdrawalReasons: WithdrawalReasonStat[] = [
  { reason: 'SERVICE_DISSATISFACTION', count: 8 },
  { reason: 'PRIVACY_CONCERN', count: 6 },
  { reason: 'LOW_USAGE', count: 7 },
  { reason: 'COMPETITOR', count: 5 },
  { reason: 'OTHER', count: 4 },
]

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

export const mockMemberStats: MemberTrendStat[] = [
  { yearMonth: '2025-04', signupCount: 120, withdrawalCount: 8 },
  { yearMonth: '2025-05', signupCount: 135, withdrawalCount: 12 },
  { yearMonth: '2025-06', signupCount: 98, withdrawalCount: 6 },
  { yearMonth: '2025-07', signupCount: 142, withdrawalCount: 15 },
  { yearMonth: '2025-08', signupCount: 160, withdrawalCount: 10 },
  { yearMonth: '2025-09', signupCount: 175, withdrawalCount: 18 },
  { yearMonth: '2025-10', signupCount: 155, withdrawalCount: 14 },
  { yearMonth: '2025-11', signupCount: 190, withdrawalCount: 20 },
  { yearMonth: '2025-12', signupCount: 210, withdrawalCount: 22 },
  { yearMonth: '2026-01', signupCount: 185, withdrawalCount: 16 },
  { yearMonth: '2026-02', signupCount: 200, withdrawalCount: 19 },
  { yearMonth: '2026-03', signupCount: 225, withdrawalCount: 13 },
]
