import { defineConfig, loadEnv } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(({ mode }) => {
  // (KO) .env 파일에서 환경 변수를 로드합니다.
  // (EN) Load env file based on `mode`.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      nodePolyfills({
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
        protocolImports: true,
      }),
    ],
    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version),
    },
    optimizeDeps: {
      include: ['tonweb', 'buffer'], // (KO) tonweb과 buffer를 명시적으로 포함 (EN) Explicitly include tonweb and buffer
    },
    resolve: {
      alias: {
        buffer: 'buffer/',
      },
    },
  };
});