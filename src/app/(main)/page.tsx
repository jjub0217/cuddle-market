import Home from '@/features/home/Home'
import { fetchInitialProducts } from '@/lib/api/server/products'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const initialData = await fetchInitialProducts()
  return (
    <Home initialData={initialData} />
  )
}
