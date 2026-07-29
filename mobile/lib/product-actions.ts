import { apiFetch } from './auth/api';

// 내 상품을 관리하는 동작 둘. 서버가 주인만 허용하므로 토큰이 반드시 필요하다.
// apiFetch가 토큰 부착과 401 갱신을 맡는다.

/**
 * 서버 enum과 같은 값(TradeStatus.java).
 * @cuddle/shared의 Product.tradeStatus는 `string | null`이라 좁은 타입이 없어 여기서 정의한다.
 */
export type TradeStatus = 'SELLING' | 'RESERVED' | 'COMPLETED';

/** 거래 상태를 바꾼다. 내 상품에만 통한다. */
export async function updateTradeStatus(
  productId: number,
  tradeStatus: TradeStatus
): Promise<void> {
  const res = await apiFetch(`/products/${productId}/trade-status`, {
    method: 'PATCH',
    body: JSON.stringify({ tradeStatus }),
  });

  if (!res.ok) {
    throw new Error(`거래 상태를 바꾸지 못했어요 (HTTP ${res.status})`);
  }
}

/** 상품을 지운다. 되돌릴 수 없으니 부르기 전에 반드시 확인을 받는다. */
export async function deleteProduct(productId: number): Promise<void> {
  const res = await apiFetch(`/products/${productId}`, { method: 'DELETE' });

  if (!res.ok) {
    throw new Error(`상품을 삭제하지 못했어요 (HTTP ${res.status})`);
  }
}
