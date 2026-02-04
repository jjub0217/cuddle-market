export const formatJoinDate = (dateString: string): string => {
  const date = new Date(dateString)
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`
}
