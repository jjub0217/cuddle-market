import { Client, type IFrame } from '@stomp/stompjs';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/screen-header';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/lib/auth/store';

/**
 * ⚠️ **실험용 화면이다. 결과를 확인하면 지운다.** (#871 · 20바퀴 채팅)
 *
 * 확인하려는 것 — 앱에서 STOMP 가 도는가.
 * 서버 쪽은 이미 확인했다(순수 WebSocket 엔드포인트가 101 로 응답).
 * 남은 것은 **React Native 의 WebSocket 위에서 @stomp/stompjs 가 도는가**다.
 * RN 의 WebSocket 은 브라우저 구현과 달라서, 서버가 열려도 여기서 막힐 수 있다.
 *
 * ⚠️ SockJS 는 안 쓴다. sockjs-client 가 XHR·쿠키 같은 브라우저 API 를 전제한다.
 *    그래서 **주소가 웹과 다르다** — 웹은 /ws-stomp (SockJS), 앱은 wss://.../ws-stomp (순수).
 */

/** API 주소에서 WebSocket 주소를 만든다. https://…/api → wss://…/ws-stomp */
function 웹소켓주소(): string {
  const api = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!api) throw new Error('EXPO_PUBLIC_API_BASE_URL 이 없다. mobile/.env 를 확인한다.');
  return api.replace(/^http/, 'ws').replace(/\/api\/?$/, '') + '/ws-stomp';
}

type 줄 = { 때: string; 글: string; 종류: 'good' | 'bad' | 'info' };

