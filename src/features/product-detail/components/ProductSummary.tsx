import ProductMetadataList from './ProductMetadataList'
import ProductTitle from './ProductTitle'

interface ProductHeaderProps {
  data: {
    title: string
    productType: string
    price: number
    addressSido: string
    addressGugun: string
    createdAt: string
    viewCount: number
    favoriteCount: number
  }
}

export default function ProductSummary({ data }: ProductHeaderProps) {
  return (
    <div className="flex flex-col gap-3.5">
      <ProductTitle title={data.title} productType={data.productType} price={data.price} />
      <ProductMetadataList
        addressSido={data.addressSido}
        addressGugun={data.addressGugun}
        createdAt={data.createdAt}
        viewCount={data.viewCount}
        favoriteCount={data.favoriteCount}
      />
    </div>
  )
}
