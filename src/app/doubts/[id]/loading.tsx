export default function DoubtDetailLoading() {
  return (
    <main className="detail-page min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="skeleton h-9 w-56" />
        <div className="detail-card overflow-hidden rounded-[28px]">
          <div className="space-y-4 border-b border-slate-200/80 px-6 py-6">
            <div className="skeleton h-8 w-2/3" />
            <div className="skeleton h-5 w-1/2" />
            <div className="flex gap-2">
              <div className="skeleton h-6 w-24 rounded-full" />
              <div className="skeleton h-6 w-20 rounded-full" />
              <div className="skeleton h-6 w-28 rounded-full" />
            </div>
          </div>
          <div className="grid gap-4 px-6 py-6 lg:grid-cols-[minmax(0,1.15fr)_320px]">
            <div className="space-y-4">
              <div className="skeleton h-40 w-full rounded-[22px]" />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="skeleton h-52 w-full rounded-[22px]" />
                <div className="skeleton h-52 w-full rounded-[22px]" />
              </div>
            </div>
            <div className="skeleton h-72 w-full rounded-[22px]" />
          </div>
            </div>
      </div>
    </main>
  );
}
