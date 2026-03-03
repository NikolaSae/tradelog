//src/app/loading.tsx

export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center animate-pulse">
          <span className="text-primary-foreground font-bold">T</span>
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
      </div>
    </div>
  )
}