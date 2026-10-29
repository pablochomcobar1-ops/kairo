import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // WebGL code updates three.js objects (uniforms, camera, fog) every frame on purpose:
    // that is how React Three Fiber animates without re-rendering React 60 times a second.
    // The React Compiler's immutability rule can't tell those apart from React state, so it
    // is off for this folder only and stays on everywhere else.
    files: ["src/components/three/**/*.{ts,tsx}"],
    rules: { "react-hooks/immutability": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
