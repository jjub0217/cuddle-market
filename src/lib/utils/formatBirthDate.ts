export const formatBirthDate = (birthDate?: string): string => {
  if (!birthDate) return ''
  return birthDate.replace(/-/g, '. ')
}
