'use client'

import { useQuery } from '@tanstack/react-query'
import { Package, Users, ArrowLeftRight, Banknote } from 'lucide-react'
import { formatPrice } from '@/lib/utils/formatPrice'
import { fetchDashboardStats } from '@/lib/api/admin'
import StatCard from './StatCard'

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin', 'dashboard-stats'],
    queryFn: fetchDashboardStats,
  })

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">대시보드</h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="총 상품"
          value={stats ? `${stats.totalProducts.toLocaleString()}개` : '-'}
          icon={Package}
        />
        <StatCard
          title="총 사용자"
          value={stats ? `${stats.totalUsers.toLocaleString()}명` : '-'}
          icon={Users}
        />
        <StatCard
          title="총 거래"
          value={stats ? `${stats.totalTransactions.toLocaleString()}건` : '-'}
          icon={ArrowLeftRight}
        />
        <StatCard
          title="총 거래액"
          value={stats ? `${formatPrice(stats.totalRevenue)}원` : '-'}
          icon={Banknote}
        />
      </div>
    </div>
  )
}
