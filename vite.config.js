import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(() => {
  // (KO) .env 파일 로딩은 현재 필요하지 않으므로 관련 코드를 제거했습니다.
  // (EN) Removed env loading as it's not currently needed.

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
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(
        process.env.npm_package_version
      ),
    },
    optimizeDeps: {
      include: ['buffer'], // (KO) buffer를 명시적으로 포함 (EN) Explicitly include buffer
    },
    resolve: {
      alias: {
        buffer: 'buffer/',
      },
    },
  };
});
