import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DetailHeader } from '@/components/product-detail/detail-header';

// 상품 상세. 이 단계에서는 라우팅이 붙었는지만 확인한다(내용은 Task 6~7).
// 홈과 같은 껍데기 구조: SafeAreaView(top)로 상단 인셋을 먹고 그 아래 헤더 → 본문.
export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <DetailHeader />
      <View style={styles.body}>
        <Text style={styles.text}>상세 화면 (id: {id})</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    color: '#111827',
  },
});
