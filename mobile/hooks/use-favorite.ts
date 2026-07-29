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

/**
 * @param isFavorite 부르는 쪽이 지금 화면에 그리고 있는 찜 여부.
 *
 * 왜 캐시에서 안 읽고 받나:
 * 예전에는 상세 캐시(['product', id])에서 현재 값을 읽었는데, 목록에서 누를 때는
 * 그 상품 상세를 연 적이 없으면 캐시가 비어 있어 false로 읽혔다. 그러면 끄려는데
 * 켜는 방향으로 뒤집혀 하트가 안 꺼진다(실기기에서 확인). 화면이 보여주는 값을
 * 그대로 받는 편이 어긋날 여지가 없다.
 */
export function useFavorite(productId: number, isFavorite: boolean) {
  const queryClient = useQueryClient();
  const router = useRouter();

  /** 상세 캐시와 목록 캐시의 하트·찜 수를 같은 값으로 맞춘다. */
  const patchCaches = (next: boolean) => {
    const delta = next ? 1 : -1;

    queryClient.setQueryData<ProductDetailItem>(['product', productId], (old) =>
      old ? { ...old, isFavorite: next, favoriteCount: old.favoriteCount + delta } : old
    );

    /** 무한스크롤 목록 캐시 하나를 뒤집는다. */
    const patchList = (key: readonly unknown[]) => {
      queryClient.setQueryData<InfiniteData<ProductsPage>>(key, (old) =>
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

    patchList(['products']);
    // 찜 목록도 함께 뒤집는다. 이 캐시는 일부러 무효화하지 않으므로(항목이 사라지지 않게),
    // 여기서 고쳐주지 않으면 하트를 눌러도 화면이 그대로다.
    patchList(['my', 'favorites']);
  };

  const mutation = useMutation({
    mutationFn: () => toggleFavorite(productId),

    onMutate: async () => {
      // 진행 중인 재조회가 우리가 뒤집은 값을 덮어쓰지 않게 멈춘다.
      await queryClient.cancelQueries({ queryKey: ['product', productId] });

      const before = isFavorite;
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
