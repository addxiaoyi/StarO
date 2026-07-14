import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".local/**",
    ".playwright-cli/**",
    ".playwright-mcp/**",
    ".codegraph/**",
    "playwright-report/**",
    "test-results/**",
    "verification-archive/**",
    "deploy-package/**",
    "out/**",
    "build/**",
    "*.tar.gz",
    "*.zip",
    "deploy-build.bat",
    "startup-check.sh",
    "update-*.sh",
    "update-*.bat",
    "check-server.sh",
    "check-server.ps1",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
