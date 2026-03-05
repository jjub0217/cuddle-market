import type { AdminTableResponse, SortState, FilterState } from '../types/adminTable'
import { CITIES, PROVINCES } from '@/constants/cities'

export interface MockUser {
  id: number
  name: string
  nickname: string
  email: string
  joinedAt: string
  birthDate: string
  addressSido: string
  addressGugun: string
  profileImageUrl: string | null
  role: string
  status: string
  withdrawalRequestedAt: string | null
}

const USER_STATUSES = ['활성', '비활성', '탈퇴요청']
const NICKNAMES = [
  '댕댕이맘', '냥이집사', '펫러버', '동물친구', '쿠들러',
  '멍뭉이파파', '고양이왕국', '반려인생', '펫프렌즈', '해피독',
  '캣맘', '강아지러버', '냥냥이', '도그워커', '캣타워',
]
const NAMES = [
  '김민수', '이서연', '박지호', '최수아', '정도윤',
  '강하은', '조유준', '윤서진', '임지아', '한민재',
  '오예린', '신동현', '황수빈', '배준서', '류하윤',
]
const ROLES = ['일반회원', '관리자']

function randomAddress(): { addressSido: string; addressGugun: string } {
  const sido = PROVINCES[Math.floor(Math.random() * PROVINCES.length)]
  const guguns = CITIES[sido]
  const gugun = guguns[Math.floor(Math.random() * guguns.length)]
  return { addressSido: sido, addressGugun: gugun }
}

function randomDate(start: Date, end: Date): string {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return d.toISOString()
}

function generateUsers(count: number): MockUser[] {
  return Array.from({ length: count }, (_, i) => {
    const status = USER_STATUSES[Math.floor(Math.random() * USER_STATUSES.length)]
    return {
      id: i + 1,
      name: NAMES[i % NAMES.length],
      nickname: `${NICKNAMES[i % NICKNAMES.length]}${i + 1}`,
      email: `user${i + 1}@example.com`,
      joinedAt: randomDate(new Date('2023-01-01'), new Date('2025-12-31')),
      birthDate: randomDate(new Date('1980-01-01'), new Date('2005-12-31')),
      ...randomAddress(),
      profileImageUrl: [1, 3, 5, 7, 10].includes(i + 1) ? `https://i.pravatar.cc/150?img=${i + 1}` : null,
      role: ROLES[Math.floor(Math.random() * ROLES.length)],
      status,
      withdrawalRequestedAt: status !== '활성' ? randomDate(new Date('2025-01-01'), new Date('2025-12-31')) : null,
    }
  })
}

const users = generateUsers(30)

export function getMockUsers(params: {
  page: number
  pageSize: number
  sort?: SortState
  filters?: FilterState
  search?: string
}): AdminTableResponse<MockUser> {
  let filtered = [...users]

  if (params.search) {
    const q = params.search.toLowerCase()
    filtered = filtered.filter(
      (u) => u.nickname.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    )
  }

  if (params.filters?.status) {
    filtered = filtered.filter((u) => u.status === params.filters!.status)
  }

  if (params.filters?.role) {
    filtered = filtered.filter((u) => u.role === params.filters!.role)
  }

  if (params.sort?.direction) {
    const { key, direction } = params.sort
    filtered.sort((a, b) => {
      const aVal = a[key as keyof MockUser]
      const bVal = b[key as keyof MockUser]
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' ? aVal - bVal : bVal - aVal
      }
      return 0
    })
  }

  const total = filtered.length
  const start = (params.page - 1) * params.pageSize
  const data = filtered.slice(start, start + params.pageSize)

  return { data, total, page: params.page, pageSize: params.pageSize }
}
