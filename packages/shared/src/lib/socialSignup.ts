// 소셜로 로그인한 사람에게 추가 정보를 더 받아야 하는지. 웹과 앱이 같이 쓴다.
//
// 왜 shared인가: 서버가 소셜 가입자를 만들 때 birthDate·addressSido를 null로 두기
// 때문에 생기는 규칙이라(OAuth2UserPersistenceService.createNewUser) 웹과 앱이
// 다를 이유가 없다. 웹 SocialCallback.tsx에 박혀 있던 것을 여기로 옮겼다.

/** 판정에 필요한 두 값만 받는다. 화면마다 담는 그릇이 달라서다 */
export interface SocialSignupCheck {
  addressSido: string | null
  birthDate: string | null
}

/**
 * 「추가 정보 입력」 화면으로 보내야 하나.
 *
 * 이메일로 가입한 사람은 가입 폼에서 둘 다 받으므로 여기 걸리지 않는다.
 */
export function needsSocialSignup(user: SocialSignupCheck): boolean {
  return !user.addressSido || !user.birthDate
}
