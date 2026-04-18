import tls from 'node:tls';
import fs from 'node:fs';

// ============================================================
// Configuration
// ============================================================
const HEALTH_URL = 'https://cmarket-api.duckdns.org/actuator/health';
const HOST = 'cmarket-api.duckdns.org';
const TIMEOUT_MS = 10_000;
const SSL_WARN_DAYS = 7;
const SSL_DANGER_DAYS = 3;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const ALERT_STATE_PATH = process.env.ALERT_STATE_PATH || '.github/scripts/alert-state.json';
const SUPPRESS_HOURS = 3;
const CONSECUTIVE_FAILURES_THRESHOLD = 2;

// ============================================================
// Helpers
// ============================================================
function nowKST() {
  return new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
}

function formatDuration(ms) {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}시간 ${minutes}분`;
  return `${minutes}분`;
}

// ============================================================
// Alert State Management
// ============================================================
function readState() {
  try {
    return JSON.parse(fs.readFileSync(ALERT_STATE_PATH, 'utf-8'));
  } catch {
    return { status: 'ok', firstAlertAt: null, lastAlertAt: null, alertCount: 0, consecutiveFailures: 0 };
  }
}

function writeState(state) {
  fs.writeFileSync(ALERT_STATE_PATH, JSON.stringify(state, null, 2));
}

// ============================================================
// Discord
// ============================================================
async function sendDiscord(embeds) {
  if (!DISCORD_WEBHOOK_URL) {
    console.error('[SKIP] DISCORD_WEBHOOK_URL이 설정되지 않았습니다.');
    return;
  }
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds }),
    });
  } catch (err) {
    console.error('[ERROR] 디스코드 전송 실패:', err.message);
  }
}

// ============================================================
// 1. API Health Check
// ============================================================
async function checkAPI() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(HEALTH_URL, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const body = await res.json();
      if (body.status === 'UP') {
        console.log(`[OK] API 서버 응답 정상 (${res.status}, status: UP)`);
        return null;
      }
      return {
        type: 'API 장애',
        detail: `Actuator 상태: ${body.status}`,
        color: 0xff0000,
      };
    }
    return {
      type: 'API 장애',
      detail: `HTTP ${res.status} ${res.statusText}`,
      color: 0xff0000,
    };
  } catch (err) {
    clearTimeout(timer);
    const message = err.name === 'AbortError'
      ? `타임아웃 (${TIMEOUT_MS / 1000}초 초과)`
      : err.message;
    return {
      type: 'API 장애',
      detail: message,
      color: 0xff0000,
    };
  }
}

// ============================================================
// 2. SSL Certificate Check
// ============================================================
function checkSSL() {
  return new Promise((resolve) => {
    let resolved = false;
    const safeResolve = (val) => {
      if (resolved) return;
      resolved = true;
      socket.destroy();
      resolve(val);
    };

    const socket = tls.connect({ port: 443, host: HOST, servername: HOST, timeout: TIMEOUT_MS }, () => {
      const cert = socket.getPeerCertificate();

      if (!cert || !cert.valid_to) {
        safeResolve({
          type: 'SSL 인증서 오류',
          detail: '인증서 정보를 가져올 수 없습니다.',
          color: 0xff0000,
        });
        return;
      }

      const expiryDate = new Date(cert.valid_to);
      const daysLeft = Math.floor((expiryDate - Date.now()) / (1000 * 60 * 60 * 24));

      if (daysLeft < 0) {
        safeResolve({
          type: 'SSL 인증서 만료',
          detail: `인증서가 이미 만료되었습니다. (만료일: ${cert.valid_to})`,
          color: 0xff0000,
        });
      } else if (daysLeft <= SSL_DANGER_DAYS) {
        safeResolve({
          type: 'SSL 인증서 위험',
          detail: `만료까지 ${daysLeft}일 남음 (만료일: ${cert.valid_to})`,
          color: 0xff0000,
        });
      } else if (daysLeft <= SSL_WARN_DAYS) {
        safeResolve({
          type: 'SSL 인증서 경고',
          detail: `만료까지 ${daysLeft}일 남음 (만료일: ${cert.valid_to})`,
          color: 0xffaa00,
        });
      } else {
        console.log(`[OK] SSL 인증서 정상 (만료까지 ${daysLeft}일)`);
        safeResolve(null);
      }
    });

    socket.setTimeout(TIMEOUT_MS);

    socket.on('error', (err) => {
      safeResolve({
        type: 'SSL 연결 오류',
        detail: err.message,
        color: 0xff0000,
      });
    });

    socket.on('timeout', () => {
      safeResolve({
        type: 'SSL 체크 타임아웃',
        detail: `${TIMEOUT_MS / 1000}초 내 응답 없음`,
        color: 0xff0000,
      });
    });
  });
}

// ============================================================
// Main
// ============================================================
async function main() {
  console.log(`\n===== 서버 모니터링 시작 (${nowKST()}) =====\n`);

  const state = readState();
  const now = Date.now();
  const [apiResult, sslResult] = await Promise.all([checkAPI(), checkSSL()]);
  const problems = [apiResult, sslResult].filter(Boolean);

  // ── 정상: 문제 없음 ──
  if (problems.length === 0) {
    if (state.status === 'alerting') {
      const duration = formatDuration(now - new Date(state.firstAlertAt).getTime());
      console.log(`\n[복구] 서버 복구 감지 — 복구 알림 발송 (장애 지속: ${duration})\n`);
      await sendDiscord([{
        title: '✅ 서버 복구',
        description: '모든 서비스가 정상 응답합니다.',
        color: 0x00ff00,
        fields: [
          { name: '대상', value: HEALTH_URL, inline: true },
          { name: '장애 지속 시간', value: duration, inline: true },
          { name: '복구 시각', value: nowKST(), inline: false },
        ],
        footer: { text: 'Cuddle Market 서버 모니터링' },
      }]);
    }
    writeState({ status: 'ok', firstAlertAt: null, lastAlertAt: null, alertCount: 0, consecutiveFailures: 0 });
    console.log('\n[결과] 모든 체크 통과 — 알림 없음\n');
    process.exit(0);
  }

  // ── 장애 감지: 연속 실패 카운트 ──
  const consecutiveFailures = (state.consecutiveFailures || 0) + 1;

  if (state.status === 'ok' && consecutiveFailures < CONSECUTIVE_FAILURES_THRESHOLD) {
    console.log(`\n[대기] ${problems.length}건의 문제 감지 — 연속 ${consecutiveFailures}/${CONSECUTIVE_FAILURES_THRESHOLD}회 (알림 보류)\n`);
    writeState({ ...state, consecutiveFailures });
    process.exit(1);
  }

  // ── 장애: 첫 알림 (연속 실패 임계값 도달) ──
  if (state.status === 'ok') {
    console.log(`\n[결과] ${problems.length}건의 문제 ${consecutiveFailures}회 연속 감지 — 디스코드 알림 발송\n`);
    const embeds = problems.map((p) => ({
      title: `🚨 ${p.type}`,
      description: p.detail,
      color: p.color,
      fields: [
        { name: '대상', value: HEALTH_URL, inline: true },
        { name: '시각', value: nowKST(), inline: true },
      ],
      footer: { text: 'Cuddle Market 서버 모니터링' },
    }));
    await sendDiscord(embeds);
    writeState({
      status: 'alerting',
      firstAlertAt: new Date().toISOString(),
      lastAlertAt: new Date().toISOString(),
      alertCount: 1,
      consecutiveFailures,
    });
    console.log('[알림] 디스코드 전송 완료');
    process.exit(1);
  }

  // ── 장애: 지속 중 ──
  const hoursSinceLastAlert = (now - new Date(state.lastAlertAt).getTime()) / (1000 * 60 * 60);

  if (hoursSinceLastAlert >= SUPPRESS_HOURS) {
    const duration = formatDuration(now - new Date(state.firstAlertAt).getTime());
    console.log(`\n[결과] 장애 지속 중 (${duration}) — 리마인더 알림 발송\n`);
    const embeds = problems.map((p) => ({
      title: `🔔 ${p.type} (지속 중)`,
      description: `${p.detail}\n\n⏱️ 장애 지속 시간: ${duration}`,
      color: p.color,
      fields: [
        { name: '대상', value: HEALTH_URL, inline: true },
        { name: '시각', value: nowKST(), inline: true },
      ],
      footer: { text: `Cuddle Market 서버 모니터링 · 알림 ${state.alertCount + 1}회째` },
    }));
    await sendDiscord(embeds);
    writeState({
      ...state,
      lastAlertAt: new Date().toISOString(),
      alertCount: state.alertCount + 1,
      consecutiveFailures,
    });
    console.log('[알림] 리마인더 전송 완료');
  } else {
    console.log(`\n[SKIP] 알림 억제 중 (마지막 알림: ${hoursSinceLastAlert.toFixed(1)}시간 전, ${SUPPRESS_HOURS}시간 간격)\n`);
    writeState({ ...state, consecutiveFailures });
  }

  process.exit(1);
}

main();
