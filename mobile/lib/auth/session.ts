import type { QueryClient } from '@tanstack/react-query';

import { readMessage } from '../reports';

import { apiBaseUrl, apiFetch } from './api';
import { useAuthStore } from './store';
import { clearTokens, loadTokens, saveTokens } from './tokens';

// 서버 · 메모리 store · 기기 저장소 세 곳을 한 번에 맞추는 자리.
// 화면은 여기 함수만 부르고, 세 곳을 각각 건드리지 않는다.

/** 이메일이나 비밀번호가 틀렸을 때. 화면에서 다른 오류와 문구를 구분하려고 따로 둔다. */
export class InvalidCredentialsError extends Error {
  constructor() {
    super('이메일 또는 비밀번호가 일치하지 않습니다.');
    this.name = 'InvalidCredentialsError';
  }
}

interface LoginResponse {
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

/**
 * 이메일 · 비밀번호로 로그인한다.
 * apiFetch가 아니라 순수 fetch를 쓰는 이유: 로그인은 토큰이 필요 없는 요청이고,
 * 401을 갱신 흐름으로 끌고 갈 이유도 없다. (웹도 로그인만 raw axios를 쓴다)
 */
export async function login(email: string, password: string): Promise<void> {
  const res = await fetch(`${apiBaseUrl()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (res.status === 400 || res.status === 401) {
    throw new InvalidCredentialsError();
  }
  if (!res.ok) {
    throw new Error(`로그인에 실패했어요 (HTTP ${res.status})`);
  }

  const body = (await res.json()) as LoginResponse;
  const { accessToken, refreshToken } = body.data;

  useAuthStore.getState().setSession({ accessToken, refreshToken });
  await saveTokens({ accessToken, refreshToken });
}

/**
 * 앱을 켤 때 기기에 남은 토큰으로 세션을 되살린다.
 * 토큰이 서버에서 아직 살아있는지는 여기서 확인하지 않는다 — 확인될 때까지 기다리면
 * 앱 실행이 매번 느려진다. 첫 요청이 401을 맞으면 그때 apiFetch가 정리한다.
 */
export async function restore(): Promise<void> {
  const tokens = await loadTokens();

  if (!tokens) {
    useAuthStore.getState().clearSession();
    return;
  }

  useAuthStore.getState().setSession(tokens);
}

/** 기기 정리는 서버 호출 성공 여부와 상관없이 반드시 한다. */
async function clearLocalSession(queryClient: QueryClient): Promise<void> {
  await clearTokens();
  useAuthStore.getState().clearSession();
  // 남의 찜 정보 같은 잔상이 다음 사용자에게 보이지 않도록 캐시를 통째로 비운다.
  queryClient.clear();
}

export async function logout(queryClient: QueryClient): Promise<void> {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch {
    // 서버에 못 알려도 계속 진행한다. 기기에 토큰이 남는 쪽이 훨씬 나쁘다.
  } finally {
    await clearLocalSession(queryClient);
  }
}

export async function withdraw(
  queryClient: QueryClient,
  input: { reason: string; detailReason: string }
): Promise<void> {
  // ⚠️ 상세 사유가 비면 **아예 안 보낸다.** 서버에서 선택 필드지만 길이 규칙이 걸려 있어
  //    (@Size(min=2)) 빈 글자를 보내면 「2자 이상」에 막힌다 — 안 적었는데 너무 짧다고
  //    거절당하는 꼴이다(2026-08-04 실기기, HTTP 400).
  //    reports.ts의 trimmed()가 같은 함정을 이미 이렇게 피하고 있다.
  const detailReason = input.detailReason.trim();

  const res = await apiFetch('/auth/withdraw', {
    method: 'DELETE',
    body: JSON.stringify({
      reason: input.reason,
      ...(detailReason ? { detailReason } : {}),
    }),
  });

  if (!res.ok) {
    // 탈퇴가 안 됐는데 로그아웃시키면 사용자가 "탈퇴됐구나"로 오해한다. 세션을 그대로 둔다.
    //
    // ⚠️ 서버 문구를 살린다. 상태 코드만으로는 무엇이 틀렸는지 못 가린다 —
    //    실기기에서 400이 났는데 「사유가 필수」인지 다른 이유인지 알 수 없었다(2026-08-04).
    //    reports.ts·community.ts가 쓰는 readMessage와 같은 방식이다.
    const message = await readMessage(res);
    throw new Error(message ?? `탈퇴에 실패했어요 (HTTP ${res.status})`);
  }

  await clearLocalSession(queryClient);
}
