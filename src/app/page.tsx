import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { AddEntryForm } from "@/components/add-entry-form";
import { BentoGridWrapper } from "@/components/bento-grid-wrapper";
import { LogoutButton } from "@/components/logout-button";
import { AddCategoryButton } from "@/components/add-category-button";
import { ThemeSwitcher } from "@/components/theme-provider";
import { ViewModeToggle } from "@/components/view-mode";
import { PrivacyModeToggle } from "@/components/privacy-mode-toggle";
import { SettingsButton } from "@/components/settings-button";
import { DashboardSkeleton } from "@/components/dashboard-skeleton";

export const dynamic = "force-dynamic";

async function DashboardContent() {
  const entries = await prisma.entry.findMany({
    include: { category: true },
    orderBy: [{ category: { order: "asc" } }, { order: "asc" }],
  });

  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
  });

  const isEmpty = entries.length === 0 && categories.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl"
          style={{ background: "var(--card-hover)", color: "var(--muted)" }}
        >
          +
        </div>
        <h2 className="text-lg font-medium" style={{ color: "var(--foreground)" }}>No entries yet</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          Add a URL or IP above to get started
        </p>
      </div>
    );
  }

  return (
    <BentoGridWrapper
      key={entries.map((e) => `${e.id}:${e.categoryId}`).join(",")}
      categories={categories}
      entries={entries}
    />
  );
}

export default async function Home() {
  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-8">
      <header className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">kidash</h1>
          <div className="flex items-center gap-2">
            <AddCategoryButton />
            <ViewModeToggle />
            <PrivacyModeToggle />
            <ThemeSwitcher />
            <SettingsButton />
            <LogoutButton />
          </div>
        </div>
        <AddEntryForm />
      </header>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </main>
  );
}
