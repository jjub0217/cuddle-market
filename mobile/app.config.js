// app.json 을 받아서 **네이버 지도 키만** 얹는다.
//
// 왜 이 파일이 필요한가 — 지도 플러그인은 키를 설정에 적으라고 하는데, `app.json` 은
// 저장소에 올라간다. json 에는 `process.env` 를 못 쓰니 자바스크립트 설정이 필요하다.
//
// Expo 는 `app.json` 과 이 파일이 **둘 다 있으면** app.json 을 `config` 로 넘겨준다.
// 그래서 app.json 을 통째로 옮겨 적을 필요가 없다 — 바꿀 것만 바꾼다.
//
// ⚠️ 이 키가 비밀은 아니다. 어차피 APK 안에 박혀서 앱을 뜯으면 나온다. 진짜 방패는
//    네이버가 **패키지 이름(com.cuddlemarket.app)으로 거르는 것**이다. 그래도 저장소에
//    박아 두지는 않는다.
//
// 값이 사는 곳:
//   내 맥      mobile/.env 의 EXPO_PUBLIC_NAVER_MAP_CLIENT_ID
//   EAS 빌드   EAS 환경변수 (eas env:list 로 확인)

const NAVER_MAP_PLUGIN = '@mj-studio/react-native-naver-map';

module.exports = ({ config }) => {
  const clientId = process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID;

  // 키가 없을 때 그냥 두면 **빌드는 성공하는데 실기기에서 회색 판만** 나온다 —
  // 원인을 찾기 가장 어려운 실패다. 그래서 알린다.
  //
  // ⚠️ 그런데 **무조건 멈추면 안 된다.** `eas` 명령은 `.env` 를 안 불러오는데
  //    설정부터 읽는다. 무조건 던지면 `eas env:list` 같은 명령이 통째로 막힌다
  //    (2026-08-05에 실제로 막혔다).
  //
  // 그래서 둘로 나눈다:
  //   빌드 기계 (EAS_BUILD=1)   멈춘다 — 여기서 없으면 진짜로 회색 판이 나온다
  //   그 밖 (내 맥·도구)         경고만 — 도구가 막히지 않게
  if (!clientId) {
    const 안내 =
      'EXPO_PUBLIC_NAVER_MAP_CLIENT_ID 가 없다.\n' +
      '  내 맥이면  mobile/.env 를 본다\n' +
      '  EAS 빌드면 eas.json 의 environment 와 EAS 환경변수를 확인한다';

    if (process.env.EAS_BUILD) throw new Error(안내);
    console.warn(`[app.config] ${안내}\n  → 지금은 넘어가지만 지도는 회색 판만 나온다`);
  }

  return {
    ...config,
    plugins: (config.plugins ?? []).map((plugin) =>
      plugin === NAVER_MAP_PLUGIN ? [plugin, { client_id: clientId }] : plugin
    ),
  };
};
