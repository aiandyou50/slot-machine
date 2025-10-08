import { defineConfig, loadEnv } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(({ mode }) => {
  // (KO) .env 파일에서 환경 변수를 로드합니다.
  // (EN) Load env file based on `mode`.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      nodePolyfills({
        // (KO) 'Buffer'와 같은 Node.js 전역 변수 폴리필 활성화
        // (EN) To polyfill `Buffer` and other Node.js globals
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
        // (KO) 'crypto'와 같은 Node.js 내장 모듈 폴리필 활성화
        // (EN) To polyfill Node.js built-in modules
        protocolImports: true,
      }),
    ],
    define: {
      // (KO) package.json의 버전을 프론트엔드에 노출시킵니다.
      // (EN) Expose the version from package.json to the frontend.
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version),
    },
    resolve: {
      alias: {
        // (KO) 'buffer' 모듈을 브라우저용 'buffer' 패키지로 대체합니다.
        // (EN) Alias 'buffer' to the browser-friendly 'buffer' package.
        buffer: 'buffer/',
      },
    },
  };
});