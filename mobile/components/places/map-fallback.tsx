import { Component, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

// 지도가 못 뜰 때 앱 전체가 죽지 않게 받아내는 그물.
//
// 왜 필요한가 — 지도는 **네이티브 부품**이라 앱을 새로 빌드해 깔아야 들어온다.
// 옛 빌드를 쓰는 폰에서는 그 부품이 없다. 그때 그냥 두면 화면 하나가 앱 전체를
// 데려간다. 실제로 겪었다(2026-08-06): 홈·커뮤니티까지 다 안 열렸다.
//
// 내부 배포(EAS internal)라 **사람마다 깔린 빌드가 다르다.** 새 부품을 넣을 때마다
// 누군가는 옛 빌드로 앱을 연다. 그 사람에게 「앱이 고장났다」가 아니라 「이 화면은
// 새 판이 필요하다」로 보여야 한다.
//
// ⚠️ 오류를 받아내는 건 클래스로만 된다(componentDidCatch). 훅으로는 못 한다.

interface Props {
  children: ReactNode;
}

interface State {
  실패: boolean;
}

export class MapBoundary extends Component<Props, State> {
  state: State = { 실패: false };

  static getDerivedStateFromError(): State {
    return { 실패: true };
  }

  render() {
    if (this.state.실패) return <MapUnavailable />;
    return this.props.children;
  }
}

/** 지도를 못 그릴 때 그 자리에 대신 놓는 안내. 시트는 그대로 뜨므로 목록은 볼 수 있다. */
export function MapUnavailable() {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>지도를 불러올 수 없어요</Text>
      <Text style={styles.hint}>앱을 최신 판으로 새로 설치하면 보입니다</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
  },
  title: { fontSize: 15, fontWeight: '700', color: '#374151' },
  hint: { fontSize: 13, color: '#6B7280' },
});
