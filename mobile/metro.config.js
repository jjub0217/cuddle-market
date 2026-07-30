// Expo 모노레포 설정 — mobile이 워크스페이스 바깥의 packages/shared를 찾도록.
// (Expo 공식 모노레포 가이드 형태)
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '..')

const config = getDefaultConfig(projectRoot)

// 1) 워크스페이스 전체를 감시(옆 폴더 packages/shared 변경 감지)
//    Expo 기본 watchFolders를 덮어쓰지 않고 workspaceRoot만 추가(expo-doctor 권고).
config.watchFolders = [...(config.watchFolders ?? []), workspaceRoot]

// 2) 모듈 해석 경로: 앱의 node_modules → 루트 node_modules 순
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

// 3) react는 반드시 한 벌만 번들되게 못을 박는다.
//
// 이 저장소는 워크스페이스에 react가 두 벌이다 — 웹(Next 16)이 19.2.3,
// mobile(RN 0.81)이 19.1.0. 내 맥에서는 mobile/node_modules/react로 바르게 풀리지만,
// EAS 빌드 서버는 pnpm install을 새로 돌려 배치가 달라져 두 벌이 다 번들에 들어갔다.
// (APK 안 번들에서 "19.2.3"과 "19.1.0" 문자열을 둘 다 확인)
//
// 앱 하나에 react가 두 벌이면 컴포넌트는 A의 react로 만들어지는데 훅은 B가 처리하려 해서
// 내부 상태가 null이 된다 → 앱이 켜자마자 죽었다:
//   TypeError: Cannot read property 'useMemo' of null   at ExpoRoot
//
// 웹은 건드리지 않고 앱 번들에서만 react를 고정한다. jsx-runtime 같은 하위 경로도
// 같은 벌에서 와야 하므로 'react/...'까지 함께 잡는다.
const PINNED = ['react', 'react-dom']

const originalResolveRequest = config.resolver.resolveRequest

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const isPinned = PINNED.some((p) => moduleName === p || moduleName.startsWith(`${p}/`))

  if (isPinned) {
    try {
      return {
        type: 'sourceFile',
        filePath: require.resolve(moduleName, { paths: [projectRoot] }),
      }
    } catch {
      // 하위 경로가 없을 수도 있다(예: 조건부 export). 그러면 기본 해석으로 넘긴다.
    }
  }

  return originalResolveRequest
    ? originalResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform)
}

module.exports = config
