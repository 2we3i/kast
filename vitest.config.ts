import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts", "tests/unit/**/*.test.ts"],
    environment: "node",
    // PDF rendering and the first import of the AI and export modules take
    // several seconds on a cold CI runner.
    testTimeout: 30_000,
    coverage: {
      provider: "v8",
      include: [
        "src/lib/ats/**",
        "src/lib/import/**",
        "src/lib/ai/**",
        "src/lib/export/**",
        "src/lib/interchange/**",
        "src/lib/resume/migrations*.ts",
      ],
      reporter: ["text", "html"],
    },
  },
});
