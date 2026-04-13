import tls from 'node:tls';

// ============================================================
// Configuration
// ============================================================
const API_URL = 'https://cmarket-api.duckdns.org/api';
const HOST = 'cmarket-api.duckdns.org';
const TIMEOUT_MS = 10_000;
const SSL_WARN_DAYS = 7;
const SSL_DANGER_DAYS = 3;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// ============================================================
// Helpers
// ============================================================
function nowKST() {
  return new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
}

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
    const res = await fetch(API_URL, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      console.log(`[OK] API 응답 정상 (${res.status})`);
      return null;
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
    const socket = tls.connect({ port: 443, host: HOST, servername: HOST, timeout: TIMEOUT_MS }, () => {
      const cert = socket.getPeerCertificate();
      socket.end();

      if (!cert || !cert.valid_to) {
        resolve({
          type: 'SSL 인증서 오류',
          detail: '인증서 정보를 가져올 수 없습니다.',
          color: 0xff0000,
        });
        return;
      }

      const expiryDate = new Date(cert.valid_to);
      const daysLeft = Math.floor((expiryDate - Date.now()) / (1000 * 60 * 60 * 24));

      if (daysLeft < 0) {
        resolve({
          type: 'SSL 인증서 만료',
          detail: `인증서가 이미 만료되었습니다. (만료일: ${cert.valid_to})`,
          color: 0xff0000,
        });
      } else if (daysLeft <= SSL_DANGER_DAYS) {
        resolve({
          type: 'SSL 인증서 위험',
          detail: `만료까지 ${daysLeft}일 남음 (만료일: ${cert.valid_to})`,
          color: 0xff0000,
        });
      } else if (daysLeft <= SSL_WARN_DAYS) {
        resolve({
          type: 'SSL 인증서 경고',
          detail: `만료까지 ${daysLeft}일 남음 (만료일: ${cert.valid_to})`,
          color: 0xffaa00,
        });
      } else {
        console.log(`[OK] SSL 인증서 정상 (만료까지 ${daysLeft}일)`);
        resolve(null);
      }
    });

    socket.on('error', (err) => {
      resolve({
        type: 'SSL 연결 오류',
        detail: err.message,
        color: 0xff0000,
      });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({
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

  const [apiResult, sslResult] = await Promise.all([checkAPI(), checkSSL()]);

  const problems = [apiResult, sslResult].filter(Boolean);

  if (problems.length === 0) {
    console.log('\n[결과] 모든 체크 통과 — 알림 없음\n');
    process.exit(0);
  }

  console.log(`\n[결과] ${problems.length}건의 문제 감지 — 디스코드 알림 발송\n`);

  const embeds = problems.map((p) => ({
    title: `🚨 ${p.type}`,
    description: p.detail,
    color: p.color,
    fields: [
      { name: '대상', value: API_URL, inline: true },
      { name: '시각', value: nowKST(), inline: true },
    ],
    footer: { text: 'Cuddle Market 서버 모니터링' },
  }));

  await sendDiscord(embeds);
  console.log('[알림] 디스코드 전송 완료');
  process.exit(1);
}

main();
