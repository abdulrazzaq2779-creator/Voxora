export default function AppLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-8 sm:px-7 sm:py-10" aria-busy="true">
      <span className="sr-only">Loading page…</span>
      <div className="h-7 w-56 rounded-lg bg-[#eceef5]" />
      <div className="mt-3 h-4 w-80 max-w-full rounded-lg bg-[#f1f2f7]" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl border border-hairline bg-surface" />
        ))}
      </div>
      <div className="mt-4 h-64 rounded-2xl border border-hairline bg-surface" />
    </div>
  );
}
