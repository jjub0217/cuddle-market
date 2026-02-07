export const formatBirthDate = (birthDate?: string) => {
  if (!birthDate) return ''
  return birthDate.replace(/-/g, '. ')
}
