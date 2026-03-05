'use client'

import { useState } from 'react'
import AdminTable from './table/AdminTable'
import { userTableConfig } from '../configs/userTableConfig'
import { fetchAdminUsers } from '@/lib/api/admin'
import type { MockUser } from '../mocks/mockUsers'
import UserDetailModal from './users/UserDetailModal'

export default function UsersManagement() {
  const [selectedUser, setSelectedUser] = useState<MockUser | null>(null)

  return (
    <>
      <AdminTable<MockUser>
        config={userTableConfig}
        queryKey="admin-users"
        fetchFn={fetchAdminUsers}
        onRowClick={(user) => setSelectedUser(user)}
      />
      <UserDetailModal
        isOpen={selectedUser !== null}
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </>
  )
}
