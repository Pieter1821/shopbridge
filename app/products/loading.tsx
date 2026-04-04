import { AppLoadingShell } from "@/components/ui/AppLoadingShell";

export default function ProductsLoading() {
  return (
    <AppLoadingShell
      title="Loading the latest drops"
      subtitle="Fetching live catalogue data, pricing, and stock so the grid stays accurate."
    />
  );
}
