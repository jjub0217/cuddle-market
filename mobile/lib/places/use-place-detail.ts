import { useEffect, useState } from 'react';

import { getPlaceDetail } from './api';
import type { PlaceDetail } from './types';

// 플레이스(반려동물 시설) 상세를 불러오는 훅.
// find-password 훅과 같은 결로 짠다 — 여기는 react-query를 안 쓰는 lib/places 안이고,
// 화면이 열릴 때 한 번 부르고 끝나는 자리라 useEffect + useState로 충분하다.

interface PlaceDetailState {
  place: PlaceDetail | null;
  loading: boolean;
  error: string | null;
}

export function usePlaceDetail(placeId: number): PlaceDetailState {
  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // placeId가 바뀌거나 화면이 사라진 뒤 늦게 온 응답이 상태를 덮지 않게 막는다.
    let cancelled = false;

    setLoading(true);
    setError(null);

    getPlaceDetail(placeId)
      .then((detail) => {
        if (cancelled) return;
        setPlace(detail);
      })
      .catch(() => {
        if (cancelled) return;
        // 서버 오류 문구를 그대로 보여주지 않는다 — 사람이 읽을 문구로 바꾼다.
        setError('장소 정보를 불러오지 못했어요.');
        setPlace(null);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [placeId]);

  return { place, loading, error };
}
