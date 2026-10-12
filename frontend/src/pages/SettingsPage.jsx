import PageShell from "../components/ui/PageShell";
import Card from "../components/ui/Card";
import StateMessage from "../components/ui/StateMessage";

export default function SettingsPage() {
  return (
    <PageShell title="Settings" subtitle="Workspace preferences.">
      <Card><StateMessage title="No settings yet" text="Workspace and notification preferences will live here." /></Card>
    </PageShell>
  );
}
