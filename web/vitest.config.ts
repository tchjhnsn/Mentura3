import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@reflect/core": fileURLToPath(new URL("../packages/core/src", import.meta.url)),
      "@reflect/virtu": fileURLToPath(new URL("../packages/virtu/src", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // The core's one package import (`@reflect/core/life-body`), resolved from here since the core installs nothing.
      zod: fileURLToPath(new URL("./node_modules/zod", import.meta.url)),
    },
  },
  server: { fs: { allow: [".."] } },
  test: { include: ["src/**/*.test.ts", "src/**/*.test.tsx", "../packages/core/src/**/*.test.ts", "../packages/cli/*.test.ts", "../packages/virtu/*.test.ts"] },
});
