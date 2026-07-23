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

module.exports = config
