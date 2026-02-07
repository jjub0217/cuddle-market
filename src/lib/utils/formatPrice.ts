export const formatPrice = (price: number): string => {
  return `${Math.floor(price).toLocaleString()}`
}
