'use client'

import { useState } from 'react'
import AdminTable from './table/AdminTable'
import { productTableConfig } from '../configs/productTableConfig'
import { fetchAdminProducts } from '@/lib/api/admin'
import type { Product } from '@/types/product'
import ProductDetailModal from './products/ProductDetailModal'

export default function ProductsManagement() {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  return (
    <>
      <AdminTable<Product>
        config={productTableConfig}
        queryKey="admin-products"
        fetchFn={fetchAdminProducts}
        onRowClick={(product) => setSelectedProductId(product.id)}
      />
      <ProductDetailModal
        isOpen={selectedProductId !== null}
        productId={selectedProductId}
        onClose={() => setSelectedProductId(null)}
      />
    </>
  )
}
