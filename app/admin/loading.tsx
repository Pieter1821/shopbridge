import { AppLoadingShell } from "@/components/ui/AppLoadingShell";

export default function AdminLoading() {
  return (
    <AppLoadingShell
      title="Opening your operations dashboard"
      subtitle="Syncing product, category, and staff data so the admin workspace stays current."
      accent="admin"
    />
  );
}
