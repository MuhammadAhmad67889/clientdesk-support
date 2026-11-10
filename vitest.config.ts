import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    // Mirrors the "@/*" path alias from tsconfig.json. Vitest does not
    // read tsconfig paths on its own, so without this any "@/..." import
    // in tested code fails to resolve.
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
});
