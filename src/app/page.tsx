import { prisma } from "@/lib/db";
import { AddEntryForm } from "@/components/add-entry-form";
import { DashboardDnd } from "@/components/dashboard-dnd";
import { LogoutButton } from "@/components/logout-button";
import { AddCategoryButton } from "@/components/add-category-button";

export const dynamic = "force-dynamic";

export default async function Home() {
  const entries = await prisma.entry.findMany({
    include: { category: true },
    orderBy: [{ category: { order: "asc" } }, { order: "asc" }],
  });

  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
  });

  const isEmpty = entries.length === 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">kidash</h1>
          <div className="flex items-center gap-2">
            <AddCategoryButton />
            <LogoutButton />
          </div>
        </div>
        <AddEntryForm />
      </header>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 text-2xl">
            +
          </div>
          <h2 className="text-lg font-medium text-zinc-300">No entries yet</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Add a URL or IP above to get started
          </p>
        </div>
      ) : (
        <DashboardDnd key={`${entries.length}-${categories.length}`} categories={categories} entries={entries} />
      )}
    </main>
  );
}
