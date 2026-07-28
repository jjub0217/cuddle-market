import type { Product, ProductDetailItem, ProductResponse } from '@cuddle/shared';
import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { useAuthStore } from '@/lib/auth/store';
import { toggleFavorite } from '@/lib/favorites';

// 찜 토글.
//
// 웹(src/hooks/useFavorite.ts)은 하트 상태를 useState로 따로 들고 있어서,
// 서버 값이 바뀔 때마다 useEffect로 맞춰주는 코드가 붙어 있다.
// 앱은 캐시를 직접 뒤집는다 — 상세와 홈 목록의 하트가 한 번에 같이 맞춰져서,
// 상세에서 찜하고 뒤로 나갔을 때 목록 하트가 어긋나지 않는다.

type ProductsPage = ProductResponse['data'];

export function useFavorite(productId: number) {
  const queryClient = useQueryClient();
  const router = useRouter();

  /** 상세 캐시와 목록 캐시의 하트·찜 수를 같은 값으로 맞춘다. */
  const patchCaches = (next: boolean) => {
    const delta = next ? 1 : -1;

    queryClient.setQueryData<ProductDetailItem>(['product', productId], (old) =>
      old ? { ...old, isFavorite: next, favoriteCount: old.favoriteCount + delta } : old
    );

    queryClient.setQueryData<InfiniteData<ProductsPage>>(['products'], (old) =>
      old
        ? {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              content: page.content.map((item: Product) =>
                item.id === productId
                  ? { ...item, isFavorite: next, favoriteCount: item.favoriteCount + delta }
                  : item
              ),
            })),
          }
        : old
    );
  };

  const mutation = useMutation({
    mutationFn: () => toggleFavorite(productId),

    onMutate: async () => {
      // 진행 중인 재조회가 우리가 뒤집은 값을 덮어쓰지 않게 멈춘다.
      await queryClient.cancelQueries({ queryKey: ['product', productId] });

      const before = Boolean(
        queryClient.getQueryData<ProductDetailItem>(['product', productId])?.isFavorite
      );
      patchCaches(!before);

      // 실패하면 여기로 되돌린다.
      return { before };
    },

    onError: (_error, _variables, context) => {
      if (context) patchCaches(context.before);
      Alert.alert('찜에 실패했어요', '잠시 후 다시 시도해주세요.');
    },

    onSettled: () => {
      // 성공이든 실패든 서버 값으로 다시 맞춘다.
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const toggle = () => {
    if (mutation.isPending) return;

    // 게스트면 로그인부터. 로그인에 성공하면 화면이 닫히면서 상세가 다시 조회돼
    // 하트가 채워진다(login-form.tsx의 무효화).
    if (useAuthStore.getState().status !== 'authed') {
      router.push('/login');
      return;
    }

    mutation.mutate();
  };

  return { toggle, isPending: mutation.isPending };
}
