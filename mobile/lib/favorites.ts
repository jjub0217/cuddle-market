import { apiFetch } from '@/lib/auth/api';

/**
 * 찜을 켜고 끈다. 켜는 것과 끄는 것이 **같은 주소**다(웹 GraphQL 리졸버에서 확인).
 * 그래서 지금 상태를 서버에 보내지 않고, 그냥 한 번 부르면 뒤집힌다.
 */
export async function toggleFavorite(productId: number): Promise<void> {
  const res = await apiFetch(`/products/${productId}/favorite`, { method: 'POST' });

  if (!res.ok) {
    throw new Error(`찜에 실패했어요 (HTTP ${res.status})`);
  }
}
