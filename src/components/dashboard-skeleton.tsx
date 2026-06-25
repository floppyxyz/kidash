export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="p-4"
          style={{
            height: `${200 + i * 40}px`,
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
            background: "var(--card)",
          }}
        >
          <div className="mb-4 h-4 w-32 animate-pulse rounded" style={{ background: "var(--card-hover)" }} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((j) => (
              <div
                key={j}
                className="animate-pulse p-4"
                style={{
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--border)",
                  background: "var(--card-hover)",
                }}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg" style={{ background: "var(--border)" }} />
                  <div className="h-3 w-24 rounded" style={{ background: "var(--border)" }} />
                </div>
                <div className="mb-2 h-2 w-full rounded" style={{ background: "var(--border)" }} />
                <div className="h-2 w-2/3 rounded" style={{ background: "var(--border)" }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
