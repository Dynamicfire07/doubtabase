export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-base-200 p-4 lg:p-6">
      <div className="space-y-4">
        <div className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="skeleton h-8 w-56" />
            <div className="skeleton h-4 w-80" />
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="card border border-base-300 bg-base-100 shadow-sm">
              <div className="card-body gap-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="skeleton h-9 w-full rounded-lg" />
                ))}
              </div>
            </div>
          </aside>

          <section className="card border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body space-y-3">
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="skeleton h-12 w-full rounded-lg" />
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
