import { defineConfig, globalIgnores } from 'eslint/config' // ESLint 설정 헬퍼 함수
import nextVitals from 'eslint-config-next/core-web-vitals' // Next.js Core Web Vitals 규칙 (React, Hooks, 접근성 포함)
import nextTs from 'eslint-config-next/typescript' // Next.js TypeScript 규칙
import prettier from 'eslint-config-prettier' // Prettier와 충돌하는 ESLint 규칙 비활성화
import react from 'eslint-plugin-react' // React 컴포넌트 관련 규칙
import reactHooks from 'eslint-plugin-react-hooks' // React Hooks 관련 규칙
import globals from 'globals' // 글로벌 변수 정의 (window, document 등)

const eslintConfig = defineConfig([
  // 1. Next.js 기본 규칙들 적용
  ...nextVitals, // Core Web Vitals 최적화 규칙 (React, Hooks, 접근성, import 규칙 포함)
  ...nextTs, // TypeScript 권장 규칙

  // 2. 무시할 파일/폴더 설정
  globalIgnores([
    '.next/**', // Next.js 빌드 결과물
    'out/**', // 정적 빌드 결과물
    'build/**', // 빌드 폴더
    'next-env.d.ts', // Next.js 타입 정의
    'node_modules', // 외부 패키지
    '*.config.js', // 설정 파일들
    '*.config.ts', // TypeScript 설정 파일들
    '*.config.mjs', // ESM 설정 파일들
    'public', // 정적 자원 폴더
  ]),

  // 3. 메인 설정 블록
  {
    // 적용할 파일 확장자 지정
    files: ['**/*.{ts,tsx}'],

    // 사용할 플러그인들 등록
    plugins: {
      react, // React 컴포넌트 관련
      'react-hooks': reactHooks, // React Hooks 관련
    },

    // 언어 및 파싱 설정
    languageOptions: {
      ecmaVersion: 2023, // 최신 JavaScript 문법 지원
      sourceType: 'module', // ES6 모듈 시스템 사용
      // 사용 가능한 글로벌 변수들 정의
      globals: {
        ...globals.browser, // window, document, console 등 브라우저 API
        ...globals.es2023, // Promise, Array.prototype.at 등 최신 JS API
      },
    },

    // 플러그인별 추가 설정
    settings: {
      react: {
        version: 'detect', // 설치된 React 버전 자동 감지
      },
    },

    rules: {
      // ===== 기본적인 JavaScript/TypeScript 품질 규칙 =====
      'prefer-const': 'warn', // 재할당하지 않는 변수는 const 사용 권장 (경고만)

      'no-var': 'error', // var 키워드 사용 금지 (let, const만 사용)

      'no-unused-vars': 'off', // JavaScript 미사용 변수 규칙 비활성화 (TypeScript가 처리)

      '@typescript-eslint/no-unused-vars': [
        'warn', // 에러 대신 경고로 설정
        {
          argsIgnorePattern: '^_', // _로 시작하는 매개변수는 미사용 허용
          varsIgnorePattern: '^_', // _로 시작하는 변수는 미사용 허용
        },
      ],

      // ===== TypeScript 기본 규칙 =====
      '@typescript-eslint/no-explicit-any': 'warn', // any 타입 사용시 경고만 (에러 아님)
      '@typescript-eslint/explicit-function-return-type': 'off', // 함수 리턴 타입 명시 강제 안함
      '@typescript-eslint/explicit-module-boundary-types': 'off', // 모듈 경계 타입 명시 강제 안함

      // ===== React 기본 베스트 프랙티스 =====
      'react/prop-types': 'off', // PropTypes 사용 강제 안함 (TypeScript 사용)
      'react/react-in-jsx-scope': 'off', // React import 강제 안함 (React 17+)
      'react/jsx-uses-react': 'off', // React 사용 감지 안함 (React 17+)

      'react/jsx-boolean-value': 'warn', // boolean prop 축약 권장

      'react/jsx-fragments': 'warn', // Fragment 단축 문법 권장

      'react/jsx-no-useless-fragment': 'warn', // 불필요한 Fragment 경고

      // ===== 기본적인 코드 품질 =====
      'no-console': 'warn', // console.log 사용시 경고 (개발 중에는 필요할 수 있음)
      'no-debugger': 'warn', // debugger 문 사용시 경고 (에러 아님)
      'no-duplicate-imports': 'warn', // 중복 import 경고

      // ===== 팀 규칙 =====
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'], // 타입 정의는 interface 사용 강제

      'react/function-component-definition': [
        'error',
        {
          namedComponents: 'function-declaration', // 이름 있는 컴포넌트는 function 선언식
          unnamedComponents: 'arrow-function', // 익명 컴포넌트는 화살표 함수
        },
      ],
    },
  },

  // 4. Prettier와 충돌하는 ESLint 규칙들 비활성화
  prettier, // 포맷팅은 Prettier가 담당, ESLint는 코드 품질만 담당
])

export default eslintConfig
