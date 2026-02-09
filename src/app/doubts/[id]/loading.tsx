export default function DoubtDetailLoading() {
  return (
    <main className="min-h-screen bg-base-200 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="skeleton h-9 w-56" />
        <div className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body space-y-4">
            <div className="skeleton h-8 w-2/3" />
            <div className="skeleton h-5 w-1/2" />
            <div className="skeleton h-32 w-full rounded-box" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="skeleton h-52 w-full rounded-box" />
              <div className="skeleton h-52 w-full rounded-box" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
