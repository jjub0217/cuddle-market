import UserProfileScreen from '@/app/(tabs)/(home)/users/[id]';

// 마이 스택에서 여는 판매자 프로필.
//
// 화면은 홈 것과 똑같다. 파일을 하나 더 두는 이유는 **어느 스택에 쌓이느냐**가 다르기
// 때문이다 — products/[id]와 같은 이유다. 프로필이 홈 스택에만 있으면, 찜 목록에서
// 상품 상세로 들어가 판매자를 눌렀을 때 홈 탭으로 옮겨간 뒤 거기에 쌓인다.
// 그래서 뒤로 가면 원래 자리가 아니라 홈이 나온다.
export default UserProfileScreen;
