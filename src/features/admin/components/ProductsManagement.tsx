'use client'

import { useState } from 'react'
import AdminTable from './table/AdminTable'
import { productTableConfig } from '../configs/productTableConfig'
import { fetchAdminProducts } from '@/lib/api/admin'
import type { MockProduct } from '../mocks/mockProducts'
import ProductDetailModal from './products/ProductDetailModal'

export default function ProductsManagement() {
  const [selectedProduct, setSelectedProduct] = useState<MockProduct | null>(null)
  return (
    <>
      <AdminTable<MockProduct>
        config={productTableConfig}
        queryKey="admin-products"
        fetchFn={fetchAdminProducts}
        onRowClick={(product) => setSelectedProduct(product)}
      />
      <ProductDetailModal
        isOpen={selectedProduct !== null}
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </>
  )
}
