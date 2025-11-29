import { loadBacklog } from "@/actions/backlog";
import { Dashboard } from "@/components/dashboard";

export default async function HomePage() {
  const { items, config, error } = await loadBacklog();

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Error</h1>
          <p className="text-[var(--muted-foreground)]">{error}</p>
        </div>
      </main>
    );
  }

  return <Dashboard initialItems={items} initialConfig={config} />;
}
