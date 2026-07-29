import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';

import { deleteProduct, updateTradeStatus, type TradeStatus } from '@/lib/product-actions';

// 상태 변경 · 삭제 mutation.
//
// 낙관적 갱신을 하지 않는다(설계 §7):
// 찜에서 "현재 값을 어디서 읽느냐"에 걸려 방향이 뒤집힌 적이 있고, 여기는 상태가 셋이라
// 더 얽힌다. 무엇보다 삭제는 되돌릴 수 없어 먼저 지운 척했다가 실패하면 되살릴 방법이 없다.
// 연타하는 성격도 아니라 결과를 기다려도 어색하지 않다.

/**
 * @param listKeyPrefix 무효화할 목록 키의 앞부분. 예: ['my','products']
 *   필터가 쿼리 키 뒤에 붙으므로 앞부분만 주면 모든 필터의 캐시가 함께 무효화된다.
 */
export function useProductActions(listKeyPrefix: readonly unknown[]) {
  const queryClient = useQueryClient();

  /** 목록과 상세를 함께 다시 받는다. 상태가 바뀌면 상세의 뱃지도 달라져야 한다. */
  const invalidate = (productId: number) => {
    queryClient.invalidateQueries({ queryKey: listKeyPrefix });
    queryClient.invalidateQueries({ queryKey: ['product', productId] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ productId, next }: { productId: number; next: TradeStatus }) =>
      updateTradeStatus(productId, next),
    onSuccess: (_data, { productId }) => invalidate(productId),
    onError: () => {
      Alert.alert('상태를 바꾸지 못했어요', '잠시 후 다시 시도해주세요.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (productId: number) => deleteProduct(productId),
    onSuccess: (_data, productId) => invalidate(productId),
    onError: () => {
      Alert.alert('삭제하지 못했어요', '잠시 후 다시 시도해주세요.');
    },
  });

  return {
    changeStatus: (productId: number, next: TradeStatus) =>
      statusMutation.mutate({ productId, next }),
    remove: (productId: number, onDone: () => void) =>
      deleteMutation.mutate(productId, { onSuccess: onDone }),
    isPending: statusMutation.isPending || deleteMutation.isPending,
  };
}
