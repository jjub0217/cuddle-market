import type { AdminTableResponse, SortState, FilterState } from '../types/adminTable'

export interface MockWithdrawal {
  id: number
  name: string
  nickname: string
  email: string
  birthDate: string
  withdrawnAt: string
  reason: string
  status: '처리완료' | '처리중' | '보류'
}

const NAMES = [
  '김민수', '이서연', '박지호', '최수아', '정도윤',
  '강하은', '조유준', '윤서진', '임지아', '한민재',
  '오예린', '신동현', '황수빈', '배준서', '류하윤',
]
const BIRTH_DATES = [
  '1990-03-15', '1988-07-22', '1995-01-10', '1992-11-05', '1987-06-28',
  '1993-09-14', '1991-04-03', '1989-12-19', '1996-02-25', '1994-08-07',
  '1990-05-30', '1988-10-12', '1995-07-08', '1992-03-21', '1987-11-16',
]

const withdrawals: MockWithdrawal[] = [
  { id: 1, name: NAMES[0], nickname: '사용자01', email: 'user01@example.com', birthDate: BIRTH_DATES[0], withdrawnAt: '2026-03-01', reason: '서비스 불만족', status: '처리완료' },
  { id: 2, name: NAMES[1], nickname: '사용자02', email: 'user02@example.com', birthDate: BIRTH_DATES[1], withdrawnAt: '2026-03-01', reason: '개인정보 우려', status: '처리완료' },
  { id: 3, name: NAMES[2], nickname: '사용자03', email: 'user03@example.com', birthDate: BIRTH_DATES[2], withdrawnAt: '2026-02-28', reason: '경쟁 서비스 이용', status: '처리완료' },
  { id: 4, name: NAMES[3], nickname: '사용자04', email: 'user04@example.com', birthDate: BIRTH_DATES[3], withdrawnAt: '2026-02-27', reason: '서비스 불만족', status: '처리중' },
  { id: 5, name: NAMES[4], nickname: '사용자05', email: 'user05@example.com', birthDate: BIRTH_DATES[4], withdrawnAt: '2026-02-26', reason: '개인정보 우려', status: '처리완료' },
  { id: 6, name: NAMES[5], nickname: '사용자06', email: 'user06@example.com', birthDate: BIRTH_DATES[5], withdrawnAt: '2026-02-25', reason: '사용 빈도 낮음', status: '보류' },
  { id: 7, name: NAMES[6], nickname: '사용자07', email: 'user07@example.com', birthDate: BIRTH_DATES[6], withdrawnAt: '2026-02-24', reason: '개인정보 우려', status: '처리완료' },
  { id: 8, name: NAMES[7], nickname: '사용자08', email: 'user08@example.com', birthDate: BIRTH_DATES[7], withdrawnAt: '2026-02-23', reason: '서비스 불만족', status: '처리완료' },
  { id: 9, name: NAMES[8], nickname: '사용자09', email: 'user09@example.com', birthDate: BIRTH_DATES[8], withdrawnAt: '2026-02-22', reason: '경쟁 서비스 이용', status: '처리중' },
  { id: 10, name: NAMES[9], nickname: '사용자10', email: 'user10@example.com', birthDate: BIRTH_DATES[9], withdrawnAt: '2026-02-21', reason: '개인정보 우려', status: '처리완료' },
  { id: 11, name: NAMES[10], nickname: '사용자11', email: 'user11@example.com', birthDate: BIRTH_DATES[10], withdrawnAt: '2026-02-20', reason: '사용 빈도 낮음', status: '처리완료' },
  { id: 12, name: NAMES[11], nickname: '사용자12', email: 'user12@example.com', birthDate: BIRTH_DATES[11], withdrawnAt: '2026-02-19', reason: '서비스 불만족', status: '보류' },
  { id: 13, name: NAMES[12], nickname: '사용자13', email: 'user13@example.com', birthDate: BIRTH_DATES[12], withdrawnAt: '2026-02-18', reason: '개인정보 우려', status: '처리완료' },
  { id: 14, name: NAMES[13], nickname: '사용자14', email: 'user14@example.com', birthDate: BIRTH_DATES[13], withdrawnAt: '2026-02-17', reason: '경쟁 서비스 이용', status: '처리중' },
  { id: 15, name: NAMES[14], nickname: '사용자15', email: 'user15@example.com', birthDate: BIRTH_DATES[14], withdrawnAt: '2026-02-16', reason: '서비스 불만족', status: '처리완료' },
  { id: 16, name: NAMES[0], nickname: '사용자16', email: 'user16@example.com', birthDate: BIRTH_DATES[0], withdrawnAt: '2026-02-15', reason: '개인정보 우려', status: '처리완료' },
  { id: 17, name: NAMES[1], nickname: '사용자17', email: 'user17@example.com', birthDate: BIRTH_DATES[1], withdrawnAt: '2026-02-14', reason: '사용 빈도 낮음', status: '보류' },
  { id: 18, name: NAMES[2], nickname: '사용자18', email: 'user18@example.com', birthDate: BIRTH_DATES[2], withdrawnAt: '2026-02-13', reason: '서비스 불만족', status: '처리완료' },
  { id: 19, name: NAMES[3], nickname: '사용자19', email: 'user19@example.com', birthDate: BIRTH_DATES[3], withdrawnAt: '2026-02-12', reason: '개인정보 우려', status: '처리중' },
  { id: 20, name: NAMES[4], nickname: '사용자20', email: 'user20@example.com', birthDate: BIRTH_DATES[4], withdrawnAt: '2026-02-11', reason: '경쟁 서비스 이용', status: '처리완료' },
  { id: 21, name: NAMES[5], nickname: '사용자21', email: 'user21@example.com', birthDate: BIRTH_DATES[5], withdrawnAt: '2026-02-10', reason: '서비스 불만족', status: '처리완료' },
  { id: 22, name: NAMES[6], nickname: '사용자22', email: 'user22@example.com', birthDate: BIRTH_DATES[6], withdrawnAt: '2026-02-09', reason: '개인정보 우려', status: '보류' },
  { id: 23, name: NAMES[7], nickname: '사용자23', email: 'user23@example.com', birthDate: BIRTH_DATES[7], withdrawnAt: '2026-02-08', reason: '사용 빈도 낮음', status: '처리완료' },
  { id: 24, name: NAMES[8], nickname: '사용자24', email: 'user24@example.com', birthDate: BIRTH_DATES[8], withdrawnAt: '2026-02-07', reason: '서비스 불만족', status: '처리중' },
  { id: 25, name: NAMES[9], nickname: '사용자25', email: 'user25@example.com', birthDate: BIRTH_DATES[9], withdrawnAt: '2026-02-06', reason: '개인정보 우려', status: '처리완료' },
  { id: 26, name: NAMES[10], nickname: '사용자26', email: 'user26@example.com', birthDate: BIRTH_DATES[10], withdrawnAt: '2026-02-05', reason: '경쟁 서비스 이용', status: '처리완료' },
  { id: 27, name: NAMES[11], nickname: '사용자27', email: 'user27@example.com', birthDate: BIRTH_DATES[11], withdrawnAt: '2026-02-04', reason: '서비스 불만족', status: '보류' },
  { id: 28, name: NAMES[12], nickname: '사용자28', email: 'user28@example.com', birthDate: BIRTH_DATES[12], withdrawnAt: '2026-02-03', reason: '개인정보 우려', status: '처리완료' },
  { id: 29, name: NAMES[13], nickname: '사용자29', email: 'user29@example.com', birthDate: BIRTH_DATES[13], withdrawnAt: '2026-02-02', reason: '사용 빈도 낮음', status: '처리중' },
  { id: 30, name: NAMES[14], nickname: '사용자30', email: 'user30@example.com', birthDate: BIRTH_DATES[14], withdrawnAt: '2026-02-01', reason: '서비스 불만족', status: '처리완료' },
]

export function getMockWithdrawals(params: {
  page: number
  pageSize: number
  sort?: SortState
  filters?: FilterState
  search?: string
}): AdminTableResponse<MockWithdrawal> {
  let filtered = [...withdrawals]

  if (params.search) {
    const q = params.search.toLowerCase()
    filtered = filtered.filter(
      (w) => w.nickname.toLowerCase().includes(q) || w.email.toLowerCase().includes(q),
    )
  }

  if (params.filters) {
    for (const [key, value] of Object.entries(params.filters)) {
      if (value) {
        filtered = filtered.filter((w) => String(w[key as keyof MockWithdrawal]) === value)
      }
    }
  }

  if (params.sort?.direction) {
    const { key, direction } = params.sort
    filtered.sort((a, b) => {
      const aVal = String(a[key as keyof MockWithdrawal])
      const bVal = String(b[key as keyof MockWithdrawal])
      return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    })
  }

  const start = (params.page - 1) * params.pageSize
  return {
    data: filtered.slice(start, start + params.pageSize),
    total: filtered.length,
    page: params.page,
    pageSize: params.pageSize,
  }
}
