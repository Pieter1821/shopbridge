import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["__tests__/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["tests/**", "node_modules/**", ".next/**"],
    coverage: {
      provider: "v8",
      include: [
        "lib/utils.ts",
        "store/cart-store.ts",
        "components/shared/StockBadge.tsx",
        "components/shared/PriceDisplay.tsx",
        "components/shared/ProductAvailabilityBadge.tsx",
      ],
      thresholds: {
        "lib/utils.ts": { lines: 80, functions: 80 },
      },
    },
  },
});