export default function StompLabScreen() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const status = useAuthStore((s) => s.status);
  const [줄들, set줄들] = useState<줄[]>([]);
  const [붙었나, set붙었나] = useState(false);
  const clientRef = useRef<Client | null>(null);

  const 적기 = (글: string, 종류: 줄['종류'] = 'info') => {
    const 때 = new Date().toISOString().slice(11, 19);
    set줄들((prev) => [...prev, { 때, 글, 종류 }]);
  };

  // 백그라운드 ↔ 복귀에서 연결이 어떻게 되는지 본다 (확인 항목 ⑤)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      적기(`앱 상태: ${s} · 연결됨=${clientRef.current?.connected ?? false}`);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => () => { clientRef.current?.deactivate(); }, []);

  const 붙기 = () => {
    if (clientRef.current?.active) {
      적기('이미 붙어 있다', 'info');
      return;
    }
    let url: string;
    try {
      url = 웹소켓주소();
    } catch (e) {
      적기(`주소 만들기 실패: ${String(e)}`, 'bad');
      return;
    }
    적기(`① 붙어볼 곳: ${url}`);
    적기(`② 토큰: ${accessToken ? '있음' : '없음 ⚠️ 로그인 먼저'}  (상태: ${status})`);

    const client = new Client({
      // ⚠️ brokerURL 이 아니라 webSocketFactory 를 쓴다.
      //    RN 전역의 WebSocket 을 쓰는지 여기서 분명히 드러난다.
      webSocketFactory: () => new WebSocket(url),
      connectHeaders: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      reconnectDelay: 0, // 실험이라 자동 재연결을 끈다
      // ⚠️ STOMP 프레임은 끝에 눈에 안 보이는 종료 문자(NULL)가 붙는다.
      //    이게 빠지면 서버는 「아직 덜 왔다」고 여겨 **오류도 로그도 없이 계속 기다린다.**
      //    맥에서 직접 재서 확인했다(2026-08-10, #871).
      //      텍스트+NULL  → 서버 로그에 찍힘
      //      NULL 없음    → 완전 침묵          ← 폰의 증상과 같다
      //      바이너리+NULL → 서버 로그에 찍힘   ← 그래서 바이너리로 보낸다
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,
      debug: (m) => { if (m.includes('>>>') || m.includes('<<<')) 적기(`  ${m.slice(0, 90)}`); },
      onConnect: (f: IFrame) => {
        set붙었나(true);
        적기(`③ ✅ CONNECTED · 서버버전 ${f.headers['version']} · 하트비트 ${f.headers['heart-beat']}`, 'good');
        // 오류 통로부터 구독한다 — 서버는 인증 실패를 여기로 보낸다
        client.subscribe('/user/queue/errors', (m) => 적기(`서버 오류: ${m.body.slice(0, 120)}`, 'bad'));
        client.subscribe('/user/queue/chat-room-list', (m) => 적기(`방목록 갱신: ${m.body.slice(0, 90)}`, 'good'));
        client.subscribe('/user/queue/chat', (m) => 적기(`메시지 옴: ${m.body.slice(0, 90)}`, 'good'));
        적기('④ 구독 셋 완료 (/user/queue/errors · chat-room-list · chat)', 'good');
      },
      onStompError: (f) => 적기(`⚠️ STOMP 오류: ${f.headers['message']} ${String(f.body).slice(0, 80)}`, 'bad'),
      onWebSocketError: (e) => 적기(`❌ WebSocket 오류: ${String((e as Error)?.message ?? e)}`, 'bad'),
      onWebSocketClose: (e) => { set붙었나(false); 적기(`닫힘 code=${e?.code} reason=${e?.reason || '(없음)'}`, 'bad'); },
      onDisconnect: () => { set붙었나(false); 적기('연결 끊김'); },
    });
    clientRef.current = client;
    client.activate();
  };

  const 끊기 = () => { clientRef.current?.deactivate(); 적기('끊기 요청'); };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="STOMP 실험 (#871)" onPressIcon={() => router.back()} />
      <View style={styles.buttons}>
        <Pressable onPress={붙기} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Text style={styles.buttonLabel}>붙기</Text>
        </Pressable>
        <Pressable onPress={끊기} style={({ pressed }) => [styles.button, styles.secondary, pressed && styles.pressed]}>
          <Text style={[styles.buttonLabel, styles.secondaryLabel]}>끊기</Text>
        </Pressable>
        <Pressable onPress={() => set줄들([])} style={({ pressed }) => [styles.button, styles.secondary, pressed && styles.pressed]}>
          <Text style={[styles.buttonLabel, styles.secondaryLabel]}>지우기</Text>
        </Pressable>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{붙었나 ? '● 연결됨' : '○ 안 붙음'}</Text>
        {/* RN 의 Text 는 마크다운을 모른다. ** 를 쓰면 별표가 그대로 보인다 */}
        <Text style={styles.guide}>
          붙은 뒤 폰의 홈 화면으로 나갔다 돌아오면 아래에 「앱 상태」가 찍힌다.
          백그라운드에서 연결이 살아 있는지 보는 것이다.
        </Text>
        <Text style={styles.guide}>
          이 화면은 탭 바깥이라 하단 탭바가 없다. 나가려면 왼쪽 위 화살표를 누른다.
        </Text>
      </View>
      <ScrollView style={styles.log} contentContainerStyle={styles.logBody}>
        {줄들.length === 0 ? <Text style={styles.hint}>「붙기」를 누른다. 로그인 상태여야 CONNECTED 가 온다.</Text> : null}
        {줄들.map((l, i) => (
          <Text key={i} style={[styles.line, l.종류 === 'good' && styles.good, l.종류 === 'bad' && styles.bad]}>
            {l.때} {l.글}
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  buttons: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 8 },
  button: { height: 48, flex: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.action },
  secondary: { backgroundColor: colors.surfaceSunken },
  pressed: { opacity: 0.85 },
  buttonLabel: { fontSize: 15, fontWeight: '600', color: colors.onAction },
  secondaryLabel: { color: colors.onSurface },
  badge: { paddingHorizontal: 16, paddingVertical: 10, gap: 6 },
  badgeText: { fontSize: 13, fontWeight: '600', color: colors.onSurfaceMuted },
  guide: { fontSize: 12, lineHeight: 17, color: colors.onSurfaceSubtle },
  log: { flex: 1, marginHorizontal: 16, marginBottom: 16, borderRadius: 8, backgroundColor: colors.surfaceSunken },
  logBody: { padding: 12, gap: 4 },
  hint: { fontSize: 13, color: colors.onSurfaceMuted },
  line: { fontSize: 11, lineHeight: 16, color: colors.onSurface, fontFamily: 'Menlo' },
  good: { color: colors.success },
  bad: { color: colors.danger },
});
