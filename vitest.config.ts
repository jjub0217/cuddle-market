import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

import { playwright } from '@vitest/browser-playwright';

import react from '@vitejs/plugin-react';

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// project가 둘이다. 하는 일도 도는 곳도 다르다.
//
//   unit       jsdom에서 컴포넌트·훅을 돌린다. `pnpm test`가 이것만 돌린다
//   storybook  진짜 크로미움에서 스토리를 돌린다. 브라우저를 띄우므로 느리다
//
// `pnpm test`가 unit만 돌리는 이유: 게이트에서 매번 브라우저를 띄우면 몇 분이 걸린다.
// 스토리북 쪽은 `pnpm test:storybook`으로 따로 돌린다.
export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        plugins: [react()],
        // tsconfig의 paths는 vite가 안 읽는다. 같은 규칙을 여기에도 적어 준다.
        //   tsconfig.json  "@/*": ["./src/*"]
        resolve: {
          alias: { '@': path.join(dirname, 'src') },
        },
        test: {
          name: 'unit',
          environment: 'jsdom',
          globals: true,
          setupFiles: [path.join(dirname, 'vitest.setup.ts')],
          include: ['src/**/*.{test,spec}.{ts,tsx}'],
          // 스토리는 storybook project가 본다. 여기서 또 보면 두 번 돈다
          exclude: ['**/node_modules/**', '**/*.stories.*'],
        },
      },
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
