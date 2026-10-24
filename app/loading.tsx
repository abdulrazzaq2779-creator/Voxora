export default function Loading() {
  return (
    <main
      id="main"
      className="flex min-h-dvh items-center justify-center bg-bg"
      aria-busy="true"
    >
      <span className="flex items-center gap-3 text-[14px] text-slate">
        <span
          className="h-5 w-5 animate-spin rounded-full border-2 border-hairline border-t-accent"
          aria-hidden="true"
        />
        Loading…
      </span>
    </main>
  );
}
