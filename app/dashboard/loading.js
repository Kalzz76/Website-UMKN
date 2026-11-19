export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="section-top-row">
        <div
          className="hero-banner-card bg-emerald-950/40 border border-white/10 p-6 rounded-3xl"
          style={{ gridColumn: "1 / -1" }}
        >
          <div className="h-4 bg-white/20 rounded w-24 mb-3"></div>
          <div className="h-8 bg-white/30 rounded w-64 mb-2"></div>
          <div className="h-4 bg-white/20 rounded w-96 max-w-full"></div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.6fr 1fr",
          gap: "16px",
          marginTop: "16px",
        }}
      >
        <div className="content-card bg-white/90 p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="h-5 bg-stone-200 rounded w-48"></div>
            <div className="h-4 bg-stone-200 rounded w-24"></div>
          </div>
          <div className="space-y-3">
            <div className="h-16 bg-stone-100 rounded-2xl"></div>
            <div className="h-16 bg-stone-100 rounded-2xl"></div>
            <div className="h-16 bg-stone-100 rounded-2xl"></div>
          </div>
        </div>

        <div className="content-card bg-white/90 p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="h-5 bg-stone-200 rounded w-40"></div>
            <div className="h-4 bg-stone-200 rounded w-20"></div>
          </div>
          <div className="space-y-3">
            <div className="h-12 bg-stone-100 rounded-xl"></div>
            <div className="h-12 bg-stone-100 rounded-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
