export default function ProductsLoading() {
  return (
    <div className="min-h-screen px-6 lg:px-12 py-24 md:py-32">
      <div className="max-w-[1400px] mx-auto animate-pulse">
        <div className="mb-12 md:mb-16">
          <div className="h-2 w-16 bg-border rounded mb-3" />
          <div className="h-5 w-36 bg-border rounded" />
        </div>
        <div className="flex flex-wrap gap-2 mb-12">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-border rounded" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-10">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-square bg-card" />
              <div className="h-2 w-16 bg-border rounded" />
              <div className="h-4 w-32 bg-border rounded" />
              <div className="h-3 w-20 bg-border rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
