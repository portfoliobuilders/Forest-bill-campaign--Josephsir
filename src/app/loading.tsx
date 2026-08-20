export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <div className="h-4 w-40 animate-pulse rounded bg-rule" />
      <div className="mt-6 h-10 w-full max-w-xl animate-pulse rounded bg-rule" />
      <div className="mt-4 h-24 w-full animate-pulse rounded bg-rule" />
      <div className="mt-8 h-12 w-48 animate-pulse rounded bg-rule" />
    </div>
  )
}
