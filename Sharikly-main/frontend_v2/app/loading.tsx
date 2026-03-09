export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] px-4 text-foreground" aria-hidden="true">
      <div className="w-10 h-10 border-2 border-muted border-t-foreground rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground mt-4">Loading...</p>
    </div>
  );
}
